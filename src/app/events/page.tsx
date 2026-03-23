import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import { Calendar } from "lucide-react";
import EventsClient from "@/components/events-client";

// Events page — shows upcoming family events from the database
export const revalidate = 3600; // Refresh data every hour

export default async function EventsPage() {
  // Fetch all upcoming events with venue info
  const today = new Date().toISOString().split("T")[0];
  const { data: events, error } = await supabase
    .from("events")
    .select("*, venue:venues!inner(*)")
    .eq("status", "published")
    .eq("venue.is_active", true)
    .not("event_type", "eq", "not_for_kids")
    .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
    .order("start_date", { ascending: true });

  // Fetch interaction counts (stars + attending only)
  const eventIds = events?.map((e: Event) => e.id) ?? [];
  const { data: interactions } = eventIds.length > 0
    ? await supabase
        .from("user_event_interactions")
        .select("event_id, interaction_type")
        .in("event_id", eventIds)
        .in("interaction_type", ["star", "attending"])
    : { data: [] };

  // Aggregate counts per event
  const counts: Record<string, { stars: number; attending: number }> = {};
  for (const i of interactions ?? []) {
    if (!counts[i.event_id]) counts[i.event_id] = { stars: 0, attending: 0 };
    if (i.interaction_type === "star") counts[i.event_id].stars++;
    if (i.interaction_type === "attending") counts[i.event_id].attending++;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
      <p className="mt-2 text-gray-600">
        Family-friendly events in Cherokee County & North Georgia
      </p>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Could not load events</p>
          <p className="mt-1 text-sm">
            The database may not be set up yet. Check the README for setup instructions.
          </p>
        </div>
      )}

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

      {events && events.length > 0 && (
        <Suspense fallback={<div className="mt-6 text-gray-500">Loading events...</div>}>
          <EventsClient events={events} interactionCounts={counts} />
        </Suspense>
      )}
    </div>
  );
}
