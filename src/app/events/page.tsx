import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import { Calendar, MapPin, DollarSign, Users } from "lucide-react";

// Events page — shows upcoming family events from the database
export const revalidate = 3600; // Refresh data every hour

export default async function EventsPage() {
  // Fetch upcoming events with their venue info from Supabase
  const { data: events, error } = await supabase
    .from("events")
    .select("*, venue:venues(*)")
    .eq("status", "published")
    .gte("start_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(50);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
      <p className="mt-2 text-gray-600">
        Family-friendly events in Cherokee County & North Georgia
      </p>

      {/* Show error message if database query failed */}
      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Could not load events</p>
          <p className="mt-1 text-sm">
            The database may not be set up yet. Check the README for setup instructions.
          </p>
        </div>
      )}

      {/* Show message if no events found */}
      {!error && (!events || events.length === 0) && (
        <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No events yet</h3>
          <p className="mt-2 text-gray-500">
            Events will appear here once we start scraping venue websites.
            Check back soon!
          </p>
        </div>
      )}

      {/* Event cards grid */}
      {events && events.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event: Event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual event card component
function EventCard({ event }: { event: Event }) {
  // Format the date nicely (e.g., "Sat, Apr 12")
  const dateStr = new Date(event.start_date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md">
      {/* Category badges */}
      <div className="flex flex-wrap gap-1 px-5 pt-5">
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

      {/* Event details */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>

        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
            {event.description}
          </p>
        )}

        <div className="mt-auto space-y-2 pt-4 text-sm text-gray-500">
          {/* Date & time */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              {dateStr}
              {event.start_time && ` • ${event.start_time}`}
            </span>
          </div>

          {/* Venue & location */}
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                {event.venue.name}, {event.venue.city}
              </span>
            </div>
          )}

          {/* Cost */}
          {event.cost && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>{event.cost}</span>
            </div>
          )}

          {/* Age range */}
          {event.age_range_min !== null && event.age_range_max !== null && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>
                Ages {event.age_range_min}–{event.age_range_max}
              </span>
            </div>
          )}
        </div>

        {/* Link to original source */}
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
    </div>
  );
}
