"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import type { Venue } from "@/lib/types";
import { Eye, EyeOff, LogIn, Search, ExternalLink } from "lucide-react";
import { getCategoryBadgeClasses, getCategoryShortLabel } from "@/lib/category-colors";

type VenueFilter = "all" | "my";

type Props = {
  venues: Venue[];
  eventCounts: Record<string, number>;
};

export default function VenuesClient({ venues, eventCounts }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user, authLoaded } = useAuth();
  const [hiddenVenueIds, setHiddenVenueIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<VenueFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load hidden venues when user becomes available
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_venue_preferences")
      .select("venue_id")
      .eq("user_id", user.id)
      .eq("is_hidden", true)
      .then(({ data }) => {
        if (data) setHiddenVenueIds(new Set(data.map((d) => d.venue_id)));
      });
  }, [supabase, user]);

  // Toggle hide/show venue
  async function toggleHide(venueId: string) {
    if (!user) return;
    setTogglingId(venueId);

    const isCurrentlyHidden = hiddenVenueIds.has(venueId);

    if (isCurrentlyHidden) {
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

  // Filtered + searched venues
  const displayedVenues = useMemo(() => {
    let result = venues;

    // My Venues filter
    if (filter === "my" && user) {
      result = result.filter((v) => !hiddenVenueIds.has(v.id));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.categories?.some((c) => c.toLowerCase().includes(q))
      );
    }

    return result;
  }, [venues, filter, hiddenVenueIds, user, searchQuery]);

  const hiddenCount = hiddenVenueIds.size;
  const visibleCount = venues.length - hiddenCount;

  return (
    <div className="mt-6">
      {/* Top bar: toggle + search + count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
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

          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search venues..."
              className="w-full sm:w-56 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>

        <span className="text-sm text-gray-400">
          {searchQuery
            ? `${displayedVenues.length} result${displayedVenues.length !== 1 ? "s" : ""}`
            : filter === "my" && user
              ? `${visibleCount} of ${venues.length} venues`
              : `${venues.length} venues`}
          {hiddenCount > 0 && filter === "all" && !searchQuery && (
            <span className="ml-1">· {hiddenCount} hidden</span>
          )}
        </span>
      </div>

      {/* Sign in prompt for logged-out users */}
      {authLoaded && !user && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-blue-600">
          <LogIn className="h-4 w-4 flex-shrink-0" />
          <span>
            <a href="/subscribe" className="font-medium underline hover:no-underline">
              Sign in
            </a>{" "}
            to customize your venue list — hide venues you don&apos;t visit.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1.5fr_80px_100px] gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Venue</span>
          <span>City</span>
          <span>Categories</span>
          <span className="text-center">Events</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        {displayedVenues.map((venue, idx) => {
          const isHidden = hiddenVenueIds.has(venue.id);
          const count = eventCounts[venue.id] || 0;
          const isToggling = togglingId === venue.id;
          const isOdd = idx % 2 === 1;

          return (
            <div
              key={venue.id}
              className={`border-b border-gray-50 last:border-b-0 transition-opacity ${
                isHidden ? "opacity-40" : ""
              } ${isOdd ? "bg-gray-50/50" : ""}`}
            >
              {/* Desktop row */}
              <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1.5fr_80px_100px] gap-2 px-4 py-2.5 items-center">
                {/* Name */}
                <span
                  className={`font-medium text-sm truncate ${
                    isHidden ? "line-through text-gray-400" : "text-gray-900"
                  }`}
                >
                  {venue.name}
                </span>

                {/* City */}
                <span className="text-sm text-gray-500 truncate">
                  {venue.city}
                </span>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {venue.categories?.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight ${getCategoryBadgeClasses(cat)}`}
                    >
                      {getCategoryShortLabel(cat)}
                    </span>
                  ))}
                  {(venue.categories?.length || 0) > 3 && (
                    <span className="text-[11px] text-gray-400">
                      +{(venue.categories?.length || 0) - 3}
                    </span>
                  )}
                </div>

                {/* Event count */}
                <div className="text-center">
                  {count > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[24px] rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">
                      {count}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">No events</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title={`Visit ${venue.name} website`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Website</span>
                    </a>
                  )}

                  {user && (
                    <button
                      onClick={() => toggleHide(venue.id)}
                      disabled={isToggling}
                      className={`rounded-md p-1.5 transition-colors ${
                        isHidden
                          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                      title={isHidden ? "Show this venue" : "Hide this venue"}
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
                        <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{venue.city}, {venue.state}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {venue.categories?.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight ${getCategoryBadgeClasses(cat)}`}
                        >
                          {getCategoryShortLabel(cat)}
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
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {user && (
                      <button
                        onClick={() => toggleHide(venue.id)}
                        disabled={isToggling}
                        className={`rounded-md p-1.5 transition-colors ${
                          isHidden
                            ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                        title={isHidden ? "Show this venue" : "Hide this venue"}
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
            {searchQuery
              ? `No venues matching "${searchQuery}"`
              : "No venues to show."}{" "}
            {filter === "my" && !searchQuery && (
              <button
                onClick={() => setFilter("all")}
                className="text-[var(--primary)] underline hover:no-underline"
              >
                Show all venues
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[var(--primary)] underline hover:no-underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
