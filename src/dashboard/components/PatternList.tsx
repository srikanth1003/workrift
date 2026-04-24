import type { DetectedPattern } from "@shared/types";

interface PatternListProps {
  patterns: DetectedPattern[];
}

const typeConfig: Record<DetectedPattern["type"], { label: string; color: string }> = {
  context_switching: { label: "Context Switching", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  repetitive_sequence: { label: "Repetitive Workflow", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  frequent_copy_paste: { label: "Manual Data Transfer", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  manual_data_transfer: { label: "Manual Data Transfer", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
};

export function PatternList({ patterns }: PatternListProps) {
  if (patterns.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Detected Patterns</h2>
        <div className="text-gray-500 text-sm py-8 text-center">Still learning your workflow patterns. This usually takes a day of normal work.</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Detected Patterns</h2>
      <div className="space-y-3">
        {patterns.map((pattern, i) => {
          const config = typeConfig[pattern.type];
          return (
            <div key={i} className={`border rounded-lg p-4 ${config.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium uppercase tracking-wide">{config.label}</span>
                <span className="text-xs opacity-60">{pattern.frequency}x detected</span>
              </div>
              <div className="text-sm text-gray-200">{pattern.description}</div>
              <div className="text-xs text-gray-500 mt-2">Across: {pattern.domains.join(", ")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
