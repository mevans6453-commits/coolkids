"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Star, Hand } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/types";

type Props = {
  events: Event[];
  interactionCounts: Record<string, { stars: number; attending: number }>;
};

export default function EventCalendar({ events, interactionCounts }: Props) {
  const supabase = createClient();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [attendingIds, setAttendingIds] = useState<Set<string>>(new Set());

  // Load user's attending events
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_event_interactions")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("interaction_type", "attending")
        .then(({ data }) => {
          if (data) setAttendingIds(new Set(data.map((d) => d.event_id)));
        });
    });
  }, [supabase]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    // Leading blanks
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    // Trailing blanks to complete the row
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [year, month]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const e of events) {
      const start = new Date(e.start_date + "T00:00:00");
      const end = e.end_date ? new Date(e.end_date + "T00:00:00") : start;

      // Add event to every day it spans within this month
      const cursor = new Date(Math.max(start.getTime(), new Date(year, month, 1).getTime()));
      const lastDay = new Date(Math.min(end.getTime(), new Date(year, month + 1, 0).getTime()));

      while (cursor <= lastDay) {
        const key = cursor.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(e);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // Sort each day: attending events first, then by name
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const aAttending = attendingIds.has(a.id) ? 0 : 1;
        const bAttending = attendingIds.has(b.id) ? 0 : 1;
        if (aAttending !== bAttending) return aAttending - bAttending;
        return a.name.localeCompare(b.name);
      });
    }

    return map;
  }, [events, year, month, attendingIds]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  return (
    <div className="mt-6">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          title="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          title="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day-of-week header */}
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
            <div
              key={dateStr}
              className={`min-h-[90px] border-b border-r border-gray-200 p-1 sm:min-h-[110px] sm:p-1.5 ${
                isToday ? "bg-blue-50/50" : "bg-white"
              }`}
            >
              {/* Day number */}
              <div className={`mb-0.5 text-xs font-medium ${isToday ? "text-[var(--primary)]" : "text-gray-500"}`}>
                {isToday ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                    {day}
                  </span>
                ) : (
                  day
                )}
              </div>

              {/* Events for this day */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const isAttending = attendingIds.has(e.id);
                  return (
                    <div
                      key={e.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight sm:text-xs ${
                        isAttending
                          ? "bg-blue-100 font-medium text-blue-800"
                          : e.is_free
                            ? "bg-green-50 text-green-800"
                            : "bg-gray-100 text-gray-700"
                      }`}
                      title={`${e.name}${e.venue ? ` — ${e.venue.name}` : ""}${e.start_time ? ` (${e.start_time})` : ""}`}
                    >
                      {isAttending && <Hand className="mr-0.5 inline h-2.5 w-2.5" />}
                      {e.name}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[10px] text-gray-400">
                    +{dayEvents.length - 3} more
                  </div>
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
          <span>You're going</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-50 ring-1 ring-green-200" />
          <span>Free event</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-gray-100" />
          <span>Event</span>
        </div>
      </div>
    </div>
  );
}
