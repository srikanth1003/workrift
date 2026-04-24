import type { DomainStat } from "@shared/types";

interface TopSitesProps {
  stats: DomainStat[];
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function TopSites({ stats }: TopSitesProps) {
  const sorted = [...stats].sort((a, b) => b.totalTime - a.totalTime);
  const maxTime = sorted[0]?.totalTime ?? 1;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Time by Tool</h2>
      {sorted.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 text-center">No data yet. Keep browsing.</div>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, 10).map((stat) => (
            <div key={stat.domain}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{stat.domain}</span>
                <span className="text-gray-500">{formatTime(stat.totalTime)} · {stat.visitCount} visits</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${(stat.totalTime / maxTime) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
