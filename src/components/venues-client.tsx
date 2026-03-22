"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Venue } from "@/lib/types";
import { Globe, Eye, EyeOff, LogIn } from "lucide-react";
import { getCategoryBadgeClasses } from "@/lib/category-colors";

type VenueFilter = "all" | "my";

type Props = {
  venues: Venue[];
  eventCounts: Record<string, number>;
};

export default function VenuesClient({ venues, eventCounts }: Props) {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [hiddenVenueIds, setHiddenVenueIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<VenueFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Load auth + hidden venues on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { id: u.id } : null);
      setAuthLoaded(true);
      if (u) {
        supabase
          .from("user_venue_preferences")
          .select("venue_id")
          .eq("user_id", u.id)
          .eq("is_hidden", true)
          .then(({ data }) => {
            if (data) setHiddenVenueIds(new Set(data.map((d) => d.venue_id)));
          });
      }
    });
  }, [supabase]);

  // Toggle hide/show venue
  async function toggleHide(venueId: string) {
    if (!user) return;
    setTogglingId(venueId);

    const isCurrentlyHidden = hiddenVenueIds.has(venueId);

    if (isCurrentlyHidden) {
      // Unhide: delete the preference row
      await supabase
        .from("user_venue_preferences")
        .delete()
        .eq("user_id", user.id)
        .eq("venue_id", venueId);

      setHiddenVenueIds((prev) => {
        const next = new Set(prev);
        next.delete(venueId);
        return next;
      });
    } else {
      // Hide: upsert the preference row
      await supabase.from("user_venue_preferences").upsert(
        {
          user_id: user.id,
          venue_id: venueId,
          is_hidden: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,venue_id" }
      );

      setHiddenVenueIds((prev) => new Set(prev).add(venueId));
    }

    setTogglingId(null);
  }

  // Filtered venues
  const displayedVenues = useMemo(() => {
    if (filter === "my" && user) {
      return venues.filter((v) => !hiddenVenueIds.has(v.id));
    }
    return venues;
  }, [venues, filter, hiddenVenueIds, user]);

  const hiddenCount = hiddenVenueIds.size;
  const visibleCount = venues.length - hiddenCount;

  return (
    <div className="mt-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {user && (
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-[var(--primary)] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All Venues
              </button>
              <button
                onClick={() => setFilter("my")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === "my"
                    ? "bg-[var(--primary)] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Venues
              </button>
            </div>
          )}
        </div>

        <span className="text-sm text-gray-500">
          {filter === "my" && user
            ? `${visibleCount} of ${venues.length} venues`
            : `${venues.length} venues`}
          {hiddenCount > 0 && filter === "all" && (
            <span className="text-gray-400 ml-1">
              ({hiddenCount} hidden)
            </span>
          )}
        </span>
      </div>

      {/* Sign in prompt for logged-out users */}
      {authLoaded && !user && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          <LogIn className="h-4 w-4 flex-shrink-0" />
          <span>
            <a href="/subscribe" className="font-medium underline hover:no-underline">
              Sign in
            </a>{" "}
            to customize your venue list — hide venues you don&apos;t visit so their events don&apos;t clutter your feed.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_100px_auto_80px_90px] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <span>Venue</span>
          <span>City</span>
          <span>Categories</span>
          <span className="text-center">Events</span>
          <span className="text-center">Actions</span>
        </div>

        {/* Rows */}
        {displayedVenues.map((venue) => {
          const isHidden = hiddenVenueIds.has(venue.id);
          const count = eventCounts[venue.id] || 0;
          const isToggling = togglingId === venue.id;

          return (
            <div
              key={venue.id}
              className={`border-b border-gray-100 last:border-b-0 transition-opacity ${
                isHidden ? "opacity-50" : ""
              }`}
            >
              {/* Desktop row */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_100px_auto_80px_90px] gap-3 px-4 py-3 items-center">
                {/* Name + website */}
                <div className="min-w-0">
                  <span
                    className={`font-medium text-gray-900 text-sm ${
                      isHidden ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {venue.name}
                  </span>
                </div>

                {/* City */}
                <span className="text-sm text-gray-500 truncate">
                  {venue.city}
                </span>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {venue.categories?.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryBadgeClasses(cat)}`}
                    >
                      {cat}
                    </span>
                  ))}
                  {(venue.categories?.length || 0) > 3 && (
                    <span className="text-xs text-gray-400">
                      +{(venue.categories?.length || 0) - 3}
                    </span>
                  )}
                </div>

                {/* Event count */}
                <div className="text-center">
                  {count > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">
                      {count}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-1.5">
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Visit website"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}

                  {user && (
                    <button
                      onClick={() => toggleHide(venue.id)}
                      disabled={isToggling}
                      className={`rounded-md p-1.5 transition-colors ${
                        isHidden
                          ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                      title={isHidden ? "Show venue" : "Hide venue"}
                    >
                      {isHidden ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile row */}
              <div className="sm:hidden px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium text-sm ${
                          isHidden
                            ? "line-through text-gray-400"
                            : "text-gray-900"
                        }`}
                      >
                        {venue.name}
                      </span>
                      {count > 0 && (
                        <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{venue.city}, {venue.state}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {venue.categories?.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryBadgeClasses(cat)}`}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {venue.website && (
                      <a
                        href={venue.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                    {user && (
                      <button
                        onClick={() => toggleHide(venue.id)}
                        disabled={isToggling}
                        className={`rounded-md p-1.5 transition-colors ${
                          isHidden
                            ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                        title={isHidden ? "Show venue" : "Hide venue"}
                      >
                        {isHidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {displayedVenues.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No venues to show.{" "}
            {filter === "my" && (
              <button
                onClick={() => setFilter("all")}
                className="text-[var(--primary)] underline hover:no-underline"
              >
                Show all venues
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
