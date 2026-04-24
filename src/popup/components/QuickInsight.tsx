import type { DetectedPattern } from "@shared/types";

interface QuickInsightProps {
  patterns: DetectedPattern[];
}

const typeLabels: Record<DetectedPattern["type"], string> = {
  context_switching: "Context Switching",
  repetitive_sequence: "Repetitive Workflow",
  frequent_copy_paste: "Manual Data Transfer",
  manual_data_transfer: "Manual Data Transfer",
};

export function QuickInsight({ patterns }: QuickInsightProps) {
  if (patterns.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        Still learning your patterns. Keep working normally.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {patterns.slice(0, 3).map((pattern, i) => (
        <div key={i} className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-3">
          <div className="text-xs text-indigo-400 font-medium">{typeLabels[pattern.type]}</div>
          <div className="text-sm text-gray-200 mt-1">{pattern.description}</div>
          <div className="text-xs text-gray-500 mt-1">{pattern.frequency}x detected</div>
        </div>
      ))}
    </div>
  );
}
