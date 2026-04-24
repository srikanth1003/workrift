import { describe, it, expect } from "vitest";
import { detectApp } from "../../src/content/app-detectors";

describe("detectApp", () => {
  it("detects Gmail compose", () => {
    const result = detectApp("https://mail.google.com/mail/u/0/#compose", "/mail/u/0/");
    expect(result.app).toBe("gmail");
    expect(result.section).toBe("compose");
    expect(result.mode).toBe("composing");
  });

  it("detects Gmail inbox", () => {
    const result = detectApp("https://mail.google.com/mail/u/0/#inbox", "/mail/u/0/");
    expect(result.app).toBe("gmail");
    expect(result.section).toBe("inbox");
    expect(result.mode).toBe("browsing");
  });

  it("detects Salesforce lead edit", () => {
    const result = detectApp(
      "https://mycompany.lightning.force.com/lightning/r/Lead/00Q1234/edit",
      "/lightning/r/Lead/00Q1234/edit"
    );
    expect(result.app).toBe("salesforce");
    expect(result.section).toBe("lead-edit");
    expect(result.mode).toBe("editing");
  });

  it("detects Salesforce record view", () => {
    const result = detectApp(
      "https://mycompany.lightning.force.com/lightning/r/Contact/003abc/view",
      "/lightning/r/Contact/003abc/view"
    );
    expect(result.app).toBe("salesforce");
    expect(result.section).toBe("record-view");
    expect(result.mode).toBe("reading");
  });

  it("detects LinkedIn profile", () => {
    const result = detectApp("https://www.linkedin.com/in/john-doe", "/in/john-doe");
    expect(result.app).toBe("linkedin");
    expect(result.section).toBe("profile");
    expect(result.mode).toBe("reading");
  });

  it("detects LinkedIn people search", () => {
    const result = detectApp(
      "https://www.linkedin.com/search/results/people/?keywords=engineer",
      "/search/results/people/"
    );
    expect(result.app).toBe("linkedin");
    expect(result.section).toBe("people-search");
    expect(result.mode).toBe("searching");
  });

  it("detects Google Sheets", () => {
    const result = detectApp(
      "https://docs.google.com/spreadsheets/d/abc123/edit",
      "/spreadsheets/d/abc123/edit"
    );
    expect(result.app).toBe("google-sheets");
    expect(result.section).toBe("spreadsheet");
    expect(result.mode).toBe("editing");
  });

  it("detects Google Docs", () => {
    const result = detectApp(
      "https://docs.google.com/document/d/abc123/edit",
      "/document/d/abc123/edit"
    );
    expect(result.app).toBe("google-docs");
    expect(result.section).toBe("document");
    expect(result.mode).toBe("editing");
  });

  it("detects HubSpot contact", () => {
    const result = detectApp(
      "https://app.hubspot.com/contacts/123/contact/456",
      "/contacts/123/contact/456"
    );
    expect(result.app).toBe("hubspot");
    expect(result.section).toBe("contact-edit");
    expect(result.mode).toBe("editing");
  });

  it("detects Jira issue", () => {
    const result = detectApp(
      "https://myteam.atlassian.net/browse/PROJ-123",
      "/browse/PROJ-123"
    );
    expect(result.app).toBe("jira");
    expect(result.section).toBe("issue-view");
    expect(result.mode).toBe("reading");
  });

  it("detects Outlook compose", () => {
    const result = detectApp(
      "https://outlook.office.com/mail/compose",
      "/mail/compose"
    );
    expect(result.app).toBe("outlook");
    expect(result.section).toBe("compose");
    expect(result.mode).toBe("composing");
  });

  it("detects Slack", () => {
    const result = detectApp(
      "https://app.slack.com/client/T123/C456",
      "/client/T123/C456"
    );
    expect(result.app).toBe("slack");
    expect(result.section).toBe("channel");
    expect(result.mode).toBe("composing");
  });

  it("detects Notion", () => {
    const result = detectApp(
      "https://www.notion.so/workspace/page-id",
      "/workspace/page-id"
    );
    expect(result.app).toBe("notion");
    expect(result.section).toBe("page");
    expect(result.mode).toBe("editing");
  });

  it("returns unknown for unrecognized URLs", () => {
    const result = detectApp("https://random-site.com/dashboard/reports", "/dashboard/reports");
    expect(result.app).toBe("unknown");
    expect(result.mode).toBe("browsing");
  });
});
