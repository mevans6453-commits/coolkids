import { supabase } from "@/lib/supabase";
import type { Venue } from "@/lib/types";
import { MapPin, Globe, Phone } from "lucide-react";
import { getCategoryBadgeClasses } from "@/lib/category-colors";

// Venues page — shows all tracked venues in the database
export const revalidate = 3600; // Refresh data every hour

export default async function VenuesPage() {
  // Fetch all active venues from Supabase
  const { data: venues, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Venues</h1>
      <p className="mt-2 text-gray-600">
        Family-friendly venues we track across Cherokee County & North Georgia
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

      {/* Venue count */}
      {venues && venues.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          Discover {venues.length} family-friendly venues across the area
        </p>
      )}

      {/* Venue cards grid */}
      {venues && venues.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue: Venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual venue card component
function VenueCard({ venue }: { venue: Venue }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md">
      {/* Category badges */}
      <div className="flex flex-wrap gap-1">
        {venue.categories?.map((cat) => (
          <span
            key={cat}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryBadgeClasses(cat)}`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Venue name & description */}
      <h3 className="mt-3 text-lg font-semibold text-gray-900">{venue.name}</h3>
      {venue.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
          {venue.description}
        </p>
      )}

      {/* Location & contact info */}
      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>
            {venue.city}, {venue.state} {venue.zip}
          </span>
        </div>

        {venue.website && (
          <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              Visit Website →
            </a>
        )}

        {venue.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{venue.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
