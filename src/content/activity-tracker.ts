import { detectApp } from "./app-detectors";
import { analyzePageStructure, getFieldLabel } from "./page-analyzer";
import type { ActivityType, ActivityContext, ActivityEvent } from "@shared/types";

function classifyActivity(app: string, section: string, mode: string, pageMode: string): ActivityType {
  if (mode === "composing" && (app === "gmail" || app === "outlook")) return "email_composing";
  if (mode === "composing" && (app === "slack" || app === "linkedin")) return "messaging";
  if (mode === "editing" && (app === "salesforce" || app === "hubspot")) return "crm_data_entry";
  if (mode === "searching" || section.includes("search")) return "search_research";
  if (app === "linkedin" && section === "profile") return "prospect_research";
  if (app === "google-docs" || app === "notion") return "document_writing";
  if (app === "google-sheets") return "spreadsheet_editing";
  if (app === "google-calendar") return "scheduling";
  if (pageMode === "form") return "form_filling";
  if (pageMode === "article") return "content_reading";
  if (pageMode === "compose") return "email_composing";
  return "general_browsing";
}

interface TrackerState {
  startTime: number;
  lastActiveTime: number;
  formFieldsInteracted: Set<string>;
  copyPasteCount: number;
  typingStartTime: number | null;
  totalTypingMs: number;
  lastUrl: string;
}

let state: TrackerState | null = null;
let flushInterval: ReturnType<typeof setInterval> | null = null;

function sendActivity(activity: Omit<ActivityEvent, "id">): void {
  chrome.runtime.sendMessage(
    {
      type: "ACTIVITY_EVENT",
      payload: activity,
    },
    () => {}
  );
}

function buildActivityEvent(): Omit<ActivityEvent, "id"> | null {
  if (!state) return null;

  const now = Date.now();
  const duration = now - state.startTime;
  if (duration < 3000) return null;

  const appContext = detectApp(location.href, location.pathname);
  const pageStructure = analyzePageStructure();

  const activityType = classifyActivity(
    appContext.app,
    appContext.section,
    appContext.mode,
    pageStructure.pageMode
  );

  const context: ActivityContext = {
    app: appContext.app,
    section: appContext.section,
    mode: appContext.mode,
    detail: appContext.detail,
    pageMode: pageStructure.pageMode,
    headings: pageStructure.headings,
    formFields: pageStructure.activeFormFields.map((f) => f.label),
    buttons: pageStructure.visibleButtons,
  };

  const domain = location.hostname.replace(/^www\./, "");

  return {
    type: activityType,
    app: appContext.app,
    section: appContext.section,
    url: location.href,
    domain,
    title: document.title,
    startTime: state.startTime,
    endTime: now,
    durationMs: duration,
    formFieldsInteracted: Array.from(state.formFieldsInteracted),
    copyPasteCount: state.copyPasteCount,
    typingDurationMs: state.totalTypingMs,
    context,
  };
}

function flush(): void {
  const activity = buildActivityEvent();
  if (activity) {
    sendActivity(activity);
  }
  resetState();
}

function resetState(): void {
  state = {
    startTime: Date.now(),
    lastActiveTime: Date.now(),
    formFieldsInteracted: new Set(),
    copyPasteCount: 0,
    typingStartTime: null,
    totalTypingMs: 0,
    lastUrl: location.href,
  };
}

function onActivity(): void {
  if (!state) resetState();
  state!.lastActiveTime = Date.now();
}

export function trackFormField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  if (!state) resetState();
  const label = getFieldLabel(field);
  state!.formFieldsInteracted.add(label);
  onActivity();
}

export function trackCopyPaste(): void {
  if (!state) resetState();
  state!.copyPasteCount++;
  onActivity();
}

export function trackTypingStart(): void {
  if (!state) resetState();
  if (!state!.typingStartTime) {
    state!.typingStartTime = Date.now();
  }
  onActivity();
}

export function trackTypingEnd(): void {
  if (!state?.typingStartTime) return;
  state.totalTypingMs += Date.now() - state.typingStartTime;
  state.typingStartTime = null;
}

export function initActivityTracker(): void {
  resetState();
  flushInterval = setInterval(flush, 30_000);

  window.addEventListener("beforeunload", () => {
    flush();
  });

  let urlCheckInterval = setInterval(() => {
    if (state && location.href !== state.lastUrl) {
      flush();
    }
  }, 2000);
}

export function stopActivityTracker(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}
