import { useEffect, useState } from "react";
import type { WorkflowAnalysis } from "@shared/workflow-analyzer";
import type { DateRange } from "./PeriodSelector";

function timeAgo(timestamp: number): string {
  const mins = Math.round((Date.now() - timestamp) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}h ${remaining}m ago` : `${hours}h ago`;
}

type AnalyzeResponse =
  | { analysis: WorkflowAnalysis; cachedAt: number }
  | { error: string };

interface AIInsightsProps {
  dateRange: DateRange;
}

export function AIInsights({ dateRange }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnalysis(null);
    setCachedAt(null);
    setError(null);

    chrome.runtime.sendMessage({
      type: "ANALYZE_WORKFLOW",
      startTime: dateRange.startTime,
      endTime: dateRange.endTime,
    }).then((response) => {
      const res = response as AnalyzeResponse;
      if ("analysis" in res) {
        setAnalysis(res.analysis);
        setCachedAt(res.cachedAt);
      }
    });
  }, [dateRange.startTime, dateRange.endTime]);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({
        type: "ANALYZE_WORKFLOW",
        forceRefresh: true,
        startTime: dateRange.startTime,
        endTime: dateRange.endTime,
      }) as AnalyzeResponse;
      if ("error" in response) {
        setError(response.error);
      } else {
        setAnalysis(response.analysis);
        setCachedAt(response.cachedAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Workflow Analysis</h2>
          {cachedAt && !loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              Last analyzed {timeAgo(cachedAt)} — {dateRange.label}
            </p>
          )}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "Analyzing..." : analysis ? "Re-analyze" : "Analyze My Workflow"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing your workflow with Claude...</span>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-5">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-200 text-sm leading-relaxed">{analysis.summary}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
              <span>Tracked: {analysis.totalTrackedTime}</span>
              <span>Top activity: {analysis.topActivity}</span>
              {analysis.estimatedWeeklyTimeSaved && (
                <span className="text-emerald-400 font-medium">
                  Potential savings: {analysis.estimatedWeeklyTimeSaved}
                </span>
              )}
            </div>
          </div>

          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
            <div className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">Workflow Pattern</div>
            <p className="text-gray-200 text-sm">{analysis.workflowPattern}</p>
          </div>

          {analysis.automatableWorkflows && analysis.automatableWorkflows.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Automatable Workflows</h3>
              <div className="space-y-3">
                {analysis.automatableWorkflows.map((wf, i) => (
                  <div key={i} className="border border-amber-500/20 bg-amber-900/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-amber-300 font-medium text-sm">{wf.name}</span>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>{wf.frequencyPerDay}</span>
                        <span>{wf.timePerOccurrence} each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {wf.steps.map((step, j) => (
                        <span key={j} className="flex items-center gap-1.5">
                          <span className="text-xs bg-gray-700/80 text-gray-300 px-2 py-0.5 rounded">{step}</span>
                          {j < wf.steps.length - 1 && <span className="text-gray-600">→</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-300 text-sm">{wf.automationApproach}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Suggestions</h3>
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion, i) => (
                <div key={i} className="border border-emerald-500/20 bg-emerald-900/10 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-300 font-medium text-sm">{suggestion.activity}</span>
                        {suggestion.confidence && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            suggestion.confidence === "high" ? "bg-emerald-500/20 text-emerald-300" :
                            suggestion.confidence === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-gray-500/20 text-gray-400"
                          }`}>{suggestion.confidence}</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        Time spent: {suggestion.timeSpent}
                      </div>
                      <div className="text-gray-300 text-sm mt-2">{suggestion.pain}</div>
                      <div className="text-white text-sm mt-2">{suggestion.suggestion}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs font-medium">
                        {suggestion.tool}
                      </div>
                      {suggestion.toolCostPerMonth && (
                        <div className="text-gray-500 text-xs mt-1">{suggestion.toolCostPerMonth}</div>
                      )}
                      <div className="text-emerald-400/60 text-xs mt-1">
                        Save {suggestion.estimatedTimeSaved}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <p className="text-gray-500 text-sm py-4 text-center">
          Click "Analyze My Workflow" to get AI-powered suggestions for {dateRange.label.toLowerCase()}.
        </p>
      )}
    </div>
  );
}
