import { supabase } from "@/lib/supabase";
import type { Venue } from "@/lib/types";
import { MapPin } from "lucide-react";
import VenuesClient from "@/components/venues-client";

// Venues page — shows all tracked venues in a compact table layout
export const revalidate = 300; // Refresh data every 5 minutes

export default async function VenuesPage() {
  // Fetch all active venues from Supabase
  const { data: venues, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Count upcoming events per venue
  const today = new Date().toISOString().split("T")[0];
  const { data: eventCounts } = await supabase
    .from("events")
    .select("venue_id")
    .gte("start_date", today);

  const venueEventCounts: Record<string, number> = {};
  eventCounts?.forEach((e) => {
    if (e.venue_id) {
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
        <VenuesClient venues={venues as Venue[]} eventCounts={venueEventCounts} />
      )}
    </div>
  );
}
