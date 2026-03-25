"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import {
  MapPin, Star, Hand, List, CalendarDays,
  ChevronLeft, ChevronRight, X, CalendarPlus,
  Share2, Check, Smartphone,
} from "lucide-react";
import { formatDateRange } from "@/lib/event-utils";
import { shareEvent } from "@/lib/share-utils";
import type { Event } from "@/lib/types";

// -----------------------------------------------
// Types
// -----------------------------------------------

type Props = {
  attending: Event[];
  starred: Event[];
  attendedDates?: Record<string, string>; // eventId → YYYY-MM-DD
};

type ViewMode = "list" | "calendar";

// -----------------------------------------------
// Main Component
// -----------------------------------------------

export default function MyEventsClient({ attending: initialAttending, starred: initialStarred, attendedDates = {} }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [attendingList, setAttendingList] = useState<Event[]>(initialAttending);
  const [starredList, setStarredList] = useState<Event[]>(initialStarred);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  // Quick lookup sets
  const attendingIds = useMemo(() => new Set(attendingList.map((e) => e.id)), [attendingList]);
  const starredIds = useMemo(() => new Set(starredList.map((e) => e.id)), [starredList]);

  // Total unique events saved
  const totalEvents = useMemo(() => {
    const all = new Set([...attendingList.map((e) => e.id), ...starredList.map((e) => e.id)]);
    return all.size;
  }, [attendingList, starredList]);

  // Date picker modal state for multi-day events
  const [datePickerEvent, setDatePickerEvent] = useState<Event | null>(null);

  // Generate date range for date picker
  function getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  // Toggle an interaction (star or attending) on/off
  const toggleInteraction = useCallback(
    async (eventId: string, type: "star" | "attending") => {
      const isActive = type === "star" ? starredIds.has(eventId) : attendingIds.has(eventId);

      // For multi-day events: show date picker when marking as attending
      if (type === "attending" && !isActive) {
        const event = [...attendingList, ...starredList].find((e) => e.id === eventId);
        if (event && event.end_date && event.end_date !== event.start_date) {
          setDatePickerEvent(event);
          return;
        }
      }

      setRemoving((prev) => new Set(prev).add(`${eventId}-${type}`));

      if (!user) {
        setRemoving((prev) => { const n = new Set(prev); n.delete(`${eventId}-${type}`); return n; });
        return;
      }

      if (isActive) {
        // Remove interaction
        const { error } = await supabase
          .from("user_event_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .eq("interaction_type", type);

        if (!error) {
          if (type === "star") {
            setStarredList((prev) => prev.filter((e) => e.id !== eventId));
          } else {
            setAttendingList((prev) => prev.filter((e) => e.id !== eventId));
          }
        }
      } else {
        // Add interaction — for single-day attending, save attended_date
        const event = [...attendingList, ...starredList].find((e) => e.id === eventId);
        const insertData: Record<string, string> = { user_id: user.id, event_id: eventId, interaction_type: type };
        if (type === "attending" && event?.start_date) {
          insertData.attended_date = event.start_date;
        }
        const { error } = await supabase
          .from("user_event_interactions")
          .insert(insertData);

        if (!error) {
          if (event) {
            if (type === "star") {
              setStarredList((prev) => [...prev, event]);
            } else {
              setAttendingList((prev) => [...prev, event]);
            }
          }
        }
      }

      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(`${eventId}-${type}`);
        return next;
      });

      // Refresh server data to stay in sync
      router.refresh();
    },
    [supabase, router, user, attendingIds, starredIds, attendingList, starredList]
  );

  // Handle date selection from the multi-day picker modal
  async function handleDatePickerSelect(date: string) {
    if (!user || !datePickerEvent) return;

    const eventId = datePickerEvent.id;
    setDatePickerEvent(null);
    setRemoving((prev) => new Set(prev).add(`${eventId}-attending`));

    const { error } = await supabase
      .from("user_event_interactions")
      .insert({ user_id: user.id, event_id: eventId, interaction_type: "attending", attended_date: date });

    if (!error) {
      const event = [...attendingList, ...starredList].find((e) => e.id === eventId);
      if (event) setAttendingList((prev) => [...prev, event]);
    }

    setRemoving((prev) => { const n = new Set(prev); n.delete(`${eventId}-attending`); return n; });
    router.refresh();
  }

  return (
    <>
      {/* View toggle */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">{totalEvents} events saved</p>
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
        <MyEventsList
          attending={attendingList}
          starred={starredList}
          attendingIds={attendingIds}
          starredIds={starredIds}
          removing={removing}
          onToggle={toggleInteraction}
        />
      ) : (
        <MyEventsCalendar
          attending={attendingList}
          starred={starredList}
          attendingIds={attendingIds}
          starredIds={starredIds}
          removing={removing}
          onToggle={toggleInteraction}
          attendedDates={attendedDates}
        />
      )}

      {/* Date picker modal for multi-day events */}
      {datePickerEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDatePickerEvent(null)}>
          <div className="w-72 rounded-xl border border-gray-200 bg-white py-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Which day are you going?</span>
              <button
                onClick={() => setDatePickerEvent(null)}
                className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pt-2 pb-1">
              <p className="text-xs text-gray-500 truncate">{datePickerEvent.name}</p>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {getDateRange(datePickerEvent.start_date, datePickerEvent.end_date!).map((date) => (
                <button
                  key={date}
                  onClick={() => handleDatePickerSelect(date)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <CalendarPlus className="h-4 w-4 text-gray-400" />
                  {formatShortDate(date)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// -----------------------------------------------
// List View
// -----------------------------------------------

type ListProps = {
  attending: Event[];
  starred: Event[];
  attendingIds: Set<string>;
  starredIds: Set<string>;
  removing: Set<string>;
  onToggle: (eventId: string, type: "star" | "attending") => void;
};

function MyEventsList({ attending, starred, attendingIds, starredIds, removing, onToggle }: ListProps) {
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
              <MiniEventRow
                key={event.id}
                event={event}
                isStarred={starredIds.has(event.id)}
                isAttending={attendingIds.has(event.id)}
                removing={removing}
                onToggle={onToggle}
              />
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
              <MiniEventRow
                key={event.id}
                event={event}
                isStarred={starredIds.has(event.id)}
                isAttending={attendingIds.has(event.id)}
                removing={removing}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// -----------------------------------------------
// Mini Event Row (with toggle buttons)
// -----------------------------------------------

function MiniEventRow({
  event,
  isStarred,
  isAttending,
  removing,
  onToggle,
}: {
  event: Event;
  isStarred: boolean;
  isAttending: boolean;
  removing: Set<string>;
  onToggle: (eventId: string, type: "star" | "attending") => void;
}) {
  const starRemoving = removing.has(`${event.id}-star`);
  const attendRemoving = removing.has(`${event.id}-attending`);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const result = await shareEvent(event);
    if (result === "copied") {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    }
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 sm:gap-4 ${
        isAttending ? "border-blue-200 bg-blue-50/50" : "border-gray-200 bg-white"
      }`}
    >
      {/* Date */}
      <div className="hidden w-24 flex-shrink-0 text-center sm:block">
        <div className="text-sm font-bold text-[var(--primary)] whitespace-nowrap">
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

      {/* Action buttons */}
      <div className="flex flex-shrink-0 gap-1.5">
        <button
          onClick={() => onToggle(event.id, "star")}
          disabled={starRemoving}
          title={isStarred ? "Remove star" : "Star this event"}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 ${
            isStarred
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          } ${starRemoving ? "opacity-50" : ""}`}
        >
          <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-500" : ""}`} />
          <span className="hidden sm:inline">{isStarred ? "Starred" : "Star"}</span>
        </button>
        <button
          onClick={() => onToggle(event.id, "attending")}
          disabled={attendRemoving}
          title={isAttending ? "Remove attendance" : "Mark as going"}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 ${
            isAttending
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          } ${attendRemoving ? "opacity-50" : ""}`}
        >
          <Hand className={`h-3.5 w-3.5 ${isAttending ? "fill-blue-500" : ""}`} />
          <span className="hidden sm:inline">{isAttending ? "Going" : "Go"}</span>
        </button>
        <button
          onClick={handleShare}
          title="Share this event"
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 ${
            shareState === "copied"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          }`}
        >
          {shareState === "copied" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 hidden sm:block" />
              <Smartphone className="h-3.5 w-3.5 sm:hidden" />
            </>
          )}
          <span className="hidden sm:inline">{shareState === "copied" ? "Copied!" : "Share"}</span>
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------
// Calendar View (with fixed multi-day events)
// -----------------------------------------------

type CalendarProps = ListProps & {
  attendedDates: Record<string, string>;
};

function MyEventsCalendar({ attending, starred, attendingIds, starredIds, removing, onToggle, attendedDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Combine and deduplicate events
  const allEvents = useMemo(() => {
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

  // Group events by date — attending events use attended_date, starred use full range
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};

    for (const e of allEvents) {
      const isAttending = attendingIds.has(e.id);

      // If user is attending and has a specific attended_date, show only on that date
      if (isAttending && attendedDates[e.id]) {
        const key = attendedDates[e.id];
        // Check if this date falls within the current month view
        const d = new Date(key + "T00:00:00");
        if (d.getFullYear() === year && d.getMonth() === month) {
          if (!map[key]) map[key] = [];
          map[key].push(e);
        }
        continue;
      }

      // For starred events (or attending without a date), use the event's date range
      const start = new Date(e.start_date + "T00:00:00");
      const end = e.end_date ? new Date(e.end_date + "T00:00:00") : start;
      const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);

      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const rangeStart = new Date(Math.max(start.getTime(), monthStart.getTime()));
      const rangeEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()));

      const cursor = new Date(rangeStart);
      while (cursor <= rangeEnd) {
        const dayOfWeek = cursor.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (diffDays <= 7 || isWeekend) {
          const key = cursor.toISOString().split("T")[0];
          if (!map[key]) map[key] = [];
          map[key].push(e);
        }

        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // Sort: attending first, then starred
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const aAtt = attendingIds.has(a.id) ? 0 : 1;
        const bAtt = attendingIds.has(b.id) ? 0 : 1;
        if (aAtt !== bAtt) return aAtt - bAtt;
        return a.name.localeCompare(b.name);
      });
    }

    return map;
  }, [allEvents, year, month, attendingIds, attendedDates]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Clear selection when switching months
  function changeMonth(delta: number) {
    setSelectedEvent(null);
    setCurrentMonth(new Date(year, month + delta, 1));
  }

  return (
    <div className="mt-6">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        <button
          onClick={() => changeMonth(1)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
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
            return (
              <div key={`blank-${i}`} className="min-h-[90px] border-b border-r border-gray-200 bg-gray-50 sm:min-h-[110px]" />
            );
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
              <div className={`mb-0.5 text-xs font-medium ${isToday ? "text-[var(--primary)]" : "text-gray-500"}`}>
                {isToday ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                    {day}
                  </span>
                ) : (
                  day
                )}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const isAtt = attendingIds.has(e.id);
                  const isSelected = selectedEvent?.id === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(isSelected ? null : e)}
                      className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight sm:text-xs ${
                        isSelected
                          ? "ring-2 ring-[var(--primary)] ring-offset-1"
                          : ""
                      } ${
                        isAtt
                          ? "bg-blue-100 font-medium text-blue-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                      title={`${isAtt ? "Going: " : "Starred: "}${e.name}${e.venue ? ` — ${e.venue.name}` : ""}`}
                    >
                      {isAtt ? (
                        <Hand className="mr-0.5 inline h-2.5 w-2.5" />
                      ) : (
                        <Star className="mr-0.5 inline h-2.5 w-2.5" />
                      )}
                      {e.name}
                    </button>
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

      {/* Selected event detail panel */}
      {selectedEvent && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900">{selectedEvent.name}</h4>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {selectedEvent.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedEvent.venue.name}
                  </span>
                )}
                <span>{formatDateRange(selectedEvent.start_date, selectedEvent.end_date)}</span>
                {selectedEvent.start_time && <span>· {selectedEvent.start_time}</span>}
              </div>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <CalendarShareRow
            selectedEvent={selectedEvent}
            starredIds={starredIds}
            attendingIds={attendingIds}
            removing={removing}
            onToggle={onToggle}
          />
        </div>
      )}

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
        <div className="flex items-center gap-1 text-gray-400">
          Tap an event to edit
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------
// Calendar Detail Panel Buttons (with share)
// -----------------------------------------------

