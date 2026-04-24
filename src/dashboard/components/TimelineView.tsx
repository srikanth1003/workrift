import type { WorkEvent } from "@shared/types";

interface TimelineViewProps {
  events: WorkEvent[];
}

const typeColors: Record<string, string> = {
  tab_switch: "bg-blue-500",
  navigation: "bg-green-500",
  copy: "bg-yellow-500",
  paste: "bg-orange-500",
  form_fill: "bg-purple-500",
  text_selection: "bg-pink-500",
};

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TimelineView({ events }: TimelineViewProps) {
  const recent = events.slice(-50).reverse();

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Activity Timeline</h2>
      {recent.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 text-center">No activity recorded yet.</div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {recent.map((event, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 text-sm">
              <span className="text-xs text-gray-500 w-14 shrink-0">{formatTimestamp(event.timestamp)}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${typeColors[event.type] ?? "bg-gray-500"}`} />
              <span className="text-gray-300 truncate">{event.domain}</span>
              <span className="text-xs text-gray-600 ml-auto shrink-0">{event.type.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
