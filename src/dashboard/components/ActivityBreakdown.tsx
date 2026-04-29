import type { ActivityEvent } from "@shared/types";

interface ActivityBreakdownProps {
  activities: ActivityEvent[];
  periodLabel?: string;
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

interface AggregatedApp {
  app: string;
  totalDuration: number;
  sessions: number;
  sections: Set<string>;
  modes: Set<string>;
  allFormFields: Set<string>;
  totalCopyPaste: number;
  totalTypingMs: number;
  clickedButtons: Map<string, number>;
  clickedLinks: Map<string, number>;
  headings: Set<string>;
  domains: Set<string>;
  titles: Set<string>;
}

function aggregateByApp(activities: ActivityEvent[]): AggregatedApp[] {
  const map = new Map<string, AggregatedApp>();

  for (const activity of activities) {
    const key = activity.app || activity.domain || "unknown";
    let agg = map.get(key);
    if (!agg) {
      agg = {
        app: key,
        totalDuration: 0,
        sessions: 0,
        sections: new Set(),
        modes: new Set(),
        allFormFields: new Set(),
        totalCopyPaste: 0,
        totalTypingMs: 0,
        clickedButtons: new Map(),
        clickedLinks: new Map(),
        headings: new Set(),
        domains: new Set(),
        titles: new Set(),
      };
      map.set(key, agg);
    }

    agg.totalDuration += activity.durationMs;
    agg.sessions++;
    agg.totalCopyPaste += activity.copyPasteCount;
    agg.totalTypingMs += activity.typingDurationMs;
    agg.sections.add(activity.section);
    agg.domains.add(activity.domain);
    if (activity.context.mode) agg.modes.add(activity.context.mode);
    for (const field of activity.formFieldsInteracted) agg.allFormFields.add(field);
    for (const h of (activity.context.headings ?? [])) agg.headings.add(h);
    for (const b of (activity.clickedButtons ?? [])) agg.clickedButtons.set(b, (agg.clickedButtons.get(b) ?? 0) + 1);
    for (const l of (activity.clickedLinks ?? [])) agg.clickedLinks.set(l, (agg.clickedLinks.get(l) ?? 0) + 1);
    if (activity.title) agg.titles.add(activity.title.length > 50 ? activity.title.slice(0, 50) + "…" : activity.title);
  }

  return Array.from(map.values()).sort((a, b) => b.totalDuration - a.totalDuration);
}

const appColors: Record<string, string> = {
  gmail: "text-red-400 bg-red-400/10 border-red-500/30",
  outlook: "text-blue-400 bg-blue-400/10 border-blue-500/30",
  "google-docs": "text-cyan-400 bg-cyan-400/10 border-cyan-500/30",
  "google-sheets": "text-green-400 bg-green-400/10 border-green-500/30",
  "google-slides": "text-yellow-400 bg-yellow-400/10 border-yellow-500/30",
  "google-calendar": "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
  salesforce: "text-blue-300 bg-blue-300/10 border-blue-400/30",
  hubspot: "text-orange-400 bg-orange-400/10 border-orange-500/30",
  linkedin: "text-sky-400 bg-sky-400/10 border-sky-500/30",
  jira: "text-blue-400 bg-blue-400/10 border-blue-500/30",
  notion: "text-gray-300 bg-gray-300/10 border-gray-400/30",
  slack: "text-purple-400 bg-purple-400/10 border-purple-500/30",
};

const defaultColor = "text-gray-400 bg-gray-400/10 border-gray-500/30";

function formatAppName(app: string): string {
  if (app === "unknown") return "Other Sites";
  return app.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function ActivityBreakdown({ activities, periodLabel }: ActivityBreakdownProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">What You Actually Did</h2>
        <div className="text-gray-500 text-sm py-8 text-center">
          No activity captured{periodLabel ? ` for ${periodLabel.toLowerCase()}` : ""}. Keep working normally — we'll show you exactly how you spent your time.
        </div>
      </div>
    );
  }

  const aggregated = aggregateByApp(activities);
  const totalTime = aggregated.reduce((sum, a) => sum + a.totalDuration, 0);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">What You Actually Did</h2>
      <p className="text-sm text-gray-500 mb-5">
        {periodLabel ?? "Today"} — {formatDuration(totalTime)} of tracked activity across {activities.length} sessions
      </p>

      <div className="space-y-4">
        {aggregated.map((agg) => {
          const color = appColors[agg.app] || defaultColor;
          const pct = totalTime > 0 ? Math.round((agg.totalDuration / totalTime) * 100) : 0;

          return (
            <div key={agg.app} className={`border rounded-lg p-4 ${color}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatAppName(agg.app)}</span>
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

              <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-3">
                <div
                  className="h-1.5 rounded-full bg-current opacity-60"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="text-sm text-gray-300">
                <span className="text-gray-500">Sections: </span>
                {Array.from(agg.sections).join(", ")}
              </div>

              {agg.titles.size > 0 && (
                <div className="text-sm text-gray-300 mt-1">
                  <span className="text-gray-500">Pages: </span>
                  {Array.from(agg.titles).slice(0, 5).join(" · ")}
                  {agg.titles.size > 5 && <span className="text-gray-500"> +{agg.titles.size - 5} more</span>}
                </div>
              )}

              {agg.modes.size > 0 && (
                <div className="text-sm text-gray-300 mt-1">
                  <span className="text-gray-500">Modes: </span>
                  {Array.from(agg.modes).join(", ")}
                </div>
              )}

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

              {agg.clickedButtons.size > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="text-xs text-gray-500">Buttons clicked:</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.from(agg.clickedButtons.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([btn, count]) => (
                        <span key={btn} className="text-xs bg-gray-700/50 px-2 py-0.5 rounded">
                          {btn}{count > 1 ? ` (${count}x)` : ""}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {agg.clickedLinks.size > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="text-xs text-gray-500">Links clicked:</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.from(agg.clickedLinks.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([link, count]) => (
                        <span key={link} className="text-xs bg-gray-700/50 px-2 py-0.5 rounded">
                          {link}{count > 1 ? ` (${count}x)` : ""}
                        </span>
                      ))}
                  </div>
                </div>
              )}

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
