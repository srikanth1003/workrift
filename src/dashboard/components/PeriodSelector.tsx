import { useState } from "react";

export type PeriodType = "today" | "yesterday" | "week" | "custom";

export interface DateRange {
  startTime: number;
  endTime: number;
  label: string;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getRange(period: PeriodType, customDate: string): DateRange {
  const now = new Date();

  switch (period) {
    case "today":
      return {
        startTime: startOfDay(now).getTime(),
        endTime: now.getTime(),
        label: "Today",
      };
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startTime: startOfDay(yesterday).getTime(),
        endTime: endOfDay(yesterday).getTime(),
        label: "Yesterday",
      };
    }
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return {
        startTime: startOfDay(weekStart).getTime(),
        endTime: now.getTime(),
        label: "This Week",
      };
    }
    case "custom": {
      if (!customDate) {
        return { startTime: startOfDay(now).getTime(), endTime: now.getTime(), label: "Today" };
      }
      const date = new Date(customDate + "T00:00:00");
      const isToday = startOfDay(date).getTime() === startOfDay(now).getTime();
      return {
        startTime: startOfDay(date).getTime(),
        endTime: isToday ? now.getTime() : endOfDay(date).getTime(),
        label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      };
    }
  }
}

interface PeriodSelectorProps {
  onChange: (range: DateRange) => void;
}

export function PeriodSelector({ onChange }: PeriodSelectorProps) {
  const [period, setPeriod] = useState<PeriodType>("today");
  const [customDate, setCustomDate] = useState("");

  function handlePeriodChange(p: PeriodType) {
    setPeriod(p);
    if (p !== "custom") {
      onChange(getRange(p, ""));
    }
  }

  function handleDateChange(date: string) {
    setCustomDate(date);
    onChange(getRange("custom", date));
  }

  const tabs: { value: PeriodType; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "This Week" },
    { value: "custom", label: "Pick Date" },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex bg-gray-800 rounded-lg p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handlePeriodChange(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              period === tab.value
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <input
          type="date"
          value={customDate}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => handleDateChange(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      )}
    </div>
  );
}

export { getRange };
