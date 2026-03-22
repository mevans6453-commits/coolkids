import type { Event } from "@/lib/types";
import { MapPin, ExternalLink } from "lucide-react";
import { formatDateRange } from "@/lib/event-utils";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { getCategoryBadgeClasses } from "@/lib/category-colors";
import ExpandableDateRange from "./expandable-date-range";
import InteractionButtons from "./interaction-buttons";
import EventActions from "./event-actions";

type Props = {
  event: Event;
  starCount: number;
  attendingCount: number;
  onHide?: (eventId: string) => void;
  view?: "grid" | "list";
};

/** Detect if an event should show a Featured or Seasonal badge */
function getScaleBadge(event: Event): { label: string; classes: string } | null {
  const name = (event.name || "").toLowerCase();
  const desc = (event.description || "").toLowerCase();
  const combined = `${name} ${desc}`;

  // Check Featured keywords FIRST (takes priority over Seasonal)
  const featuredKeywords = ["festival", "fair", "gala", "celebration", "palooza", "expo", "grand opening", "fireworks", "concert series"];
  if (featuredKeywords.some((kw) => combined.includes(kw))) {
    return { label: "Featured", classes: "bg-indigo-50 text-indigo-600 border border-indigo-100" };
  }

  // Check for multi-week/month span (seasonal indicator)
  if (event.start_date && event.end_date) {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 21) {
      return { label: "Seasonal", classes: "bg-amber-50 text-amber-600 border border-amber-100" };
    }
  }

  return null;
}

export default function EventCard({ event, starCount, attendingCount, onHide, view = "grid" }: Props) {
  const scaleBadge = getScaleBadge(event);
  const moreInfoUrl = event.source_url || event.venue?.website;

  if (view === "list") {
    const rawDesc = event.description ? decodeHtmlEntities(event.description) : null;
    const desc = rawDesc
      ? rawDesc.length > 100 ? rawDesc.slice(0, 100) + "..." : rawDesc
      : null;

    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm sm:px-5 sm:py-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Date column — desktop only */}
          <div className="hidden w-36 flex-shrink-0 pt-0.5 text-center sm:block">
            <ExpandableDateRange event={event} />
            {event.start_time && (
              <div className="text-xs text-gray-500">{event.start_time}</div>
            )}
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Name + badges */}
            <div className="flex flex-wrap items-baseline gap-1.5">
              <h3 className="text-base font-semibold text-gray-900">{decodeHtmlEntities(event.name)}</h3>
              {scaleBadge && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${scaleBadge.classes}`}>
                  {scaleBadge.label}
                </span>
              )}
              <div className="flex flex-wrap gap-1">
                {event.categories?.slice(0, 3).map((cat) => (
                  <span key={cat} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryBadgeClasses(cat)}`}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Date + venue */}
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

            {/* Price + More Info row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              {event.is_free ? (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 font-semibold text-green-600 border border-green-100">FREE</span>
              ) : event.cost ? (
                <span className="font-medium text-gray-700">{event.cost}</span>
              ) : null}
              {event.pricing_notes && (
                <span className="text-gray-500">{event.pricing_notes}</span>
              )}
              {moreInfoUrl && (
                <a
                  href={moreInfoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)]/5 px-2.5 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors border border-[var(--primary)]/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  More Info
                </a>
              )}
            </div>

            {/* Interaction buttons — mobile */}
            <div className="mt-2 flex items-center gap-2 sm:hidden">
              <InteractionButtons eventId={event.id} initialStarCount={starCount} initialAttendingCount={attendingCount} />
              <EventActions event={event} onHide={onHide} />
            </div>
          </div>

          {/* Actions column — desktop only */}
          <div className="hidden flex-shrink-0 items-center gap-1 sm:flex">
            <InteractionButtons eventId={event.id} initialStarCount={starCount} initialAttendingCount={attendingCount} />
            <EventActions event={event} onHide={onHide} />
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="flex flex-wrap gap-1">
          {scaleBadge && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scaleBadge.classes}`}>
              {scaleBadge.label}
            </span>
          )}
          {event.categories?.slice(0, 3).map((cat) => (
            <span key={cat} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryBadgeClasses(cat)}`}>
              {cat}
            </span>
          ))}
          {event.is_free && (
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 border border-green-100">Free</span>
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
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">{event.cost}</span>
              {event.pricing_notes && <span className="text-xs text-gray-400">{event.pricing_notes}</span>}
            </div>
          )}
        </div>

        {moreInfoUrl && (
          <a href={moreInfoUrl} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)]/5 px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors border border-[var(--primary)]/10"
            onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="h-3.5 w-3.5" />
            More Info
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
        <InteractionButtons eventId={event.id} initialStarCount={starCount} initialAttendingCount={attendingCount} />
        <div className="ml-auto">
          <EventActions event={event} onHide={onHide} />
        </div>
      </div>
    </div>
  );
}
