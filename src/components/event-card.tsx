import type { Event } from "@/lib/types";
import { Calendar, MapPin, DollarSign, Users } from "lucide-react";
import InteractionButtons from "./interaction-buttons";
import EventActions from "./event-actions";

type Props = {
  event: Event;
  starCount: number;
  attendingCount: number;
  onHide?: (eventId: string) => void;
};

export default function EventCard({ event, starCount, attendingCount, onHide }: Props) {
  const dateStr = new Date(event.start_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md">
      {/* Top row: category badges + action buttons */}
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="flex flex-wrap gap-1">
          {event.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
            >
              {cat}
            </span>
          ))}
          {event.is_free && (
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Free
            </span>
          )}
        </div>
        <EventActions event={event} onHide={onHide} />
      </div>

      {/* Event details */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>

        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
            {event.description}
          </p>
        )}

        <div className="mt-auto space-y-2 pt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              {dateStr}
              {event.start_time && ` \u2022 ${event.start_time}`}
            </span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                {event.venue.name}, {event.venue.city}
              </span>
            </div>
          )}

          {event.cost && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>{event.cost}</span>
              {event.pricing_notes && (
                <span className="text-xs text-gray-400">{event.pricing_notes}</span>
              )}
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
              <span>
                Ages {event.age_range_min}–{event.age_range_max}
              </span>
            </div>
          )}
        </div>

        {event.source_url && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View on venue site →
          </a>
        )}
      </div>

      <InteractionButtons
        eventId={event.id}
        initialStarCount={starCount}
        initialAttendingCount={attendingCount}
      />
    </div>
  );
}
