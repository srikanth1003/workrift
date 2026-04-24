import { describe, it, expect, beforeEach } from "vitest";
import { db, addEvent, getEventsByDateRange, getDomainStats, clearOldEvents } from "@shared/db";
import type { WorkEvent } from "@shared/types";

describe("db", () => {
  beforeEach(async () => {
    await db.events.clear();
    await db.patterns.clear();
    await db.dailySummaries.clear();
  });

  describe("addEvent", () => {
    it("stores an event and returns its id", async () => {
      const event: Omit<WorkEvent, "id"> = {
        type: "tab_switch",
        timestamp: Date.now(),
        url: "https://linkedin.com/feed",
        domain: "linkedin.com",
        title: "LinkedIn",
        metadata: {},
      };

      const id = await addEvent(event);
      expect(id).toBeGreaterThan(0);

      const stored = await db.events.get(id);
      expect(stored).toBeDefined();
      expect(stored!.type).toBe("tab_switch");
      expect(stored!.domain).toBe("linkedin.com");
    });
  });

  describe("getEventsByDateRange", () => {
    it("returns only events within the date range", async () => {
      const now = Date.now();
      const hourAgo = now - 3600_000;
      const twoHoursAgo = now - 7200_000;

      await addEvent({
        type: "navigation",
        timestamp: twoHoursAgo,
        url: "https://old.com",
        domain: "old.com",
        title: "Old",
        metadata: {},
      });
      await addEvent({
        type: "navigation",
        timestamp: now,
        url: "https://new.com",
        domain: "new.com",
        title: "New",
        metadata: {},
      });

      const results = await getEventsByDateRange(hourAgo, now + 1000);
      expect(results).toHaveLength(1);
      expect(results[0].domain).toBe("new.com");
    });
  });

  describe("getDomainStats", () => {
    it("aggregates time per domain from tab switch events", async () => {
      const base = Date.now() - 60_000;
      await addEvent({
        type: "tab_switch",
        timestamp: base,
        url: "https://linkedin.com/feed",
        domain: "linkedin.com",
        title: "LinkedIn",
        metadata: {},
      });
      await addEvent({
        type: "tab_switch",
        timestamp: base + 30_000,
        url: "https://salesforce.com/leads",
        domain: "salesforce.com",
        title: "Salesforce",
        metadata: {},
      });
      await addEvent({
        type: "tab_switch",
        timestamp: base + 50_000,
        url: "https://linkedin.com/search",
        domain: "linkedin.com",
        title: "LinkedIn",
        metadata: {},
      });

      const stats = await getDomainStats(base - 1000, base + 60_000);
      const linkedin = stats.find((s) => s.domain === "linkedin.com");
      expect(linkedin).toBeDefined();
      expect(linkedin!.visitCount).toBe(2);
      expect(linkedin!.totalTime).toBeGreaterThan(0);
    });
  });

  describe("clearOldEvents", () => {
    it("removes events older than the cutoff", async () => {
      const now = Date.now();
      const old = now - 31 * 24 * 3600_000;

      await addEvent({
        type: "navigation",
        timestamp: old,
        url: "https://old.com",
        domain: "old.com",
        title: "Old",
        metadata: {},
      });
      await addEvent({
        type: "navigation",
        timestamp: now,
        url: "https://new.com",
        domain: "new.com",
        title: "New",
        metadata: {},
      });

      await clearOldEvents(30);
      const all = await db.events.toArray();
      expect(all).toHaveLength(1);
      expect(all[0].domain).toBe("new.com");
    });
  });
});
