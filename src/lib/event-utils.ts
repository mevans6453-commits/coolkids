import type { Event } from "./types";

/**
 * Merge consecutive-day events with the same name + venue into a single event
 * with a date range. For example, "Museums On Us Weekend" on Apr 4 and Apr 5
 * becomes a single event with start_date=Apr 4, end_date=Apr 5.
 *
 * Only merges events that are on consecutive calendar days (1-day gap).
 * Events on the same day but different weeks (recurring) are NOT merged.
 */
export function mergeConsecutiveEvents(events: Event[]): Event[] {
  if (events.length === 0) return events;

  // Group by name + venue_id
  const groups = new Map<string, Event[]>();
  for (const e of events) {
    const key = `${e.name}|${e.venue_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const result: Event[] = [];
  const mergedIds = new Set<string>();

  for (const [, group] of groups) {
    if (group.length <= 1) continue;

    // Sort group by start_date
    const sorted = [...group].sort((a, b) => a.start_date.localeCompare(b.start_date));

    // Find consecutive runs
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && isConsecutiveDay(sorted[j].start_date, sorted[j + 1].start_date)) {
        j++;
      }

      if (j > i) {
        // Found a consecutive run — merge into the first event
        const merged = { ...sorted[i] };
        const lastDate = sorted[j].end_date || sorted[j].start_date;
        merged.end_date = lastDate > merged.start_date ? lastDate : sorted[j].start_date;
        result.push(merged);

        // Mark all others as merged (to be removed)
        for (let k = i + 1; k <= j; k++) {
          mergedIds.add(sorted[k].id);
        }
      }
      i = j + 1;
    }
  }

  // Return: original events minus merged duplicates, plus merged events
  const withoutDupes = events.filter((e) => !mergedIds.has(e.id));

  // Replace the original first-event with the merged version
  return withoutDupes.map((e) => {
    const merged = result.find((m) => m.id === e.id);
    return merged ?? e;
  });
}

/** Check if dateB is exactly 1 day after dateA (YYYY-MM-DD strings) */
function isConsecutiveDay(dateA: string, dateB: string): boolean {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  const diff = b.getTime() - a.getTime();
  return diff === 86400000; // exactly 1 day in ms
}

/**
 * Generate the list of individual dates to show when a multi-day event is expanded.
 * - Spans ≤ 7 days: every day
 * - Spans > 7 days: weekends only (Sat/Sun)
 */
export type ExpandedDate = {
  date: string;   // "YYYY-MM-DD"
  label: string;  // "Sat, Mar 1"
};

export function getExpandedDates(startDate: string, endDate: string): ExpandedDate[] {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);

  const dates: ExpandedDate[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const dayOfWeek = cursor.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (diffDays <= 7 || isWeekend) {
      dates.push({
        date: cursor.toISOString().split("T")[0],
        label: cursor.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

/**
 * Format a date range for display.
 * Single day: "Sat, Mar 21"
 * Multi-day same month: "Apr 4–5"
 * Multi-day different months: "Mar 30 – Apr 2"
 */
export function formatDateRange(startDate: string, endDate: string | null): string {
  const start = new Date(startDate + "T00:00:00");
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (!endDate || endDate === startDate) {
    return startStr;
  }

  const end = new Date(endDate + "T00:00:00");

  if (start.getMonth() === end.getMonth()) {
    // Same month: "Apr 4–5"
    return `${startStr}–${end.getDate()}`;
  } else {
    // Different months: "Mar 30 – Apr 2"
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${startStr} – ${endStr}`;
  }
}
