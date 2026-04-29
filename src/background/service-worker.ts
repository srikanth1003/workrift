import { addEvent, clearOldEvents, getEventsByDateRange, getDomainStats, addActivity, getActivitiesByDateRange, clearDataByRange, clearAllData } from "@shared/db";
import { createWorkEvent } from "@shared/events";
import {
  detectContextSwitching,
  detectRepetitiveSequences,
  detectFrequentCopyPaste,
} from "@shared/patterns";
import { analyzeWorkflow } from "@shared/workflow-analyzer";
import type { AwsCredentials } from "@shared/workflow-analyzer";
import { detectWorkflowSequences } from "@shared/workflow-sequences";

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

interface AnalyzeWorkflowMessage {
  type: "ANALYZE_WORKFLOW";
  forceRefresh?: boolean;
  startTime?: number;
  endTime?: number;
}

interface GetActivitiesRangeMessage {
  type: "GET_ACTIVITIES_RANGE";
  startTime: number;
  endTime: number;
}

interface SaveCredentialsMessage {
  type: "SAVE_AWS_CREDENTIALS";
  payload: AwsCredentials;
}

interface GetCredentialsMessage {
  type: "GET_AWS_CREDENTIALS";
}

interface GetWorkflowSequencesMessage {
  type: "GET_WORKFLOW_SEQUENCES";
  startTime: number;
  endTime: number;
}

interface ClearDataMessage {
  type: "CLEAR_DATA";
  startTime?: number;
  endTime?: number;
  clearAll?: boolean;
}

type Message =
  | ContentMessage
  | GetStatsMessage
  | GetPatternsMessage
  | GetTodayEventsMessage
  | ActivityEventMessage
  | GetActivitiesMessage
  | GetActivitiesRangeMessage
  | AnalyzeWorkflowMessage
  | SaveCredentialsMessage
  | GetCredentialsMessage
  | GetWorkflowSequencesMessage
  | ClearDataMessage;

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
  } else if (message.type === "GET_ACTIVITIES_RANGE") {
    const { startTime, endTime } = message as GetActivitiesRangeMessage;
    const activities = await getActivitiesByDateRange(startTime, endTime);
    sendResponse({ activities });
  } else if (message.type === "ANALYZE_WORKFLOW") {
    const msg = message as AnalyzeWorkflowMessage;
    const now = Date.now();
    const rangeStart = msg.startTime ?? new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const rangeEnd = msg.endTime ?? now;
    const cacheKey = `analysisCache_${rangeStart}`;

    try {
      if (!msg.forceRefresh) {
        const cached = await chrome.storage.local.get(cacheKey);
        const cache = cached[cacheKey] as { analysis: unknown; timestamp: number } | undefined;
        if (cache && (now - cache.timestamp) < 4 * 60 * 60_000) {
          sendResponse({ analysis: cache.analysis, cachedAt: cache.timestamp });
          return;
        }
      }

      const stored = await chrome.storage.local.get("awsCredentials");
      const credentials = stored.awsCredentials as AwsCredentials | undefined;
      if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
        sendResponse({ error: "AWS credentials not configured. Go to Settings to add them." });
        return;
      }
      const activities = await getActivitiesByDateRange(rangeStart, rangeEnd);
      if (activities.length === 0) {
        sendResponse({ error: "No activities recorded for this period." });
        return;
      }
      const analysis = await analyzeWorkflow(activities, credentials);
      const timestamp = Date.now();
      await chrome.storage.local.set({ [cacheKey]: { analysis, timestamp } });
      sendResponse({ analysis, cachedAt: timestamp });
    } catch (err) {
      sendResponse({ error: `Analysis failed: ${err instanceof Error ? err.message : String(err)}` });
    }
  } else if (message.type === "GET_WORKFLOW_SEQUENCES") {
    const msg = message as GetWorkflowSequencesMessage;
    const activities = await getActivitiesByDateRange(msg.startTime, msg.endTime);
    const sequences = detectWorkflowSequences(activities);
    sendResponse({ sequences });
  } else if (message.type === "SAVE_AWS_CREDENTIALS") {
    const { payload } = message as SaveCredentialsMessage;
    await chrome.storage.local.set({ awsCredentials: payload });
    sendResponse({ ok: true });
  } else if (message.type === "GET_AWS_CREDENTIALS") {
    const stored = await chrome.storage.local.get("awsCredentials");
    sendResponse({ credentials: stored.awsCredentials ?? null });
  } else if (message.type === "CLEAR_DATA") {
    const msg = message as ClearDataMessage;
    try {
      if (msg.clearAll) {
        await clearAllData();
        const allKeys = await chrome.storage.local.get(null);
        const cacheKeys = Object.keys(allKeys).filter(k => k.startsWith("analysisCache_"));
        if (cacheKeys.length > 0) await chrome.storage.local.remove(cacheKeys);
        sendResponse({ ok: true, cleared: "all" });
      } else if (msg.startTime && msg.endTime) {
        const result = await clearDataByRange(msg.startTime, msg.endTime);
        const cacheKey = `analysisCache_${msg.startTime}`;
        await chrome.storage.local.remove(cacheKey);
        sendResponse({ ok: true, cleared: result });
      } else {
        sendResponse({ error: "Provide startTime/endTime or clearAll" });
      }
    } catch (err) {
      sendResponse({ error: `Clear failed: ${err instanceof Error ? err.message : String(err)}` });
    }
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
