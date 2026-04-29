import { detectApp } from "./app-detectors";
import { analyzePageStructure, getFieldLabel } from "./page-analyzer";
import type { ActivityContext, ActivityEvent } from "@shared/types";

const MAX_GAP_MS = 60_000;

interface TrackerState {
  startTime: number;
  activeDurationMs: number;
  activeResumedAt: number | null;
  lastTickAt: number;
  formFieldsInteracted: Set<string>;
  clickedButtons: string[];
  clickedLinks: string[];
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

function tick(): void {
  if (!state || !state.activeResumedAt) return;
  const now = Date.now();
  const elapsed = now - state.lastTickAt;
  if (elapsed > MAX_GAP_MS) {
    state.activeResumedAt = now;
  }
  state.lastTickAt = now;
}

function getActiveDuration(): number {
  if (!state) return 0;
  tick();
  if (!state.activeResumedAt) return state.activeDurationMs;
  return state.activeDurationMs + (Date.now() - state.activeResumedAt);
}

function pause(): void {
  if (!state || !state.activeResumedAt) return;
  tick();
  state.activeDurationMs += Date.now() - state.activeResumedAt;
  state.activeResumedAt = null;
  if (state.typingStartTime) {
    state.totalTypingMs += Date.now() - state.typingStartTime;
    state.typingStartTime = null;
  }
}

function resume(): void {
  if (!state) return;
  const now = Date.now();
  const gap = now - state.lastTickAt;
  if (gap > MAX_GAP_MS) {
    state.lastTickAt = now;
  }
  state.activeResumedAt = now;
  state.lastTickAt = now;
}

function buildActivityEvent(): Omit<ActivityEvent, "id"> | null {
  if (!state) return null;

  const now = Date.now();
  const duration = getActiveDuration();
  if (duration < 3000) return null;

  const appContext = detectApp(location.href, location.pathname);
  const pageStructure = analyzePageStructure();

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
    app: appContext.app,
    section: appContext.section,
    url: location.href,
    domain,
    title: document.title,
    startTime: state.startTime,
    endTime: now,
    durationMs: duration,
    formFieldsInteracted: Array.from(state.formFieldsInteracted),
    clickedButtons: state.clickedButtons.slice(0, 50),
    clickedLinks: state.clickedLinks.slice(0, 50),
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
  const now = Date.now();
  const isVisible = document.visibilityState === "visible" && document.hasFocus();
  state = {
    startTime: now,
    activeDurationMs: 0,
    activeResumedAt: isVisible ? now : null,
    lastTickAt: now,
    formFieldsInteracted: new Set(),
    clickedButtons: [],
    clickedLinks: [],
    copyPasteCount: 0,
    typingStartTime: null,
    totalTypingMs: 0,
    lastUrl: location.href,
  };
}

export function trackFormField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  if (!state) resetState();
  const label = getFieldLabel(field);
  state!.formFieldsInteracted.add(label);
}

export function trackButtonClick(label: string): void {
  if (!state) resetState();
  state!.clickedButtons.push(label);
}

export function trackLinkClick(label: string): void {
  if (!state) resetState();
  state!.clickedLinks.push(label);
}

export function trackCopyPaste(): void {
  if (!state) resetState();
  state!.copyPasteCount++;
}

export function trackTypingStart(): void {
  if (!state) resetState();
  if (!state!.typingStartTime) {
    state!.typingStartTime = Date.now();
  }
}

export function trackTypingEnd(): void {
  if (!state?.typingStartTime) return;
  state.totalTypingMs += Date.now() - state.typingStartTime;
  state.typingStartTime = null;
}

export function initActivityTracker(): void {
  resetState();
  flushInterval = setInterval(flush, 30_000);

  setInterval(() => {
    if (state && state.activeResumedAt) {
      state.lastTickAt = Date.now();
    }
  }, 10_000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      pause();
    } else {
      if (state && (Date.now() - state.lastTickAt) > MAX_GAP_MS) {
        flush();
      }
      resume();
    }
  });

  window.addEventListener("blur", pause);
  window.addEventListener("focus", () => {
    if (state && (Date.now() - state.lastTickAt) > MAX_GAP_MS) {
      flush();
    }
    resume();
  });

  window.addEventListener("beforeunload", () => {
    flush();
  });

  setInterval(() => {
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
