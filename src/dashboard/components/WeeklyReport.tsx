interface WeeklyReportProps {
  stats: {
    totalTabSwitches: number;
    totalCopyPastes: number;
    totalDomains: number;
    totalActiveMinutes: number;
    patternCount: number;
  };
}

export function WeeklyReport({ stats }: WeeklyReportProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700/30 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Weekly Summary</h2>
      <p className="text-sm text-gray-400 mb-4">Here's how you worked this week</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-white">{stats.totalTabSwitches}</div>
          <div className="text-xs text-gray-400">Tab Switches</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.totalCopyPastes}</div>
          <div className="text-xs text-gray-400">Copy/Paste Actions</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.totalDomains}</div>
          <div className="text-xs text-gray-400">Tools Used</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{Math.round(stats.totalActiveMinutes / 60)}h</div>
          <div className="text-xs text-gray-400">Active Time</div>
        </div>
      </div>
      {stats.patternCount > 0 && (
        <div className="mt-4 pt-4 border-t border-indigo-700/30">
          <div className="text-sm text-indigo-300">
            {stats.patternCount} workflow pattern{stats.patternCount > 1 ? "s" : ""} detected this week. Scroll down to see optimization suggestions.
          </div>
        </div>
      )}
    </div>
  );
}
