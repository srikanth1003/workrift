import { useEffect, useState, useCallback } from "react";
import { TopSites } from "./components/TopSites";
import { PatternList } from "./components/PatternList";
import { TimelineView } from "./components/TimelineView";
import { WeeklyReport } from "./components/WeeklyReport";
import { ActivityBreakdown } from "./components/ActivityBreakdown";
import { AIInsights } from "./components/AIInsights";
import { PeriodSelector, getRange } from "./components/PeriodSelector";
import type { DateRange } from "./components/PeriodSelector";
import { WorkflowSequences } from "./components/WorkflowSequences";
import { Settings } from "./components/Settings";
import type { WorkEvent, DetectedPattern, DomainStat, ActivityEvent } from "@shared/types";

const defaultRange = getRange("today", "");

export function App() {
  const [events, setEvents] = useState<WorkEvent[]>([]);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [clearConfirm, setClearConfirm] = useState<"none" | "period" | "all">("none");

  const fetchActivities = useCallback((range: DateRange) => {
    chrome.runtime.sendMessage({
      type: "GET_ACTIVITIES_RANGE",
      startTime: range.startTime,
      endTime: range.endTime,
    }).then((response) => {
      setActivities((response as { activities: ActivityEvent[] })?.activities ?? []);
    });
  }, []);

  useEffect(() => {
    Promise.all([
      chrome.runtime.sendMessage({ type: "GET_TODAY_STATS" }),
      chrome.runtime.sendMessage({ type: "GET_PATTERNS" }),
      chrome.runtime.sendMessage({ type: "GET_TODAY_EVENTS" }),
      chrome.runtime.sendMessage({
        type: "GET_ACTIVITIES_RANGE",
        startTime: defaultRange.startTime,
        endTime: defaultRange.endTime,
      }),
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

  function handlePeriodChange(range: DateRange) {
    setDateRange(range);
    setClearConfirm("none");
    fetchActivities(range);
  }

  async function handleClearPeriod() {
    await chrome.runtime.sendMessage({
      type: "CLEAR_DATA",
      startTime: dateRange.startTime,
      endTime: dateRange.endTime,
    });
    setClearConfirm("none");
    setActivities([]);
    fetchActivities(dateRange);
  }

  async function handleClearAll() {
    await chrome.runtime.sendMessage({ type: "CLEAR_DATA", clearAll: true });
    setClearConfirm("none");
    setActivities([]);
    setEvents([]);
    setPatterns([]);
    setDomainStats([]);
  }

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">W</div>
            <h1 className="text-xl font-semibold">Work Recognizer</h1>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector onChange={handlePeriodChange} />
            <div className="relative">
              <button
                onClick={() => setClearConfirm(clearConfirm === "none" ? "period" : "none")}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 bg-gray-800 rounded-lg transition-colors"
                title="Clear tracking data"
              >
                Clear Data
              </button>
              {clearConfirm !== "none" && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl z-10 w-64">
                  <p className="text-sm text-gray-300 mb-3">What do you want to clear?</p>
                  <div className="space-y-2">
                    <button
                      onClick={handleClearPeriod}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-700 hover:bg-red-900/40 hover:text-red-300 rounded-lg transition-colors"
                    >
                      Clear {dateRange.label}
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Remove events and activities for this period
                      </span>
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-700 hover:bg-red-900/40 hover:text-red-300 rounded-lg transition-colors"
                    >
                      Clear All Data
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Remove all tracking data and cached analyses
                      </span>
                    </button>
                    <button
                      onClick={() => setClearConfirm("none")}
                      className="w-full text-center px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <ActivityBreakdown activities={activities} periodLabel={dateRange.label} />
          <WorkflowSequences dateRange={dateRange} />
          <AIInsights dateRange={dateRange} />
          <WeeklyReport stats={todayStats} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopSites stats={domainStats} />
            <TimelineView events={events} />
          </div>
          <PatternList patterns={patterns} />
          <Settings />
        </div>
      </div>
    </div>
  );
}
