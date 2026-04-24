import { useEffect, useState } from "react";
import { TopSites } from "./components/TopSites";
import { PatternList } from "./components/PatternList";
import { TimelineView } from "./components/TimelineView";
import { WeeklyReport } from "./components/WeeklyReport";
import { ActivityBreakdown } from "./components/ActivityBreakdown";
import type { WorkEvent, DetectedPattern, DomainStat, ActivityEvent } from "@shared/types";

export function App() {
  const [events, setEvents] = useState<WorkEvent[]>([]);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      chrome.runtime.sendMessage({ type: "GET_TODAY_STATS" }),
      chrome.runtime.sendMessage({ type: "GET_PATTERNS" }),
      chrome.runtime.sendMessage({ type: "GET_TODAY_EVENTS" }),
      chrome.runtime.sendMessage({ type: "GET_TODAY_ACTIVITIES" }),
    ]).then(([stats, patternsResponse, eventsResponse, activitiesResponse]) => {
      const typedStats = stats as {
        totalEvents: number;
        tabSwitches: number;
        copyPastes: number;
        uniqueDomains: number;
        activeMinutes: number;
        domainStats?: DomainStat[];
      };
      setDomainStats(typedStats.domainStats ?? []);
      setPatterns((patternsResponse as { patterns: DetectedPattern[] }).patterns);
      setEvents((eventsResponse as { events: WorkEvent[] })?.events ?? []);
      setActivities((activitiesResponse as { activities: ActivityEvent[] })?.activities ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const todayStats = {
    totalTabSwitches: events.filter((e) => e.type === "tab_switch").length,
    totalCopyPastes: events.filter((e) => e.type === "copy" || e.type === "paste").length,
    totalDomains: new Set(events.map((e) => e.domain).filter(Boolean)).size,
    totalActiveMinutes: events.length > 1
      ? Math.round((events[events.length - 1].timestamp - events[0].timestamp) / 60_000)
      : 0,
    patternCount: patterns.length,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">W</div>
          <h1 className="text-xl font-semibold">Work Recognizer</h1>
        </div>
        <div className="space-y-6">
          <ActivityBreakdown activities={activities} />
          <WeeklyReport stats={todayStats} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopSites stats={domainStats} />
            <TimelineView events={events} />
          </div>
          <PatternList patterns={patterns} />
        </div>
      </div>
    </div>
  );
}