function CalendarShareRow({
  selectedEvent,
  starredIds,
  attendingIds,
  removing,
  onToggle,
}: {
  selectedEvent: Event;
  starredIds: Set<string>;
  attendingIds: Set<string>;
  removing: Set<string>;
  onToggle: (eventId: string, type: "star" | "attending") => void;
}) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const result = await shareEvent(selectedEvent);
    if (result === "copied") {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        onClick={() => onToggle(selectedEvent.id, "star")}
        disabled={removing.has(`${selectedEvent.id}-star`)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          starredIds.has(selectedEvent.id)
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${starredIds.has(selectedEvent.id) ? "fill-amber-500" : ""}`} />
        {starredIds.has(selectedEvent.id) ? "Starred" : "Star"}
      </button>
      <button
        onClick={() => onToggle(selectedEvent.id, "attending")}
        disabled={removing.has(`${selectedEvent.id}-attending`)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          attendingIds.has(selectedEvent.id)
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        <Hand className={`h-3.5 w-3.5 ${attendingIds.has(selectedEvent.id) ? "fill-blue-500" : ""}`} />
        {attendingIds.has(selectedEvent.id) ? "Going" : "I'm Going"}
      </button>
      <button
        onClick={handleShare}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          shareState === "copied"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {shareState === "copied" ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5 hidden sm:block" />
            <Smartphone className="h-3.5 w-3.5 sm:hidden" />
          </>
        )}
        {shareState === "copied" ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
