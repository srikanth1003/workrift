import type { ActivityEvent, WorkflowSequence } from "./types";

function activityKey(a: ActivityEvent): string {
  return `${a.app || a.domain}::${a.section}`;
}

export function detectWorkflowSequences(activities: ActivityEvent[]): WorkflowSequence[] {
  if (activities.length < 4) return [];

  const sorted = [...activities].sort((a, b) => a.startTime - b.startTime);

  // Build sequence of app transitions (collapse consecutive same-app sessions)
  const transitions: { key: string; activities: ActivityEvent[] }[] = [];
  for (const a of sorted) {
    const key = activityKey(a);
    const last = transitions[transitions.length - 1];
    if (last && last.key === key) {
      last.activities.push(a);
    } else {
      transitions.push({ key, activities: [a] });
    }
  }

  if (transitions.length < 3) return [];

  // Extract n-grams (length 2-5) from the transition sequence
  const ngramCounts = new Map<string, {
    count: number;
    occurrences: { key: string; activities: ActivityEvent[] }[][];
  }>();

  for (let len = 2; len <= Math.min(5, transitions.length); len++) {
    for (let i = 0; i <= transitions.length - len; i++) {
      const ngram = transitions.slice(i, i + len);
      const ngramKey = ngram.map(t => t.key).join(" → ");

      // Skip if all steps are the same app
      const uniqueApps = new Set(ngram.map(t => t.key));
      if (uniqueApps.size < 2) continue;

      let entry = ngramCounts.get(ngramKey);
      if (!entry) {
        entry = { count: 0, occurrences: [] };
        ngramCounts.set(ngramKey, entry);
      }
      entry.count++;
      entry.occurrences.push(ngram);
    }
  }

  // Filter to sequences that repeat 2+ times and deduplicate subsets
  const candidates = Array.from(ngramCounts.entries())
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => {
      const scoreA = a[1].count * a[0].split(" → ").length;
      const scoreB = b[1].count * b[0].split(" → ").length;
      return scoreB - scoreA;
    });

  const usedKeys = new Set<string>();
  const sequences: WorkflowSequence[] = [];

  for (const [ngramKey, data] of candidates) {
    // Skip if this is a subset of an already-detected longer sequence
    const isSubset = Array.from(usedKeys).some(k => k.includes(ngramKey));
    if (isSubset) continue;

    usedKeys.add(ngramKey);

    const stepKeys = ngramKey.split(" → ");
    const steps = stepKeys.map((stepKey, idx) => {
      const allActivitiesForStep = data.occurrences.flatMap(occ => occ[idx].activities);
      const avgDuration = allActivitiesForStep.reduce((s, a) => s + a.durationMs, 0) / data.count;

      const actions: string[] = [];
      const buttonCounts = new Map<string, number>();
      let hasCopyPaste = false;
      let hasFormFill = false;

      for (const a of allActivitiesForStep) {
        if (a.copyPasteCount > 0) hasCopyPaste = true;
        if (a.formFieldsInteracted.length > 0) hasFormFill = true;
        for (const b of (a.clickedButtons ?? [])) {
          buttonCounts.set(b, (buttonCounts.get(b) ?? 0) + 1);
        }
      }

      const topButtons = Array.from(buttonCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([b]) => b);
      actions.push(...topButtons);

      if (hasCopyPaste) actions.push("copy/paste");
      if (hasFormFill) {
        const fields = new Set(allActivitiesForStep.flatMap(a => a.formFieldsInteracted));
        actions.push(`fill: ${Array.from(fields).slice(0, 3).join(", ")}`);
      }

      const [app, section] = stepKey.split("::");
      const sampleActivity = allActivitiesForStep[0];

      return {
        app,
        section,
        detail: sampleActivity?.context?.detail || `${app} — ${section}`,
        avgDurationMs: Math.round(avgDuration),
        actions,
      };
    });

    const involvesCopyPaste = data.occurrences.some(occ =>
      occ.some(step => step.activities.some(a => a.copyPasteCount > 0))
    );
    const involvesFormFill = data.occurrences.some(occ =>
      occ.some(step => step.activities.some(a => a.formFieldsInteracted.length > 0))
    );

    const totalTimeMs = data.occurrences.reduce((sum, occ) => {
      const start = occ[0].activities[0].startTime;
      const lastStep = occ[occ.length - 1].activities;
      const end = lastStep[lastStep.length - 1].endTime;
      return sum + (end - start);
    }, 0);

    sequences.push({
      steps,
      frequency: data.count,
      totalTimeMs,
      involvesCopyPaste,
      involvesFormFill,
    });

    if (sequences.length >= 10) break;
  }

  return sequences;
}

export function formatSequencesForPrompt(sequences: WorkflowSequence[]): string {
  if (sequences.length === 0) return "";

  const lines: string[] = ["\n\n# Detected Cross-App Workflow Sequences"];
  lines.push("These are repeating multi-app patterns observed in the user's work:\n");

  for (const seq of sequences) {
    const totalMins = Math.round(seq.totalTimeMs / 60_000);
    const flow = seq.steps.map(s => s.detail).join(" → ");
    lines.push(`## Pattern (${seq.frequency}x, ${totalMins} min total): ${flow}`);

    for (const step of seq.steps) {
      const stepMins = Math.round(step.avgDurationMs / 60_000);
      let line = `  ${step.detail} (~${stepMins || "<1"} min avg)`;
      if (step.actions.length > 0) {
        line += ` — actions: ${step.actions.join(", ")}`;
      }
      lines.push(line);
    }

    const flags: string[] = [];
    if (seq.involvesCopyPaste) flags.push("involves copy-paste between apps");
    if (seq.involvesFormFill) flags.push("involves manual form filling");
    if (flags.length > 0) lines.push(`  ⚠ ${flags.join(", ")}`);
    lines.push("");
  }

  return lines.join("\n");
}
