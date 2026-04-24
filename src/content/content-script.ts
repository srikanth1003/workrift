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
    () => {
      // Ignore response
    }
  );
}

export function handleCopy(e: ClipboardEvent): void {
  const text = e.clipboardData?.getData("text/plain") ?? "";
  if (!text) return;
  sendEvent("copy", { textLength: text.length });
}

export function handlePaste(e: ClipboardEvent): void {
  const text = e.clipboardData?.getData("text/plain") ?? "";
  if (!text) return;
  sendEvent("paste", { textLength: text.length });
}

let formFillTimeout: ReturnType<typeof setTimeout> | null = null;

export function handleFormInput(e: Event): void {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (!target?.tagName) return;
  const tag = target.tagName.toUpperCase();
  if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") return;

  if (formFillTimeout) clearTimeout(formFillTimeout);
  formFillTimeout = setTimeout(() => {
    sendEvent("form_fill", {
      fieldType: (target as HTMLInputElement).type ?? "text",
      fieldName: target.name ?? "",
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

function init(): void {
  document.addEventListener("copy", handleCopy);
  document.addEventListener("paste", handlePaste);
  document.addEventListener("input", handleFormInput);

  let selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  document.addEventListener("mouseup", () => {
    if (selectionTimeout) clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(handleSelection, 500);
  });
}

init();
