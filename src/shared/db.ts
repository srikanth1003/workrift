import Dexie, { type Table } from "dexie";
import type { WorkEvent, DetectedPattern, DailySummary, DomainStat, ActivityEvent } from "./types";

class WorkRecognizerDB extends Dexie {
  events!: Table<WorkEvent, number>;
  patterns!: Table<DetectedPattern, number>;
  dailySummaries!: Table<DailySummary, number>;
  activities!: Table<ActivityEvent, number>;

  constructor() {
    super("WorkRecognizerDB");
    this.version(1).stores({
      events: "++id, type, timestamp, domain, [type+timestamp]",
      patterns: "++id, type, lastSeen",
      dailySummaries: "++id, &date",
    });
    this.version(2).stores({
      events: "++id, type, timestamp, domain, [type+timestamp]",
      patterns: "++id, type, lastSeen",
      dailySummaries: "++id, &date",
      activities: "++id, type, app, domain, startTime, [app+startTime]",
    });
  }
}

export const db = new WorkRecognizerDB();

export async function addEvent(event: Omit<WorkEvent, "id">): Promise<number> {
  return db.events.add(event as WorkEvent);
}

export async function getEventsByDateRange(
  start: number,
  end: number
): Promise<WorkEvent[]> {
  return db.events.where("timestamp").between(start, end).toArray();
}

export async function getDomainStats(
  start: number,
  end: number
): Promise<DomainStat[]> {
  const events = await db.events
    .where("timestamp")
    .between(start, end)
    .sortBy("timestamp");

  const tabEvents = events.filter(
    (e) => e.type === "tab_switch" || e.type === "navigation"
  );

  const domainMap = new Map<
    string,
    { totalTime: number; visitCount: number }
  >();

  for (let i = 0; i < tabEvents.length; i++) {
    const event = tabEvents[i];
    const nextTimestamp =
      i + 1 < tabEvents.length ? tabEvents[i + 1].timestamp : event.timestamp;
    const timeSpent = nextTimestamp - event.timestamp;

    const existing = domainMap.get(event.domain) ?? {
      totalTime: 0,
      visitCount: 0,
    };
    existing.totalTime += timeSpent;
    existing.visitCount += 1;
    domainMap.set(event.domain, existing);
  }

  const dateStr = new Date(start).toISOString().split("T")[0];
  return Array.from(domainMap.entries()).map(([domain, stats]) => ({
    domain,
    totalTime: stats.totalTime,
    visitCount: stats.visitCount,
    date: dateStr,
  }));
}

export async function clearOldEvents(daysToKeep: number): Promise<void> {
  const cutoff = Date.now() - daysToKeep * 24 * 3600_000;
  await db.events.where("timestamp").below(cutoff).delete();
}

export async function addActivity(activity: Omit<ActivityEvent, "id">): Promise<number> {
  return db.activities.add(activity as ActivityEvent);
}

export async function getActivitiesByDateRange(
  start: number,
  end: number
): Promise<ActivityEvent[]> {
  return db.activities.where("startTime").between(start, end).toArray();
}
