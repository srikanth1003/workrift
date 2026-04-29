import { trackFormField, trackCopyPaste, trackTypingStart, trackTypingEnd, trackButtonClick, trackLinkClick, initActivityTracker } from "./activity-tracker";
import { getFieldLabel } from "./page-analyzer";

function sendEvent(
  type: "copy" | "paste" | "form_fill" | "text_selection",
  metadata: Record<string, string | number | boolean>
): void {
  chrome.runtime.sendMessage(
    {
      type: "CONTENT_EVENT",
      payload: {
        type,
        url: location.href,
        title: document.title,
        metadata,
      },
    },
    () => {}
  );
}

export function handleCopy(e: ClipboardEvent): void {
  const text = e.clipboardData?.getData("text/plain") ?? "";
  if (!text) return;
  sendEvent("copy", { textLength: text.length });
  trackCopyPaste();
}

export function handlePaste(e: ClipboardEvent): void {
  const text = e.clipboardData?.getData("text/plain") ?? "";
  if (!text) return;
  sendEvent("paste", { textLength: text.length });
  trackCopyPaste();
}

let formFillTimeout: ReturnType<typeof setTimeout> | null = null;

export function handleFormInput(e: Event): void {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (!target?.tagName) return;
  const tag = target.tagName.toUpperCase();
  if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;

  trackFormField(target as HTMLInputElement);
  trackTypingStart();

  if (formFillTimeout) clearTimeout(formFillTimeout);
  formFillTimeout = setTimeout(() => {
    trackTypingEnd();
    const label = getFieldLabel(target as HTMLInputElement);
    sendEvent("form_fill", {
      fieldType: (target as HTMLInputElement).type ?? "text",
      fieldName: target.name ?? "",
      fieldLabel: label,
      tagName: tag,
    });
  }, 1000);
}

function handleSelection(): void {
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? "";
  if (text.length > 20) {
    sendEvent("text_selection", { textLength: text.length });
  }
}

function getClickLabel(el: HTMLElement): string {
  return (
    el.getAttribute("aria-label") ||
    el.textContent?.trim().slice(0, 80) ||
    el.getAttribute("title") ||
    ""
  );
}

function handleClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (!target) return;

  const button = target.closest("button, [role='button'], input[type='submit']") as HTMLElement | null;
  if (button) {
    const label = getClickLabel(button);
    if (label) trackButtonClick(label);
    return;
  }

  const link = target.closest("a") as HTMLAnchorElement | null;
  if (link) {
    const label = getClickLabel(link) || link.hostname;
    if (label) trackLinkClick(label);
  }
}

function init(): void {
  document.addEventListener("copy", handleCopy);
  document.addEventListener("paste", handlePaste);
  document.addEventListener("input", handleFormInput);
  document.addEventListener("click", handleClick, true);

  let selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  document.addEventListener("mouseup", () => {
    if (selectionTimeout) clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(handleSelection, 500);
  });

  initActivityTracker();
}

init();
