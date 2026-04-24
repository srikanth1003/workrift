import { useEffect, useState } from "react";
import { StatCard } from "./components/StatCard";
import { QuickInsight } from "./components/QuickInsight";
import type { DetectedPattern } from "@shared/types";

interface TodayStats {
  totalEvents: number;
  tabSwitches: number;
  copyPastes: number;
  uniqueDomains: number;
  activeMinutes: number;
}

export function App() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      chrome.runtime.sendMessage({ type: "GET_TODAY_STATS" }),
      chrome.runtime.sendMessage({ type: "GET_PATTERNS" }),
    ]).then(([statsResponse, patternsResponse]) => {
      setStats(statsResponse as TodayStats);
      setPatterns((patternsResponse as { patterns: DetectedPattern[] }).patterns);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="w-80 bg-gray-900 text-white p-4 flex items-center justify-center h-48">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-900 text-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-xs font-bold">W</div>
        <h1 className="text-sm font-semibold">Work Recognizer</h1>
        <span className="text-xs text-gray-500 ml-auto">Today</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard label="Tab Switches" value={stats?.tabSwitches ?? 0} />
        <StatCard label="Copy/Paste" value={stats?.copyPastes ?? 0} />
        <StatCard label="Tools Used" value={stats?.uniqueDomains ?? 0} />
        <StatCard label="Active Time" value={`${stats?.activeMinutes ?? 0}m`} />
      </div>

      <div className="border-t border-gray-800 pt-3">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Detected Patterns</div>
        <QuickInsight patterns={patterns} />
      </div>

      <button
        onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("src/dashboard/index.html") })}
        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 px-4 rounded-lg transition-colors"
      >
        Open Full Dashboard
      </button>
    </div>
  );
}
