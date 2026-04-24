import { describe, it, expect } from "vitest";
import {
  detectContextSwitching,
  detectRepetitiveSequences,
  detectFrequentCopyPaste,
} from "@shared/patterns";
import type { WorkEvent } from "@shared/types";

function makeEvent(
  type: WorkEvent["type"],
  domain: string,
  timestamp: number,
  metadata: Record<string, string | number | boolean> = {}
): WorkEvent {
  return {
    id: Math.floor(Math.random() * 10000),
    type,
    timestamp,
    url: `https://${domain}/page`,
    domain,
    title: domain,
    metadata,
  };
}

describe("detectContextSwitching", () => {
  it("detects rapid switching between two domains", () => {
    const base = Date.now();
    const events: WorkEvent[] = [];
    for (let i = 0; i < 20; i++) {
      const domain = i % 2 === 0 ? "linkedin.com" : "salesforce.com";
      events.push(makeEvent("tab_switch", domain, base + i * 5000));
    }

    const patterns = detectContextSwitching(events);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe("context_switching");
    expect(patterns[0].domains).toContain("linkedin.com");
    expect(patterns[0].domains).toContain("salesforce.com");
  });

  it("does not flag normal browsing with few switches", () => {
    const base = Date.now();
    const events: WorkEvent[] = [
      makeEvent("tab_switch", "linkedin.com", base),
      makeEvent("tab_switch", "google.com", base + 300_000),
      makeEvent("tab_switch", "github.com", base + 600_000),
    ];

    const patterns = detectContextSwitching(events);
    expect(patterns).toHaveLength(0);
  });
});

describe("detectRepetitiveSequences", () => {
  it("detects a repeated domain visit sequence", () => {
    const base = Date.now();
    const events: WorkEvent[] = [];
    for (let cycle = 0; cycle < 4; cycle++) {
      const offset = cycle * 30_000;
      events.push(makeEvent("tab_switch", "linkedin.com", base + offset));
      events.push(
        makeEvent("tab_switch", "salesforce.com", base + offset + 10_000)
      );
      events.push(
        makeEvent("tab_switch", "gmail.com", base + offset + 20_000)
      );
    }

    const patterns = detectRepetitiveSequences(events);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe("repetitive_sequence");
    expect(patterns[0].domains).toEqual(
      expect.arrayContaining(["linkedin.com", "salesforce.com", "gmail.com"])
    );
  });

  it("does not flag a non-repeating sequence", () => {
    const base = Date.now();
    const events: WorkEvent[] = [
      makeEvent("tab_switch", "a.com", base),
      makeEvent("tab_switch", "b.com", base + 10_000),
      makeEvent("tab_switch", "c.com", base + 20_000),
      makeEvent("tab_switch", "d.com", base + 30_000),
      makeEvent("tab_switch", "e.com", base + 40_000),
    ];

    const patterns = detectRepetitiveSequences(events);
    expect(patterns).toHaveLength(0);
  });
});

describe("detectFrequentCopyPaste", () => {
  it("detects frequent copy-paste between two domains", () => {
    const base = Date.now();
    const events: WorkEvent[] = [];

    for (let i = 0; i < 8; i++) {
      events.push(
        makeEvent("copy", "linkedin.com", base + i * 10_000, {
          textLength: 50,
        })
      );
      events.push(
        makeEvent("paste", "salesforce.com", base + i * 10_000 + 3000, {
          textLength: 50,
        })
      );
    }

    const patterns = detectFrequentCopyPaste(events);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].type).toBe("frequent_copy_paste");
    expect(patterns[0].domains).toContain("linkedin.com");
    expect(patterns[0].domains).toContain("salesforce.com");
  });

  it("does not flag occasional copy-paste", () => {
    const base = Date.now();
    const events: WorkEvent[] = [
      makeEvent("copy", "linkedin.com", base, { textLength: 20 }),
      makeEvent("paste", "docs.google.com", base + 5000, { textLength: 20 }),
    ];

    const patterns = detectFrequentCopyPaste(events);
    expect(patterns).toHaveLength(0);
  });
});
