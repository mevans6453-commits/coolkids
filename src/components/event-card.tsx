import type { Event } from "@/lib/types";
import { Calendar, MapPin, DollarSign, Users } from "lucide-react";
import { formatDateRange } from "@/lib/event-utils";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { getCategoryBadgeClasses } from "@/lib/category-colors";
import ExpandableDateRange from "./expandable-date-range";
import InteractionButtons from "./interaction-buttons";
import EventActions from "./event-actions";
import ShareButton from "./share-button";

type Props = {
  event: Event;
  starCount: number;
  attendingCount: number;
  onHide?: (eventId: string) => void;
  view?: "grid" | "list";
};

export default function EventCard({ event, starCount, attendingCount, onHide, view = "grid" }: Props) {
  const dateStr = new Date(event.start_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );

  if (view === "list") {
    const rawDesc = event.description ? decodeHtmlEntities(event.description) : null;
    const desc = rawDesc
      ? rawDesc.length > 100 ? rawDesc.slice(0, 100) + "..." : rawDesc
      : null;

    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm sm:px-5 sm:py-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Date column — desktop only (w-36 fits "Mar 30 – Apr 14") */}
          <div className="hidden w-36 flex-shrink-0 pt-0.5 text-center sm:block">
            <ExpandableDateRange event={event} />
            {event.start_time && (
              <div className="text-xs text-gray-500">{event.start_time}</div>
            )}
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Name + category tags */}
            <div className="flex flex-wrap items-baseline gap-1.5">
              <h3 className="text-base font-semibold text-gray-900">{decodeHtmlEntities(event.name)}</h3>
              <div className="flex flex-wrap gap-1">
                {event.categories?.slice(0, 3).map((cat) => (
                  <span key={cat} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryBadgeClasses(cat)}`}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Date + venue (mobile shows date inline, desktop hides it) */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500 sm:text-xs">
              <span className="sm:hidden font-medium text-[var(--primary)]">
                {formatDateRange(event.start_date, event.end_date)}{event.start_time && ` · ${event.start_time}`}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {event.venue.name}, {event.venue.city}
                </span>
              )}
            </div>

            {/* Description */}
            {desc && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{desc}</p>
            )}

            {/* Price */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              {event.is_free ? (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-semibold text-green-700">FREE</span>
              ) : event.cost ? (
                <span className="font-medium text-gray-700">{event.cost}</span>
              ) : null}
              {event.pricing_notes && (
                <span className="text-gray-500">{event.pricing_notes}</span>
              )}
            </div>

            {/* Interaction buttons — mobile: below content, full width */}
            <div className="mt-2 flex items-center gap-2 sm:hidden">
              <InteractionButtons eventId={event.id} initialStarCount={starCount} initialAttendingCount={attendingCount} />
              <ShareButton event={event} />
              <EventActions event={event} onHide={onHide} />
            </div>
          </div>

          {/* Actions column — desktop only */}
          <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
            <InteractionButtons eventId={event.id} initialStarCount={starCount} initialAttendingCount={attendingCount} />
            <ShareButton event={event} />
            <EventActions event={event} onHide={onHide} />
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="flex flex-wrap gap-1">
          {event.categories?.slice(0, 3).map((cat) => (
            <span key={cat} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryBadgeClasses(cat)}`}>
              {cat}
            </span>
          ))}
          {event.is_free && (
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Free</span>
          )}
        </div>
        <EventActions event={event} onHide={onHide} />
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <h3 className="text-lg font-semibold text-gray-900">{decodeHtmlEntities(event.name)}</h3>

        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{decodeHtmlEntities(event.description)}</p>
        )}

        <div className="mt-auto space-y-2 pt-4 text-sm text-gray-500">
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <ExpandableDateRange event={event} />
              {event.start_time && <span className="text-sm text-gray-500"> {event.start_time}</span>}
            </div>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{event.venue.name}, {event.venue.city}</span>
            </div>
          )}

          {event.cost && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>{event.cost}</span>
              {event.pricing_notes && <span className="text-xs text-gray-400">{event.pricing_notes}</span>}
            </div>
          )}

          {!event.cost && event.pricing_notes && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs text-gray-400">{event.pricing_notes}</span>
            </div>
          )}

          {event.age_range_min !== null && event.age_range_max !== null && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>Ages {event.age_range_min}–{event.age_range_max}</span>
            </div>
          )}
        </div>

        {event.source_url && (
          <a href={event.source_url} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800">
            View on venue site →
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 px-5 pb-4">
        <InteractionButtons eventId={event.id} initialStarCount={starCount} initialAttendingCount={attendingCount} />
        <ShareButton event={event} />
      </div>
    </div>
  );
}
