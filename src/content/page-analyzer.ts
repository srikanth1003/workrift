export interface PageStructure {
  pageTitle: string;
  headings: string[];
  activeFormFields: FormFieldInfo[];
  visibleButtons: string[];
  pageMode: "form" | "list" | "article" | "compose" | "dashboard" | "search-results" | "unknown";
}

export interface FormFieldInfo {
  label: string;
  fieldType: string;
  fieldName: string;
  isRequired: boolean;
}

export function getFieldLabel(
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): string {
  // 1. Check for <label for="fieldId">
  if (field.id) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label?.textContent?.trim()) {
      return label.textContent.trim();
    }
  }

  // 2. Check aria-label
  const ariaLabel = field.getAttribute("aria-label");
  if (ariaLabel?.trim()) {
    return ariaLabel.trim();
  }

  // 3. Check aria-labelledby
  const ariaLabelledBy = field.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement?.textContent?.trim()) {
      return labelElement.textContent.trim();
    }
  }

  // 4. Check placeholder
  const placeholder = field.getAttribute("placeholder");
  if (placeholder?.trim()) {
    return placeholder.trim();
  }

  // 5. Walk up the DOM looking for label-like element
  let parent = field.parentElement;
  let depth = 0;
  while (parent && depth < 3) {
    const label = parent.querySelector("label");
    if (label?.textContent?.trim()) {
      return label.textContent.trim();
    }
    parent = parent.parentElement;
    depth++;
  }

  // 6. Fall back to name attribute
  if (field.name) {
    return field.name;
  }

  return "unlabeled";
}

function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

export function detectPageMode(): PageStructure["pageMode"] {
  // Check for compose/editor area first (contenteditable, role="textbox", etc.)
  const composeSelectors = [
    '[contenteditable="true"]',
    '[role="textbox"]',
    '.compose',
    '[data-editor]',
  ];
  for (const selector of composeSelectors) {
    const element = document.querySelector(selector);
    if (element && isVisible(element)) {
      return "compose";
    }
  }

  // Check for form mode (3+ visible form fields)
  const formFields = Array.from(
    document.querySelectorAll("input, textarea, select")
  ).filter((field) => isVisible(field));
  if (formFields.length >= 3) {
    return "form";
  }

  // Check for list mode (table, grid, or list with 5+ items)
  const table = document.querySelector("table");
  if (table && isVisible(table)) {
    const rows = table.querySelectorAll("tr");
    if (rows.length >= 5) {
      return "list";
    }
  }

  const grid = document.querySelector('[role="grid"]');
  if (grid && isVisible(grid)) {
    return "list";
  }

  // Check for long article text
  const paragraphs = document.querySelectorAll("p, article");
  for (const p of paragraphs) {
    if (p.textContent && p.textContent.length > 500) {
      return "article";
    }
  }

  // Check for search results
  const searchInput = document.querySelector('input[type="search"]');
  if (searchInput && isVisible(searchInput)) {
    const resultContainers = document.querySelectorAll(
      '[role="list"], .results, .search-results'
    );
    if (resultContainers.length > 0) {
      return "search-results";
    }
  }

  // Check for dashboard (multiple cards/widgets)
  const cards = document.querySelectorAll(
    '.card, [role="region"], .widget, .panel'
  );
  const visibleCards = Array.from(cards).filter((c) => isVisible(c));
  if (visibleCards.length >= 3) {
    return "dashboard";
  }

  return "unknown";
}

export function analyzePageStructure(): PageStructure {
  const pageTitle = document.title;

  // Get first 5 headings, truncated to 80 chars
  const headingElements = document.querySelectorAll("h1, h2");
  const headings = Array.from(headingElements)
    .slice(0, 5)
    .map((h) => {
      const text = h.textContent?.trim() || "";
      return text.length > 80 ? text.substring(0, 80) + "..." : text;
    })
    .filter((text) => text.length > 0);

  // Get visible form fields with their labels
  const formFieldElements = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select"
    )
  ).filter((field) => isVisible(field));

  const activeFormFields: FormFieldInfo[] = formFieldElements.map((field) => ({
    label: getFieldLabel(field),
    fieldType:
      field instanceof HTMLInputElement
        ? field.type
        : field instanceof HTMLTextAreaElement
        ? "textarea"
        : "select",
    fieldName: field.name || field.id || "",
    isRequired: field.hasAttribute("required"),
  }));

  // Get first 10 visible buttons
  const buttonElements = document.querySelectorAll<HTMLButtonElement>(
    "button, [role='button'], input[type='submit']"
  );
  const visibleButtons = Array.from(buttonElements)
    .filter((btn) => isVisible(btn))
    .slice(0, 10)
    .map((btn) => {
      return (
        btn.getAttribute("aria-label") ||
        btn.textContent?.trim() ||
        btn.getAttribute("value") ||
        "unlabeled"
      );
    })
    .filter((text) => text.length > 0);

  const pageMode = detectPageMode();

  return {
    pageTitle,
    headings,
    activeFormFields,
    visibleButtons,
    pageMode,
  };
}
