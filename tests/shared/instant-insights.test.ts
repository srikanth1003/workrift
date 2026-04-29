import { describe, it, expect } from "vitest";
import {
  computeInsights,
  type InsightResult,
} from "@shared/instant-insights";
import type { ActivityEvent, ActivityContext } from "@shared/types";

function makeActivity(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  const defaults: ActivityEvent = {
    app: "gmail",
    section: "inbox",
    url: "https://mail.google.com",
    domain: "mail.google.com",
    title: "Gmail",
    startTime: Date.now() - 60_000,
    endTime: Date.now(),
    durationMs: 60_000,
    formFieldsInteracted: [],
    clickedButtons: [],
    clickedLinks: [],
    copyPasteCount: 0,
    typingDurationMs: 0,
    context: {
      app: "gmail",
      section: "inbox",
      mode: "",
      detail: "Gmail — inbox",
      pageMode: "list",
      headings: [],
      formFields: [],
      buttons: [],
    },
  };
  return { ...defaults, ...overrides };
}

describe("computeInsights", () => {
  it("returns tier 'empty' for 0 activities", () => {
    const result = computeInsights([]);
    expect(result.tier).toBe("empty");
  });

  it("returns tier 'minimal' for 1-4 activities", () => {
    const activities = [makeActivity(), makeActivity({ app: "slack" })];
    const result = computeInsights(activities);
    expect(result.tier).toBe("minimal");
    expect(result.uniqueApps).toBe(2);
  });

  it("returns tier 'basic' for 5-9 activities", () => {
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity({
        app: i % 3 === 0 ? "gmail" : i % 3 === 1 ? "slack" : "salesforce",
        startTime: Date.now() - (6 - i) * 120_000,
        endTime: Date.now() - (5 - i) * 120_000,
        durationMs: 120_000,
      })
    );
    const result = computeInsights(activities);
    expect(result.tier).toBe("basic");
    expect(result.dominantApp).toBeDefined();
  });

  it("returns tier 'full' for 10+ activities", () => {
    const activities = Array.from({ length: 12 }, (_, i) =>
      makeActivity({
        app: i % 4 === 0 ? "gmail" : i % 4 === 1 ? "slack" : i % 4 === 2 ? "salesforce" : "linkedin",
        startTime: Date.now() - (12 - i) * 120_000,
        endTime: Date.now() - (11 - i) * 120_000,
        durationMs: 120_000,
      })
    );
    const result = computeInsights(activities);
    expect(result.tier).toBe("full");
  });

  it("computes dominantApp correctly", () => {
    const activities = [
      makeActivity({ app: "salesforce", durationMs: 300_000 }),
      makeActivity({ app: "gmail", durationMs: 100_000 }),
      makeActivity({ app: "salesforce", durationMs: 200_000 }),
      makeActivity({ app: "slack", durationMs: 50_000 }),
      makeActivity({ app: "gmail", durationMs: 50_000 }),
    ];
    const result = computeInsights(activities);
    expect(result.dominantApp).toBe("salesforce");
    expect(result.dominantAppPct).toBe(71); // 500k / 700k
  });

  it("computes context-switch rate", () => {
    const now = Date.now();
    // 6 activities in 30 minutes = 12/hour
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity({
        app: i % 2 === 0 ? "gmail" : "slack",
        startTime: now - (6 - i) * 5 * 60_000,
        endTime: now - (5 - i) * 5 * 60_000,
        durationMs: 5 * 60_000,
      })
    );
    const result = computeInsights(activities);
    expect(result.contextSwitchRate).toBe("high");
  });

  it("detects cross-app copy-paste pairs", () => {
    const now = Date.now();
    const activities = Array.from({ length: 8 }, (_, i) =>
      makeActivity({
        app: i % 2 === 0 ? "linkedin" : "salesforce",
        copyPasteCount: i % 2 === 1 ? 2 : 0,
        startTime: now - (8 - i) * 60_000,
        endTime: now - (7 - i) * 60_000,
        durationMs: 60_000,
      })
    );
    const result = computeInsights(activities);
    expect(result.crossAppCopyPaste).toBeDefined();
    expect(result.crossAppCopyPaste!.from).toBe("linkedin");
    expect(result.crossAppCopyPaste!.to).toBe("salesforce");
  });

  it("detects form-heavy work", () => {
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity({
        app: "salesforce",
        formFieldsInteracted: i < 4 ? ["First Name", "Last Name"] : [],
        startTime: Date.now() - (6 - i) * 60_000,
        endTime: Date.now() - (5 - i) * 60_000,
        durationMs: 60_000,
      })
    );
    const result = computeInsights(activities);
    expect(result.formHeavyPct).toBeGreaterThanOrEqual(50);
  });

  it("detects typing ratio", () => {
    const activities = [
      makeActivity({ durationMs: 100_000, typingDurationMs: 50_000 }),
      makeActivity({ durationMs: 100_000, typingDurationMs: 45_000 }),
    ];
    const result = computeInsights(activities);
    expect(result.typingSignal).toBe("content-creation");
  });

  it("typing signal is data-entry when low typing + form fields", () => {
    const activities = Array.from({ length: 5 }, () =>
      makeActivity({
        durationMs: 100_000,
        typingDurationMs: 10_000,
        formFieldsInteracted: ["Name", "Email"],
      })
    );
    const result = computeInsights(activities);
    expect(result.typingSignal).toBe("data-entry");
  });
});
