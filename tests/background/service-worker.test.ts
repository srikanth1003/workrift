import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@shared/db";

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    get: vi.fn(),
    onActivated: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() },
  },
  runtime: {
    onMessage: { addListener: vi.fn() },
  },
  alarms: {
    create: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
};

vi.stubGlobal("chrome", mockChrome);

// Import handlers after chrome mock is set up
const { handleTabActivated, handleTabUpdated, handleMessage } = await import(
  "../../src/background/service-worker"
);

describe("service-worker handlers", () => {
  beforeEach(async () => {
    await db.events.clear();
    vi.clearAllMocks();
  });

  describe("handleTabActivated", () => {
    it("records a tab_switch event", async () => {
      mockChrome.tabs.get.mockResolvedValue({
        id: 1,
        url: "https://linkedin.com/feed",
        title: "LinkedIn",
      });

      await handleTabActivated({ tabId: 1, windowId: 1 });

      const events = await db.events.toArray();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("tab_switch");
      expect(events[0].domain).toBe("linkedin.com");
    });
  });

  describe("handleTabUpdated", () => {
    it("records a navigation event on URL change", async () => {
      await handleTabUpdated(
        1,
        { url: "https://salesforce.com/leads" },
        { id: 1, url: "https://salesforce.com/leads", title: "Leads" } as chrome.tabs.Tab
      );

      const events = await db.events.toArray();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("navigation");
      expect(events[0].domain).toBe("salesforce.com");
    });

    it("ignores updates without URL changes", async () => {
      await handleTabUpdated(
        1,
        { pinned: true },
        { id: 1, url: "https://example.com", title: "Example" } as chrome.tabs.Tab
      );

      const events = await db.events.toArray();
      expect(events).toHaveLength(0);
    });
  });

  describe("handleMessage", () => {
    it("stores content script events", async () => {
      const sendResponse = vi.fn();
      await handleMessage(
        {
          type: "CONTENT_EVENT",
          payload: {
            type: "copy",
            url: "https://linkedin.com/in/person",
            title: "Profile",
            metadata: { textLength: 100 },
          },
        },
        {} as chrome.runtime.MessageSender,
        sendResponse
      );

      const events = await db.events.toArray();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("copy");
      expect(sendResponse).toHaveBeenCalledWith({ ok: true });
    });
  });
});
