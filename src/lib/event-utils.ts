import type { Event } from "./types";

/**
 * Merge same-name events at the same venue into a single display entry.
 *
 * Two merge modes:
 * 1. Consecutive days (e.g. "Museums On Us" Apr 4 + Apr 5 → "Apr 4–5")
 * 2. Recurring dates (e.g. "Morning Hikes" Apr 4, Apr 26, May 16 → one card
 *    with recurring_dates array for expandable display)
 *
 * The merged event uses the earliest start_date and latest end_date.
 * Non-consecutive recurring dates are stored in recurring_dates for display.
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

  const mergedEvents: Event[] = [];
  const mergedIds = new Set<string>();

  for (const [, group] of groups) {
    if (group.length <= 1) continue;

    // Sort group by start_date
    const sorted = [...group].sort((a, b) => a.start_date.localeCompare(b.start_date));

    // Check if ALL dates are consecutive (multi-day event like a weekend festival)
    let allConsecutive = true;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (!isConsecutiveDay(sorted[i].start_date, sorted[i + 1].start_date)) {
        allConsecutive = false;
        break;
      }
    }

    if (allConsecutive) {
      // Consecutive days — merge into date range (Apr 4–5)
      const merged = { ...sorted[0] };
      const lastDate = sorted[sorted.length - 1].end_date || sorted[sorted.length - 1].start_date;
      merged.end_date = lastDate > merged.start_date ? lastDate : sorted[sorted.length - 1].start_date;
      mergedEvents.push(merged);
      for (let k = 1; k < sorted.length; k++) {
        mergedIds.add(sorted[k].id);
      }
    } else {
      // Recurring (non-consecutive) — merge into one card with recurring_dates
      const merged: Event = {
        ...sorted[0],
        end_date: sorted[sorted.length - 1].end_date || sorted[sorted.length - 1].start_date,
        is_recurring: true,
        recurring_dates: sorted.map((e) => ({
          date: e.start_date,
          time: e.start_time || null,
        })),
      };
      mergedEvents.push(merged);
      for (let k = 1; k < sorted.length; k++) {
        mergedIds.add(sorted[k].id);
      }
    }
  }

  // Return: original events minus merged duplicates, plus merged events
  const withoutDupes = events.filter((e) => !mergedIds.has(e.id));

  return withoutDupes.map((e) => {
    const merged = mergedEvents.find((m) => m.id === e.id);
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
