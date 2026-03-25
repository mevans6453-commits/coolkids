import { supabase } from "@/lib/supabase";
import type { Venue } from "@/lib/types";
import { MapPin } from "lucide-react";
import VenuesClient from "@/components/venues-client";

// Venues page — shows all tracked venues in a card layout
export const revalidate = 300; // Refresh data every 5 minutes

export default async function VenuesPage() {
  // Fetch all active venues from Supabase
  const { data: venues, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Fetch upcoming events with full details for venue expansion
  const today = new Date().toISOString().split("T")[0];
  const { data: events } = await supabase
    .from("events")
    .select("id, name, venue_id, start_date, end_date, time_text, cost, event_type, description")
    .gte("start_date", today)
    .eq("status", "published")
    .order("start_date", { ascending: true });

  // Group events by venue
  const eventsByVenue: Record<string, typeof events> = {};
  const venueEventCounts: Record<string, number> = {};
  events?.forEach((e) => {
    if (e.venue_id) {
      if (!eventsByVenue[e.venue_id]) eventsByVenue[e.venue_id] = [];
      eventsByVenue[e.venue_id]!.push(e);
      venueEventCounts[e.venue_id] = (venueEventCounts[e.venue_id] || 0) + 1;
    }
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Venues</h1>
      <p className="mt-2 text-gray-600">
        Family-friendly venues we track across Cherokee County &amp; North Georgia
      </p>

      {/* Show error message if database query failed */}
      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          <p className="font-medium">Could not load venues</p>
          <p className="mt-1 text-sm">
            The database may not be set up yet. Check the README for setup instructions.
          </p>
        </div>
      )}

      {/* Show message if no venues found */}
      {!error && (!venues || venues.length === 0) && (
        <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No venues yet</h3>
          <p className="mt-2 text-gray-500">
            Venues will appear here once the database is seeded.
          </p>
        </div>
      )}

      {venues && venues.length > 0 && (
        <VenuesClient
          venues={venues as Venue[]}
          eventCounts={venueEventCounts}
          eventsByVenue={eventsByVenue as Record<string, Array<{ id: string; name: string; venue_id: string; start_date: string; end_date: string | null; time_text: string | null; cost: string | null; event_type: string | null; description: string | null }>>}
        />
      )}
    </div>
  );
}
