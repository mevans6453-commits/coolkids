import type { Event } from "./types";

/**
 * Build a Google Calendar "Add Event" URL from a CoolKids event.
 */
export function buildGoogleCalendarUrl(event: Event): string {
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", event.name);

  // Build date/time strings
  if (event.start_time) {
    const start = toGCalDateTime(event.start_date, event.start_time);
    const end = event.end_time
      ? toGCalDateTime(event.end_date ?? event.start_date, event.end_time)
      : toGCalDateTime(event.start_date, event.start_time, 2); // default +2 hours
    params.set("dates", `${start}/${end}`);
  } else {
    // All-day event
    const start = event.start_date.replace(/-/g, "");
    const endDate = event.end_date ?? event.start_date;
    // Google Calendar all-day end date is exclusive (day after)
    const end = nextDay(endDate).replace(/-/g, "");
    params.set("dates", `${start}/${end}`);
  }

  if (event.description) {
    params.set("details", event.description);
  }

  if (event.venue) {
    const parts = [event.venue.name, event.venue.address, event.venue.city, event.venue.state].filter(Boolean);
    params.set("location", parts.join(", "));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Convert "2026-03-21" + "9:30 AM" to "20260321T093000" */
function toGCalDateTime(date: string, time: string, addHours = 0): string {
  const datePart = date.replace(/-/g, "");
  const parsed = parseTime(time);
  let h = parsed.hours + addHours;
  const m = parsed.minutes;
  if (h >= 24) h -= 24;
  return `${datePart}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
}

/** Parse "9:30 AM", "12 PM", "1:00 PM", etc. to { hours, minutes } in 24h */
function parseTime(time: string): { hours: number; minutes: number } {
  const cleaned = time.replace(/\./g, "").trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return { hours: 12, minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const period = match[3];

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

/** Return the next day as "YYYY-MM-DD" */
function nextDay(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
