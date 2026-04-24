import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleCopy, handlePaste, handleFormInput } from "../../src/content/content-script";

const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
};

vi.stubGlobal("chrome", mockChrome);

vi.mock("../../src/content/activity-tracker", () => ({
  trackFormField: vi.fn(),
  trackCopyPaste: vi.fn(),
  trackTypingStart: vi.fn(),
  trackTypingEnd: vi.fn(),
  initActivityTracker: vi.fn(),
}));

vi.mock("../../src/content/page-analyzer", () => ({
  getFieldLabel: vi.fn().mockReturnValue("Company Name"),
}));

describe("content-script handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { href: "https://linkedin.com/in/someone" });
    vi.stubGlobal("document", {
      title: "LinkedIn Profile",
      addEventListener: vi.fn(),
    });
  });

  describe("handleCopy", () => {
    it("sends a copy event with text length", () => {
      const event = {
        clipboardData: {
          getData: vi.fn().mockReturnValue("copied text content"),
        },
      } as unknown as ClipboardEvent;

      handleCopy(event);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          type: "CONTENT_EVENT",
          payload: {
            type: "copy",
            url: "https://linkedin.com/in/someone",
            title: "LinkedIn Profile",
            metadata: { textLength: 19 },
          },
        },
        expect.any(Function)
      );
    });

    it("does not send event for empty clipboard", () => {
      const event = {
        clipboardData: {
          getData: vi.fn().mockReturnValue(""),
        },
      } as unknown as ClipboardEvent;

      handleCopy(event);

      expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("handlePaste", () => {
    it("sends a paste event with text length", () => {
      const event = {
        clipboardData: {
          getData: vi.fn().mockReturnValue("pasted content"),
        },
      } as unknown as ClipboardEvent;

      handlePaste(event);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          type: "CONTENT_EVENT",
          payload: {
            type: "paste",
            url: "https://linkedin.com/in/someone",
            title: "LinkedIn Profile",
            metadata: { textLength: 14 },
          },
        },
        expect.any(Function)
      );
    });
  });

  describe("handleFormInput", () => {
    it("sends a form_fill event for input changes", () => {
      vi.useFakeTimers();

      const event = {
        target: {
          tagName: "INPUT",
          type: "text",
          name: "firstName",
        },
      } as unknown as Event;

      handleFormInput(event);
      vi.advanceTimersByTime(1000);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          type: "CONTENT_EVENT",
          payload: {
            type: "form_fill",
            url: "https://linkedin.com/in/someone",
            title: "LinkedIn Profile",
            metadata: {
              fieldType: "text",
              fieldName: "firstName",
              fieldLabel: "Company Name",
              tagName: "INPUT",
            },
          },
        },
        expect.any(Function)
      );

      vi.useRealTimers();
    });
  });
});
