"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CalendarPlus } from "lucide-react";
import { formatDateRange, getExpandedDates } from "@/lib/event-utils";
import { buildGoogleCalendarUrlForDate } from "@/lib/google-calendar";
import type { Event } from "@/lib/types";

type Props = {
  event: Event;
};

export default function ExpandableDateRange({ event }: Props) {
  const [expanded, setExpanded] = useState(false);

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
