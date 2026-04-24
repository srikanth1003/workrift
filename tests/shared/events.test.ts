import { describe, it, expect } from "vitest";
import { extractDomain, createWorkEvent } from "@shared/events";

describe("extractDomain", () => {
  it("extracts domain from a full URL", () => {
    expect(extractDomain("https://www.linkedin.com/in/someone")).toBe(
      "linkedin.com"
    );
  });

  it("strips www prefix", () => {
    expect(extractDomain("https://www.google.com/search?q=test")).toBe(
      "google.com"
    );
  });

  it("handles URLs without www", () => {
    expect(extractDomain("https://app.salesforce.com/leads")).toBe(
      "app.salesforce.com"
    );
  });

  it("returns empty string for invalid URLs", () => {
    expect(extractDomain("not-a-url")).toBe("");
    expect(extractDomain("")).toBe("");
    expect(extractDomain("chrome://extensions")).toBe("");
  });

  it("handles chrome-extension:// URLs", () => {
    expect(extractDomain("chrome-extension://abc123/popup.html")).toBe("");
  });
});

describe("createWorkEvent", () => {
  it("creates a tab_switch event with correct fields", () => {
    const event = createWorkEvent("tab_switch", "https://linkedin.com/feed", "LinkedIn", {
      fromTabId: 1,
    });

    expect(event.type).toBe("tab_switch");
    expect(event.domain).toBe("linkedin.com");
    expect(event.url).toBe("https://linkedin.com/feed");
    expect(event.title).toBe("LinkedIn");
    expect(event.metadata.fromTabId).toBe(1);
    expect(event.timestamp).toBeGreaterThan(0);
    expect(event).not.toHaveProperty("id");
  });

  it("creates a copy event", () => {
    const event = createWorkEvent("copy", "https://salesforce.com/contact/123", "Contact Detail", {
      textLength: 45,
    });

    expect(event.type).toBe("copy");
    expect(event.domain).toBe("salesforce.com");
    expect(event.metadata.textLength).toBe(45);
  });
});
