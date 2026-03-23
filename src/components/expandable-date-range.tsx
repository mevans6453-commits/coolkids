"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CalendarPlus, Repeat } from "lucide-react";
import { formatDateRange, getExpandedDates } from "@/lib/event-utils";
import { buildGoogleCalendarUrlForDate } from "@/lib/google-calendar";
import type { Event } from "@/lib/types";

type Props = {
  event: Event;
};

export default function ExpandableDateRange({ event }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Recurring event with specific dates (e.g. Morning Hikes on Apr 4, Apr 26, May 16)
  if (event.recurring_dates && event.recurring_dates.length > 1) {
    const count = event.recurring_dates.length;
    const firstDate = new Date(event.recurring_dates[0].date + "T00:00:00");
    const firstLabel = firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm font-bold text-[var(--primary)] hover:opacity-80"
        >
          <Repeat className="h-3 w-3 flex-shrink-0" />
          <span>{firstLabel} + {count - 1} more date{count - 1 > 1 ? "s" : ""}</span>
          {expanded ? (
            <ChevronUp className="h-3 w-3 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          )}
        </button>

        {expanded && (
          <div className="mt-1.5 space-y-0.5">
            {event.recurring_dates.map((rd) => {
              const d = new Date(rd.date + "T00:00:00");
              const label = d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <div key={rd.date} className="flex items-center gap-1.5">
                  <span className="text-xs font-normal text-gray-600">
                    {label}
                    {rd.time && <span className="text-gray-400"> {rd.time}</span>}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(buildGoogleCalendarUrlForDate(event, rd.date), "_blank");
                    }}
                    title={`Add ${label} to Google Calendar`}
                    className="rounded p-0.5 text-gray-400 hover:bg-blue-50 hover:text-[var(--primary)] transition-colors"
                  >
                    <CalendarPlus className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const isMultiDay = event.end_date && event.end_date !== event.start_date;

  // Single-day event: plain text, no expand
  if (!isMultiDay) {
    return (
      <span className="text-sm font-bold text-[var(--primary)]">
        {formatDateRange(event.start_date, event.end_date)}
      </span>
    );
  }

  const rangeLabel = formatDateRange(event.start_date, event.end_date);
  const dates = expanded ? getExpandedDates(event.start_date, event.end_date!) : [];

  // Check if showing weekends only
  const start = new Date(event.start_date + "T00:00:00");
  const end = new Date(event.end_date! + "T00:00:00");
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  const showingWeekends = diffDays > 7;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-sm font-bold text-[var(--primary)] hover:opacity-80"
      >
        <span>{rangeLabel}</span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-0.5">
          {showingWeekends && (
            <div className="text-[10px] font-normal text-gray-400">Weekends</div>
          )}
          {dates.map((d) => (
            <div key={d.date} className="flex items-center gap-1.5">
              <span className="text-xs font-normal text-gray-600">{d.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(buildGoogleCalendarUrlForDate(event, d.date), "_blank");
                }}
                title={`Add ${d.label} to Google Calendar`}
                className="rounded p-0.5 text-gray-400 hover:bg-blue-50 hover:text-[var(--primary)] transition-colors"
              >
                <CalendarPlus className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
