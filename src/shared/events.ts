import type { EventType, WorkEvent } from "./types";

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) return "";
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function createWorkEvent(
  type: EventType,
  url: string,
  title: string,
  metadata: Record<string, string | number | boolean> = {}
): Omit<WorkEvent, "id"> {
  return {
    type,
    timestamp: Date.now(),
    url,
    domain: extractDomain(url),
    title,
    metadata,
  };
}
