import { useState } from "react";

const steps = [
  {
    title: "Work Recognizer watches how you work",
    body: "We silently observe your browser patterns — tab switches, copy-paste flows, repeated workflows — to understand where you spend time and where friction lives.",
    emphasis: "No screenshots. No keylogging. No content reading.",
  },
  {
    title: "Everything stays on your machine",
    body: "All data is stored locally in your browser using IndexedDB. Nothing is sent to any server. You own your data completely.",
    emphasis: "Zero cloud. Zero tracking. Zero accounts.",
  },
  {
    title: "We surface patterns you can't see",
    body: "After a day of normal work, we'll show you: which tools eat your time, where you context-switch most, what workflows you repeat manually, and where AI could help.",
    emphasis: "Insights appear in your popup and dashboard.",
  },
  {
    title: "You're all set",
    body: "Just keep working normally. Click the extension icon anytime to see your stats. We'll surface your first insights within 24 hours.",
    emphasis: null,
  },
];

export function App() {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-lg w-full px-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-lg font-bold">W</div>
          <span className="text-lg font-semibold">Work Recognizer</span>
        </div>

        <div className="mb-8">
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-indigo-500" : "bg-gray-700"}`} />
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4">{current.title}</h2>
          <p className="text-gray-300 text-lg leading-relaxed">{current.body}</p>
          {current.emphasis && (
            <p className="text-indigo-400 font-medium mt-4">{current.emphasis}</p>
          )}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 text-gray-400 hover:text-white transition-colors">Back</button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                window.close();
              } else {
                setStep(step + 1);
              }
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors ml-auto"
          >
            {isLast ? "Start Working" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
