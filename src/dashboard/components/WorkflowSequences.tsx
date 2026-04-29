import { useEffect, useState } from "react";
import type { WorkflowSequence } from "@shared/types";
import type { DateRange } from "./PeriodSelector";

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatAppName(app: string): string {
  if (app === "unknown") return "Other";
  return app.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

interface WorkflowSequencesProps {
  dateRange: DateRange;
}

export function WorkflowSequences({ dateRange }: WorkflowSequencesProps) {
  const [sequences, setSequences] = useState<WorkflowSequence[]>([]);

  useEffect(() => {
    chrome.runtime.sendMessage({
      type: "GET_WORKFLOW_SEQUENCES",
      startTime: dateRange.startTime,
      endTime: dateRange.endTime,
    }).then((response) => {
      setSequences((response as { sequences: WorkflowSequence[] })?.sequences ?? []);
    });
  }, [dateRange.startTime, dateRange.endTime]);

  if (sequences.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Cross-App Workflows</h2>
      <p className="text-sm text-gray-500 mb-5">
        Repeating multi-app patterns detected in your work
      </p>

      <div className="space-y-4">
        {sequences.map((seq, i) => (
          <div key={i} className="border border-amber-500/20 bg-amber-900/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-xs font-medium uppercase tracking-wide">
                  {seq.frequency}x repeated
                </span>
                {seq.involvesCopyPaste && (
                  <span className="text-xs bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">copy-paste</span>
                )}
                {seq.involvesFormFill && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">form fill</span>
                )}
              </div>
              <span className="text-xs text-gray-500">{formatDuration(seq.totalTimeMs)} total</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {seq.steps.map((step, j) => (
                <div key={j} className="flex items-center gap-1">
                  <div className="bg-gray-700/80 rounded-lg px-3 py-2 text-sm">
                    <div className="text-white font-medium">{formatAppName(step.app)}</div>
                    <div className="text-gray-400 text-xs">{step.section}</div>
                    {step.actions.length > 0 && (
                      <div className="text-gray-500 text-xs mt-1">
                        {step.actions.slice(0, 2).join(", ")}
                      </div>
                    )}
                    <div className="text-gray-600 text-xs">~{formatDuration(step.avgDurationMs)}</div>
                  </div>
                  {j < seq.steps.length - 1 && (
                    <span className="text-gray-600 text-lg mx-1">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
