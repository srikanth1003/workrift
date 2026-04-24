import type { WorkEvent, DetectedPattern } from "./types";

const CONTEXT_SWITCH_THRESHOLD = 8;
const CONTEXT_SWITCH_WINDOW_MS = 300_000; // 5 minutes

export function detectContextSwitching(
  events: WorkEvent[]
): DetectedPattern[] {
  const tabSwitches = events.filter((e) => e.type === "tab_switch");
  if (tabSwitches.length < CONTEXT_SWITCH_THRESHOLD) return [];

  const windowEnd = tabSwitches[tabSwitches.length - 1].timestamp;
  const windowStart = windowEnd - CONTEXT_SWITCH_WINDOW_MS;
  const recentSwitches = tabSwitches.filter(
    (e) => e.timestamp >= windowStart
  );

  if (recentSwitches.length < CONTEXT_SWITCH_THRESHOLD) return [];

  const domainPairs = new Map<string, number>();
  for (let i = 1; i < recentSwitches.length; i++) {
    const from = recentSwitches[i - 1].domain;
    const to = recentSwitches[i].domain;
    if (from === to) continue;
    const key = [from, to].sort().join(" <-> ");
    domainPairs.set(key, (domainPairs.get(key) ?? 0) + 1);
  }

  const patterns: DetectedPattern[] = [];
  for (const [pair, count] of domainPairs) {
    if (count >= 4) {
      const domains = pair.split(" <-> ");
      const relevantEvents = recentSwitches.filter((e) =>
        domains.includes(e.domain)
      );
      const avgGap =
        relevantEvents.length > 1
          ? (relevantEvents[relevantEvents.length - 1].timestamp -
              relevantEvents[0].timestamp) /
            (relevantEvents.length - 1)
          : 0;

      patterns.push({
        type: "context_switching",
        description: `Rapid switching between ${domains.join(" and ")} (${count} times in 5 min)`,
        domains,
        frequency: count,
        avgTimeWasted: avgGap * count,
        firstSeen: relevantEvents[0].timestamp,
        lastSeen: relevantEvents[relevantEvents.length - 1].timestamp,
        exampleEvents: relevantEvents.slice(0, 5).map((e) => e.id!),
      });
    }
  }

  return patterns;
}

const MIN_SEQUENCE_REPEATS = 3;
const MIN_SEQUENCE_LENGTH = 2;

export function detectRepetitiveSequences(
  events: WorkEvent[]
): DetectedPattern[] {
  const tabSwitches = events.filter((e) => e.type === "tab_switch");
  if (tabSwitches.length < MIN_SEQUENCE_LENGTH * MIN_SEQUENCE_REPEATS)
    return [];

  const domainSequence = tabSwitches.map((e) => e.domain);
  const patterns: DetectedPattern[] = [];

  for (
    let seqLen = MIN_SEQUENCE_LENGTH;
    seqLen <= Math.min(5, Math.floor(domainSequence.length / 2));
    seqLen++
  ) {
    for (let start = 0; start <= domainSequence.length - seqLen; start++) {
      const candidate = domainSequence.slice(start, start + seqLen);
      let repeats = 0;

      for (
        let check = start;
        check <= domainSequence.length - seqLen;
        check += seqLen
      ) {
        const window = domainSequence.slice(check, check + seqLen);
        if (candidate.every((d, i) => d === window[i])) {
          repeats++;
        } else if (repeats >= MIN_SEQUENCE_REPEATS) {
          break;
        } else {
          repeats = 0;
        }
      }

      if (repeats >= MIN_SEQUENCE_REPEATS) {
        const uniqueDomains = [...new Set(candidate)];
        const alreadyDetected = patterns.some(
          (p) =>
            p.type === "repetitive_sequence" &&
            p.domains.length === uniqueDomains.length &&
            p.domains.every((d) => uniqueDomains.includes(d))
        );

        if (!alreadyDetected) {
          const relevantEvents = tabSwitches.slice(
            start,
            start + seqLen * repeats
          );
          patterns.push({
            type: "repetitive_sequence",
            description: `Repeated workflow: ${candidate.join(" → ")} (${repeats} times)`,
            domains: uniqueDomains,
            frequency: repeats,
            avgTimeWasted:
              (relevantEvents[relevantEvents.length - 1].timestamp -
                relevantEvents[0].timestamp) /
              repeats,
            firstSeen: relevantEvents[0].timestamp,
            lastSeen: relevantEvents[relevantEvents.length - 1].timestamp,
            exampleEvents: relevantEvents.slice(0, 6).map((e) => e.id!),
          });
        }
      }
    }
  }

  return patterns;
}

const MIN_COPY_PASTE_PAIRS = 5;
const COPY_PASTE_WINDOW_MS = 600_000; // 10 minutes

export function detectFrequentCopyPaste(
  events: WorkEvent[]
): DetectedPattern[] {
  const copyPasteEvents = events.filter(
    (e) => e.type === "copy" || e.type === "paste"
  );
  if (copyPasteEvents.length < MIN_COPY_PASTE_PAIRS * 2) return [];

  const pairs: { copyDomain: string; pasteDomain: string; timestamp: number }[] = [];

  for (let i = 0; i < copyPasteEvents.length - 1; i++) {
    const current = copyPasteEvents[i];
    const next = copyPasteEvents[i + 1];

    if (
      current.type === "copy" &&
      next.type === "paste" &&
      next.timestamp - current.timestamp < 30_000 &&
      current.domain !== next.domain
    ) {
      pairs.push({
        copyDomain: current.domain,
        pasteDomain: next.domain,
        timestamp: current.timestamp,
      });
    }
  }

  const pairCounts = new Map<string, typeof pairs>();
  for (const pair of pairs) {
    const key = `${pair.copyDomain} -> ${pair.pasteDomain}`;
    const existing = pairCounts.get(key) ?? [];
    existing.push(pair);
    pairCounts.set(key, existing);
  }

  const patterns: DetectedPattern[] = [];
  for (const [key, occurrences] of pairCounts) {
    if (occurrences.length >= MIN_COPY_PASTE_PAIRS) {
      const [copyDomain, pasteDomain] = key.split(" -> ");
      patterns.push({
        type: "frequent_copy_paste",
        description: `Frequent copy-paste from ${copyDomain} to ${pasteDomain} (${occurrences.length} times)`,
        domains: [copyDomain, pasteDomain],
        frequency: occurrences.length,
        avgTimeWasted: 5000 * occurrences.length,
        firstSeen: occurrences[0].timestamp,
        lastSeen: occurrences[occurrences.length - 1].timestamp,
        exampleEvents: [],
      });
    }
  }

  return patterns;
}
