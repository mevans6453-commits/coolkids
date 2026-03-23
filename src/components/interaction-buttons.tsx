"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import { buildGoogleCalendarUrlForDate } from "@/lib/google-calendar";
import { Star, Hand, CalendarPlus, X } from "lucide-react";
import type { Event } from "@/lib/types";

type Props = {
  eventId: string;
  initialStarCount: number;
  initialAttendingCount: number;
  /** Pass the event for multi-day date picker (start_date, end_date, name, etc.) */
  event?: Event;
};

/** Generate an array of YYYY-MM-DD date strings between start and end (inclusive) */
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

/** Format "2026-04-03" → "Fri, Apr 3" */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function InteractionButtons({
  eventId,
  initialStarCount,
  initialAttendingCount,
  event,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { user, authLoaded } = useAuth();
  const [starred, setStarred] = useState(false);
  const [attending, setAttending] = useState(false);
  const [starCount, setStarCount] = useState(initialStarCount);
  const [attendingCount, setAttendingCount] = useState(initialAttendingCount);
  const [interactionsLoaded, setInteractionsLoaded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Is this a multi-day event?
  const isMultiDay = event?.end_date && event.end_date !== event.start_date;
  const dateOptions = isMultiDay ? getDateRange(event.start_date, event.end_date!) : [];

  // Load user's existing interactions for this event
  const loadInteractions = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_event_interactions")
      .select("interaction_type")
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (data) {
      setStarred(data.some((d) => d.interaction_type === "star"));
      setAttending(data.some((d) => d.interaction_type === "attending"));
    }
    setInteractionsLoaded(true);
  }, [supabase, eventId]);

  // Load interactions when user becomes available
  useEffect(() => {
    if (user && !interactionsLoaded) {
      loadInteractions(user.id);
    }
  }, [user, interactionsLoaded, loadInteractions]);

  // Close date picker on outside click
  useEffect(() => {
    if (!showDatePicker) return;
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDatePicker]);

  async function toggle(type: "star" | "attending", e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (!authLoaded) return;

    if (!user) {
      router.push("/subscribe");
      return;
    }

    // For multi-day events: show date picker when clicking "I'm Going"
    if (type === "attending" && isMultiDay && !attending) {
      setShowDatePicker(true);
      return;
    }

    const isActive = type === "star" ? starred : attending;
    const setActive = type === "star" ? setStarred : setAttending;
    const setCount = type === "star" ? setStarCount : setAttendingCount;

    // Optimistic update
    setActive(!isActive);
    setCount((c) => (isActive ? c - 1 : c + 1));

    if (isActive) {
      const { error } = await supabase
        .from("user_event_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .eq("interaction_type", type);

      if (error) {
        setActive(isActive);
        setCount((c) => (isActive ? c + 1 : c - 1));
      }
    } else {
      const { error } = await supabase
        .from("user_event_interactions")
        .insert({ user_id: user.id, event_id: eventId, interaction_type: type });

      if (error) {
        setActive(isActive);
        setCount((c) => (isActive ? c + 1 : c - 1));
      }
    }
  }

  /** Handle selecting a specific date from the multi-day picker */
  async function handleDateSelect(date: string) {
    if (!user) return;

    // Mark as attending (same as a normal toggle)
    setAttending(true);
    setAttendingCount((c) => c + 1);
    setShowDatePicker(false);

    const { error } = await supabase
      .from("user_event_interactions")
      .insert({ user_id: user.id, event_id: eventId, interaction_type: "attending" });

    if (error) {
      setAttending(false);
      setAttendingCount((c) => c - 1);
      return;
    }

    // Open Google Calendar for the specific date
    if (event) {
      window.open(buildGoogleCalendarUrlForDate(event, date), "_blank");
    }
  }

  return (
    <div className="relative flex gap-2" ref={datePickerRef}>
      <button
        onClick={(e) => toggle("star", e)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5 ${
          starred
            ? "bg-amber-100 text-amber-700"
            : "bg-amber-50 text-amber-600 hover:bg-amber-100"
        }`}
      >
        <Star className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${starred ? "fill-amber-500" : ""}`} />
        {starCount > 0 ? starCount : "Star"}
      </button>
      <button
        onClick={(e) => toggle("attending", e)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5 ${
          attending
            ? "bg-blue-100 text-blue-700"
            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
        }`}
      >
        <Hand className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${attending ? "fill-blue-500" : ""}`} />
        {attending ? (attendingCount > 0 ? `${attendingCount} Going` : "Going") : (attendingCount > 0 ? `${attendingCount} Going` : "I'm Going")}
      </button>

      {/* Multi-day date picker popup */}
      {showDatePicker && dateOptions.length > 0 && (
        <div className="absolute right-0 top-full mt-2 z-30 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-3 pb-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Which day are you going?</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto py-1">
            {dateOptions.map((date) => (
              <button
                key={date}
                onClick={(e) => { e.stopPropagation(); handleDateSelect(date); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <CalendarPlus className="h-3.5 w-3.5 text-gray-400" />
                {formatShortDate(date)}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggle("attending", e); }}
              className="w-full text-center text-xs text-gray-500 hover:text-blue-600 transition-colors py-1"
            >
              Just mark as going (no calendar)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
