import { describe, it, expect } from "vitest";
import { formatActivitiesForPrompt } from "../../server/src/workflow-analyzer";

describe("formatActivitiesForPrompt", () => {
  it("formats activity data into readable text", () => {
    const activities = [
      {
        type: "crm_data_entry",
        app: "salesforce",
        section: "lead-edit",
        domain: "mycompany.lightning.force.com",
        title: "Edit Lead",
        durationMs: 1_800_000,
        formFieldsInteracted: ["Company Name", "Phone", "Email"],
        copyPasteCount: 5,
        typingDurationMs: 900_000,
        context: {
          app: "salesforce",
          section: "lead-edit",
          mode: "editing",
          detail: "Salesforce — Editing lead record",
          pageMode: "form",
          headings: ["Edit Lead"],
          formFields: ["Company Name", "Phone", "Email"],
          buttons: ["Save", "Cancel"],
        },
      },
      {
        type: "prospect_research",
        app: "linkedin",
        section: "profile",
        domain: "linkedin.com",
        title: "John Doe",
        durationMs: 720_000,
        formFieldsInteracted: [],
        copyPasteCount: 3,
        typingDurationMs: 0,
        context: {
          app: "linkedin",
          section: "profile",
          mode: "reading",
          detail: "LinkedIn — Viewing profile",
          pageMode: "article",
          headings: ["John Doe", "Software Engineer at Acme"],
          formFields: [],
          buttons: ["Connect", "Message"],
        },
      },
    ];

    const result = formatActivitiesForPrompt(activities);
    expect(result).toContain("crm_data_entry");
    expect(result).toContain("30 min");
    expect(result).toContain("salesforce");
    expect(result).toContain("Company Name, Phone, Email");
    expect(result).toContain("prospect_research");
    expect(result).toContain("linkedin");
    expect(result).toContain("Copy/paste actions: 5");
  });

  it("handles empty activities", () => {
    const result = formatActivitiesForPrompt([]);
    expect(result).toBe("");
  });

  it("aggregates multiple sessions of same type", () => {
    const activities = [
      {
        type: "email_composing",
        app: "gmail",
        section: "compose",
        domain: "mail.google.com",
        title: "Gmail",
        durationMs: 300_000,
        formFieldsInteracted: [],
        copyPasteCount: 1,
        typingDurationMs: 180_000,
        context: { app: "gmail", section: "compose", mode: "composing", detail: "Gmail — Composing", pageMode: "compose", headings: [], formFields: [], buttons: [] },
      },
      {
        type: "email_composing",
        app: "gmail",
        section: "compose",
        domain: "mail.google.com",
        title: "Gmail",
        durationMs: 420_000,
        formFieldsInteracted: [],
        copyPasteCount: 2,
        typingDurationMs: 240_000,
        context: { app: "gmail", section: "compose", mode: "composing", detail: "Gmail — Composing", pageMode: "compose", headings: [], formFields: [], buttons: [] },
      },
    ];

    const result = formatActivitiesForPrompt(activities);
    expect(result).toContain("email_composing");
    expect(result).toContain("2 sessions");
    expect(result).toContain("12 min");
    expect(result).toContain("Copy/paste actions: 3");
  });
});
