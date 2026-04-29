import { computeInsights } from "@shared/instant-insights";
import type { ActivityEvent } from "@shared/types";

interface InstantInsightsProps {
  activities: ActivityEvent[];
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatAppName(app: string): string {
  if (app === "unknown") return "Other Sites";
  return app
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function InstantInsights({ activities }: InstantInsightsProps) {
  const insights = computeInsights(activities);

  if (insights.tier === "empty") {
    return (
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700/30 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" />
          <h2 className="text-lg font-semibold text-white">Workrift is tracking</h2>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Browse normally — your first insights will appear in a few minutes.
        </p>
      </div>
    );
  }

  const headline = insights.dominantApp
    ? `${formatAppName(insights.dominantApp)} is ${insights.dominantAppPct}% of your time`
    : `You've used ${insights.uniqueApps} apps`;

  const pills: { label: string; color: string }[] = [];

  pills.push({
    label: `${insights.uniqueApps} app${insights.uniqueApps !== 1 ? "s" : ""} used`,
    color: "bg-gray-700 text-gray-300",
  });

  if (insights.tier !== "minimal") {
    if (insights.contextSwitchRate === "high") {
      pills.push({
        label: `${insights.contextSwitchesPerHour} switches/hr — high`,
        color: "bg-amber-500/20 text-amber-300",
      });
    } else if (insights.contextSwitchRate === "moderate") {
      pills.push({
        label: `${insights.contextSwitchesPerHour} switches/hr`,
        color: "bg-gray-700 text-gray-300",
      });
    } else {
      pills.push({
        label: "Focused work session",
        color: "bg-emerald-500/20 text-emerald-300",
      });
    }

    if (insights.totalCopyPaste > 0) {
      pills.push({
        label: `${insights.totalCopyPaste} copy/paste`,
        color: "bg-gray-700 text-gray-300",
      });
    }
  }

  if (insights.tier === "full") {
    if (insights.crossAppCopyPaste) {
      pills.push({
        label: `${formatAppName(insights.crossAppCopyPaste.from)} → ${formatAppName(insights.crossAppCopyPaste.to)} copy-paste (${insights.crossAppCopyPaste.count}x)`,
        color: "bg-orange-500/20 text-orange-300",
      });
    }

    if (insights.formHeavyPct > 30) {
      pills.push({
        label: `${insights.formHeavyPct}% sessions involve forms`,
        color: "bg-blue-500/20 text-blue-300",
      });
    }

    if (insights.typingSignal === "content-creation") {
      pills.push({
        label: "Heavy typing — content creation",
        color: "bg-purple-500/20 text-purple-300",
      });
    } else if (insights.typingSignal === "data-entry") {
      pills.push({
        label: "Low typing + forms — data entry pattern",
        color: "bg-amber-500/20 text-amber-300",
      });
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700/30 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white">{headline}</h2>

      <div className="flex flex-wrap gap-2 mt-3">
        {pills.map((pill, i) => (
          <span
            key={i}
            className={`text-xs px-2.5 py-1 rounded-full ${pill.color}`}
          >
            {pill.label}
          </span>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Based on {formatDuration(insights.totalDurationMs)} of tracked activity
        across {activities.length} session{activities.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
