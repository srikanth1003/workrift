import type { ActivityEvent, ActivityType } from "@shared/types";

interface ActivityBreakdownProps {
  activities: ActivityEvent[];
}

const activityConfig: Record<ActivityType, { label: string; color: string; icon: string }> = {
  email_composing: { label: "Composing Emails", color: "text-blue-400 bg-blue-400/10 border-blue-500/30", icon: "✉" },
  crm_data_entry: { label: "CRM Data Entry", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30", icon: "📋" },
  prospect_research: { label: "Prospect Research", color: "text-violet-400 bg-violet-400/10 border-violet-500/30", icon: "🔍" },
  document_writing: { label: "Document Writing", color: "text-cyan-400 bg-cyan-400/10 border-cyan-500/30", icon: "📝" },
  spreadsheet_editing: { label: "Spreadsheet Work", color: "text-green-400 bg-green-400/10 border-green-500/30", icon: "📊" },
  messaging: { label: "Messaging", color: "text-pink-400 bg-pink-400/10 border-pink-500/30", icon: "💬" },
  scheduling: { label: "Scheduling", color: "text-yellow-400 bg-yellow-400/10 border-yellow-500/30", icon: "📅" },
  search_research: { label: "Searching / Research", color: "text-orange-400 bg-orange-400/10 border-orange-500/30", icon: "🔎" },
  content_reading: { label: "Reading Content", color: "text-gray-400 bg-gray-400/10 border-gray-500/30", icon: "📖" },
  form_filling: { label: "Filling Forms", color: "text-amber-400 bg-amber-400/10 border-amber-500/30", icon: "📄" },
  general_browsing: { label: "General Browsing", color: "text-gray-500 bg-gray-500/10 border-gray-600/30", icon: "🌐" },
};

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

interface AggregatedActivity {
  type: ActivityType;
  totalDuration: number;
  sessions: number;
  apps: Map<string, { duration: number; sections: Set<string> }>;
  allFormFields: Set<string>;
  totalCopyPaste: number;
  totalTypingMs: number;
}

function aggregateActivities(activities: ActivityEvent[]): AggregatedActivity[] {
  const map = new Map<ActivityType, AggregatedActivity>();

  for (const activity of activities) {
    let agg = map.get(activity.type);
    if (!agg) {
      agg = {
        type: activity.type,
        totalDuration: 0,
        sessions: 0,
        apps: new Map(),
        allFormFields: new Set(),
        totalCopyPaste: 0,
        totalTypingMs: 0,
      };
      map.set(activity.type, agg);
    }

    agg.totalDuration += activity.durationMs;
    agg.sessions++;
    agg.totalCopyPaste += activity.copyPasteCount;
    agg.totalTypingMs += activity.typingDurationMs;

    for (const field of activity.formFieldsInteracted) {
      agg.allFormFields.add(field);
    }

    let appEntry = agg.apps.get(activity.app);
    if (!appEntry) {
      appEntry = { duration: 0, sections: new Set() };
      agg.apps.set(activity.app, appEntry);
    }
    appEntry.duration += activity.durationMs;
    appEntry.sections.add(activity.section);
  }

  return Array.from(map.values()).sort((a, b) => b.totalDuration - a.totalDuration);
}

export function ActivityBreakdown({ activities }: ActivityBreakdownProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">What You Actually Did</h2>
        <div className="text-gray-500 text-sm py-8 text-center">
          No activity captured yet. Keep working normally — we'll show you exactly how you spent your time.
        </div>
      </div>
    );
  }

  const aggregated = aggregateActivities(activities);
  const totalTime = aggregated.reduce((sum, a) => sum + a.totalDuration, 0);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">What You Actually Did</h2>
      <p className="text-sm text-gray-500 mb-5">
        {formatDuration(totalTime)} of tracked activity across {activities.length} sessions
      </p>

      <div className="space-y-4">
        {aggregated.map((agg) => {
          const config = activityConfig[agg.type];
          const pct = totalTime > 0 ? Math.round((agg.totalDuration / totalTime) * 100) : 0;

          return (
            <div key={agg.type} className={`border rounded-lg p-4 ${config.color}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs opacity-60">{pct}%</span>
                  </div>
                  <div className="text-lg font-bold text-white mt-1">
                    {formatDuration(agg.totalDuration)}
                  </div>
                </div>
                <div className="text-xs opacity-60 text-right">
                  {agg.sessions} session{agg.sessions > 1 ? "s" : ""}
                </div>
              </div>

              {/* Time bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-3">
                <div
                  className="h-1.5 rounded-full bg-current opacity-60"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* App breakdown */}
              <div className="space-y-1 text-sm">
                {Array.from(agg.apps.entries()).map(([app, data]) => (
                  <div key={app} className="flex justify-between text-gray-300">
                    <span>
                      {app !== "unknown" ? app : "Other"}{" "}
                      <span className="text-gray-600">
                        ({Array.from(data.sections).join(", ")})
                      </span>
                    </span>
                    <span className="text-gray-500">{formatDuration(data.duration)}</span>
                  </div>
                ))}
              </div>

              {/* Form fields interacted */}
              {agg.allFormFields.size > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="text-xs text-gray-500">Fields filled:</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.from(agg.allFormFields).map((field) => (
                      <span key={field} className="text-xs bg-gray-700/50 px-2 py-0.5 rounded">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy/paste and typing stats */}
              {(agg.totalCopyPaste > 0 || agg.totalTypingMs > 30000) && (
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  {agg.totalCopyPaste > 0 && (
                    <span>{agg.totalCopyPaste} copy/paste actions</span>
                  )}
                  {agg.totalTypingMs > 30000 && (
                    <span>{formatDuration(agg.totalTypingMs)} typing</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
