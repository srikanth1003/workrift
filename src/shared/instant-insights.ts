import type { ActivityEvent } from "./types";

export type Tier = "empty" | "minimal" | "basic" | "full";
export type ContextSwitchRate = "focused" | "moderate" | "high";
export type TypingSignal = "content-creation" | "data-entry" | "mixed" | null;

export interface CopyPastePair {
  from: string;
  to: string;
  count: number;
}

export interface InsightResult {
  tier: Tier;
  uniqueApps: number;
  totalDurationMs: number;
  dominantApp: string | null;
  dominantAppPct: number;
  contextSwitchRate: ContextSwitchRate;
  contextSwitchesPerHour: number;
  crossAppCopyPaste: CopyPastePair | null;
  totalCopyPaste: number;
  formHeavyPct: number;
  typingSignal: TypingSignal;
  typingPct: number;
}

export function computeInsights(activities: ActivityEvent[]): InsightResult {
  if (activities.length === 0) {
    return {
      tier: "empty",
      uniqueApps: 0,
      totalDurationMs: 0,
      dominantApp: null,
      dominantAppPct: 0,
      contextSwitchRate: "focused",
      contextSwitchesPerHour: 0,
      crossAppCopyPaste: null,
      totalCopyPaste: 0,
      formHeavyPct: 0,
      typingSignal: null,
      typingPct: 0,
    };
  }

  const tier: Tier =
    activities.length < 5 ? "minimal" : activities.length < 10 ? "basic" : "full";

  // Unique apps
  const appSet = new Set(activities.map((a) => a.app || a.domain));
  const uniqueApps = appSet.size;

  // Total duration
  const totalDurationMs = activities.reduce((s, a) => s + a.durationMs, 0);

  // Dominant app
  const appDurations = new Map<string, number>();
  for (const a of activities) {
    const key = a.app || a.domain;
    appDurations.set(key, (appDurations.get(key) ?? 0) + a.durationMs);
  }
  let dominantApp: string | null = null;
  let dominantMs = 0;
  for (const [app, ms] of appDurations) {
    if (ms > dominantMs) {
      dominantApp = app;
      dominantMs = ms;
    }
  }
  const dominantAppPct =
    totalDurationMs > 0 ? Math.round((dominantMs / totalDurationMs) * 100) : 0;

  // Context switch rate
  const sorted = [...activities].sort((a, b) => a.startTime - b.startTime);
  let switches = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prevApp = sorted[i - 1].app || sorted[i - 1].domain;
    const currApp = sorted[i].app || sorted[i].domain;
    if (prevApp !== currApp) switches++;
  }
  const spanHours =
    sorted.length > 1
      ? (sorted[sorted.length - 1].endTime - sorted[0].startTime) / 3_600_000
      : 0;
  const contextSwitchesPerHour =
    spanHours > 0 ? Math.round(switches / spanHours) : 0;
  const contextSwitchRate: ContextSwitchRate =
    contextSwitchesPerHour > 8
      ? "high"
      : contextSwitchesPerHour >= 4
        ? "moderate"
        : "focused";

  // Cross-app copy-paste
  const pairCounts = new Map<string, number>();
  let totalCopyPaste = 0;
  for (let i = 0; i < sorted.length; i++) {
    totalCopyPaste += sorted[i].copyPasteCount;
    if (sorted[i].copyPasteCount > 0 && i > 0) {
      const prevApp = sorted[i - 1].app || sorted[i - 1].domain;
      const currApp = sorted[i].app || sorted[i].domain;
      if (prevApp !== currApp) {
        const key = `${prevApp}→${currApp}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + sorted[i].copyPasteCount);
      }
    }
  }
  let crossAppCopyPaste: CopyPastePair | null = null;
  if (totalCopyPaste > 5) {
    let maxPair = "";
    let maxCount = 0;
    for (const [pair, count] of pairCounts) {
      if (count > maxCount) {
        maxPair = pair;
        maxCount = count;
      }
    }
    if (maxPair) {
      const [from, to] = maxPair.split("→");
      crossAppCopyPaste = { from, to, count: maxCount };
    }
  }

  // Form-heavy
  const formSessions = activities.filter(
    (a) => a.formFieldsInteracted.length > 0
  ).length;
  const formHeavyPct = Math.round((formSessions / activities.length) * 100);

  // Typing signal
  const totalTypingMs = activities.reduce((s, a) => s + a.typingDurationMs, 0);
  const typingPct =
    totalDurationMs > 0 ? Math.round((totalTypingMs / totalDurationMs) * 100) : 0;
  let typingSignal: TypingSignal = null;
  if (typingPct > 40) {
    typingSignal = "content-creation";
  } else if (formHeavyPct > 30 && typingPct <= 40) {
    typingSignal = "data-entry";
  } else if (typingPct > 15) {
    typingSignal = "mixed";
  }

  return {
    tier,
    uniqueApps,
    totalDurationMs,
    dominantApp,
    dominantAppPct,
    contextSwitchRate,
    contextSwitchesPerHour,
    crossAppCopyPaste,
    totalCopyPaste,
    formHeavyPct,
    typingSignal,
    typingPct,
  };
}
