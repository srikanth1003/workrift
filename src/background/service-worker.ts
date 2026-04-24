import { addEvent, clearOldEvents, getEventsByDateRange, getDomainStats, addActivity, getActivitiesByDateRange } from "@shared/db";
import { createWorkEvent } from "@shared/events";
import {
  detectContextSwitching,
  detectRepetitiveSequences,
  detectFrequentCopyPaste,
} from "@shared/patterns";

let lastActiveTabId: number | null = null;

export async function handleTabActivated(
  activeInfo: chrome.tabs.TabActiveInfo
): Promise<void> {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || !tab.url.startsWith("http")) return;

    const event = createWorkEvent("tab_switch", tab.url, tab.title ?? "", {
      fromTabId: lastActiveTabId ?? -1,
      toTabId: activeInfo.tabId,
    });
    await addEvent(event);
    lastActiveTabId = activeInfo.tabId;
  } catch {
    // Tab may have been closed between activation and get
  }
}

export async function handleTabUpdated(
  _tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
): Promise<void> {
  if (!changeInfo.url) return;
  if (!tab.url || !tab.url.startsWith("http")) return;

  const event = createWorkEvent("navigation", tab.url, tab.title ?? "", {});
  await addEvent(event);
}

interface ContentMessage {
  type: "CONTENT_EVENT";
  payload: {
    type: "copy" | "paste" | "form_fill" | "text_selection";
    url: string;
    title: string;
    metadata: Record<string, string | number | boolean>;
  };
}

interface GetStatsMessage {
  type: "GET_TODAY_STATS";
}

interface GetPatternsMessage {
  type: "GET_PATTERNS";
}

interface GetTodayEventsMessage {
  type: "GET_TODAY_EVENTS";
}

interface ActivityEventMessage {
  type: "ACTIVITY_EVENT";
  payload: import("@shared/types").ActivityEvent;
}

interface GetActivitiesMessage {
  type: "GET_TODAY_ACTIVITIES";
}

type Message = ContentMessage | GetStatsMessage | GetPatternsMessage | GetTodayEventsMessage | ActivityEventMessage | GetActivitiesMessage;

export async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
): Promise<void> {
  if (message.type === "CONTENT_EVENT") {
    const { type, url, title, metadata } = message.payload;
    const event = createWorkEvent(type, url, title, metadata);
    await addEvent(event);
    sendResponse({ ok: true });
  } else if (message.type === "GET_TODAY_STATS") {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const events = await getEventsByDateRange(startOfDay.getTime(), now);
    const domainStats = await getDomainStats(startOfDay.getTime(), now);

    const tabSwitches = events.filter((e) => e.type === "tab_switch").length;
    const copyPastes = events.filter(
      (e) => e.type === "copy" || e.type === "paste"
    ).length;
    const domains = new Set(events.map((e) => e.domain).filter(Boolean));

    sendResponse({
      totalEvents: events.length,
      tabSwitches,
      copyPastes,
      uniqueDomains: domains.size,
      activeMinutes: Math.round(events.length > 0
        ? (events[events.length - 1].timestamp - events[0].timestamp) / 60_000
        : 0),
      domainStats,
    });
  } else if (message.type === "GET_TODAY_EVENTS") {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const events = await getEventsByDateRange(startOfDay.getTime(), now);
    sendResponse({ events });
  } else if (message.type === "GET_PATTERNS") {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const events = await getEventsByDateRange(startOfDay.getTime(), now);

    const contextSwitching = detectContextSwitching(events);
    const sequences = detectRepetitiveSequences(events);
    const copyPaste = detectFrequentCopyPaste(events);

    sendResponse({
      patterns: [...contextSwitching, ...sequences, ...copyPaste],
    });
  } else if (message.type === "ACTIVITY_EVENT") {
    const { payload } = message as ActivityEventMessage;
    await addActivity(payload);
    sendResponse({ ok: true });
  } else if (message.type === "GET_TODAY_ACTIVITIES") {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const activities = await getActivitiesByDateRange(startOfDay.getTime(), now);
    sendResponse({ activities });
  }
}

function init(): void {
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onUpdated.addListener(handleTabUpdated);

  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      handleMessage(message, sender, sendResponse);
      return true;
    }
  );

  chrome.alarms.create("cleanup", { periodInMinutes: 60 * 24 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "cleanup") {
      await clearOldEvents(30);
    }
  });

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.tabs.create({
        url: chrome.runtime.getURL("src/onboarding/index.html"),
      });
    }
  });
}

init();
