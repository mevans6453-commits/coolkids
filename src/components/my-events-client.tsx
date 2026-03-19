"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, MapPin, Star, Hand, List, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateRange } from "@/lib/event-utils";
import type { Event } from "@/lib/types";

type Props = {
  attending: Event[];
  starred: Event[];
};

type ViewMode = "list" | "calendar";

export default function MyEventsClient({ attending, starred }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <>
      {/* View toggle */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {attending.length + starred.length} events saved
        </p>
        <div className="flex rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-l-lg p-1.5 ${viewMode === "list" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`rounded-r-lg p-1.5 ${viewMode === "calendar" ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
            title="Calendar view"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <MyEventsList attending={attending} starred={starred} />
      ) : (
        <MyEventsCalendar attending={attending} starred={starred} />
      )}
    </>
  );
}

/** List view — same as before but with date ranges */
function MyEventsList({ attending, starred }: Props) {
  return (
    <>
      {/* Attending section */}
      <section className="mt-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Hand className="h-5 w-5 text-blue-600" />
          I&apos;m Attending ({attending.length})
        </h2>
        {attending.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No events yet. Browse <a href="/events" className="text-blue-600 hover:underline">upcoming events</a> and click &quot;I&apos;m Going&quot;.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {attending.map((event) => (
              <MiniEventRow key={event.id} event={event} type="attending" />
            ))}
          </div>
        )}
      </section>

      {/* Starred section */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
          Starred ({starred.length})
        </h2>
        {starred.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No starred events yet. Browse <a href="/events" className="text-blue-600 hover:underline">upcoming events</a> and click the star button.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {starred.map((event) => (
              <MiniEventRow key={event.id} event={event} type="starred" />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/** Compact list row for My Events */
function MiniEventRow({ event, type }: { event: Event; type: "attending" | "starred" }) {
  return (
    <div className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${
      type === "attending" ? "border-blue-200 bg-blue-50/50" : "border-gray-200 bg-white"
    }`}>
      {/* Date */}
      <div className="hidden w-16 flex-shrink-0 text-center sm:block">
        <div className="text-sm font-bold text-[var(--primary)]">
          {formatDateRange(event.start_date, event.end_date)}
        </div>
        {event.start_time && (
          <div className="text-xs text-gray-500">{event.start_time}</div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900">{event.name}</h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {event.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.venue.name}
            </span>
          )}
          <span className="sm:hidden">
            {formatDateRange(event.start_date, event.end_date)}
            {event.start_time && ` · ${event.start_time}`}
          </span>
          {event.is_free && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">FREE</span>
          )}
          {!event.is_free && event.cost && (
            <span className="text-gray-600">{event.cost}</span>
          )}
        </div>
      </div>

      {/* Badge */}
      <div className="flex-shrink-0">
        {type === "attending" ? (
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Hand className="h-3 w-3" /> Going
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Star className="h-3 w-3 fill-amber-500" /> Starred
          </span>
        )}
      </div>
    </div>
  );
}

/** Calendar/Agenda view for My Events */
function MyEventsCalendar({ attending, starred }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const attendingIds = new Set(attending.map((e) => e.id));
  const allEvents = useMemo(() => {
    // Combine and deduplicate (an event could be both starred and attending)
    const map = new Map<string, Event>();
    for (const e of attending) map.set(e.id, e);
    for (const e of starred) if (!map.has(e.id)) map.set(e.id, e);
    return Array.from(map.values());
  }, [attending, starred]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const e of allEvents) {
      const start = new Date(e.start_date + "T00:00:00");
      const end = e.end_date ? new Date(e.end_date + "T00:00:00") : start;
      const cursor = new Date(Math.max(start.getTime(), new Date(year, month, 1).getTime()));
      const lastDay = new Date(Math.min(end.getTime(), new Date(year, month + 1, 0).getTime()));

      while (cursor <= lastDay) {
        const key = cursor.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(e);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // Sort: attending first, then starred
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const aAttending = attendingIds.has(a.id) ? 0 : 1;
        const bAttending = attendingIds.has(b.id) ? 0 : 1;
        if (aAttending !== bAttending) return aAttending - bAttending;
        return a.name.localeCompare(b.name);
      });
    }
    return map;
  }, [allEvents, year, month, attendingIds]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="mt-6">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 text-center text-xs font-medium text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-gray-200">
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} className="min-h-[90px] border-b border-r border-gray-200 bg-gray-50 sm:min-h-[110px]" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr}
              className={`min-h-[90px] border-b border-r border-gray-200 p-1 sm:min-h-[110px] sm:p-1.5 ${
                isToday ? "bg-blue-50/50" : "bg-white"
              }`}>
              <div className={`mb-0.5 text-xs font-medium ${isToday ? "text-[var(--primary)]" : "text-gray-500"}`}>
                {isToday ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-white">{day}</span>
                ) : day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const isAttending = attendingIds.has(e.id);
                  return (
                    <div key={e.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight sm:text-xs ${
                        isAttending ? "bg-blue-100 font-medium text-blue-800" : "bg-amber-50 text-amber-800"
                      }`}
                      title={`${isAttending ? "Going: " : "Starred: "}${e.name}${e.venue ? ` — ${e.venue.name}` : ""}`}>
                      {isAttending ? <Hand className="mr-0.5 inline h-2.5 w-2.5" /> : <Star className="mr-0.5 inline h-2.5 w-2.5" />}
                      {e.name}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[10px] text-gray-400">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-100" />
          <span>I&apos;m Going</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200" />
          <span>Starred</span>
        </div>
      </div>
    </div>
  );
}
