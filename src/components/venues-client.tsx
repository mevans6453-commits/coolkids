"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import type { Venue } from "@/lib/types";
import {
  Eye, EyeOff, LogIn, Search, ExternalLink,
  ChevronDown, ChevronUp, MapPin, Calendar, Clock, X,
  EyeOff as HideIcon,
} from "lucide-react";
import { getCategoryBadgeClasses, getCategoryShortLabel } from "@/lib/category-colors";

type VenueEvent = {
  id: string;
  name: string;
  venue_id: string;
  start_date: string;
  end_date: string | null;
  time_text: string | null;
  cost: string | null;
  event_type: string | null;
  description: string | null;
};

type VenueFilter = "all" | "my";

type Props = {
  venues: Venue[];
  eventCounts: Record<string, number>;
  eventsByVenue: Record<string, VenueEvent[]>;
};

export default function VenuesClient({ venues, eventCounts, eventsByVenue }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user, authLoaded } = useAuth();
  const [hiddenVenueIds, setHiddenVenueIds] = useState<Set<string>>(new Set());
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<VenueFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);

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

    // Load hidden events
    supabase
      .from("user_event_interactions")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("interaction_type", "hidden")
      .then(({ data }) => {
        if (data) setHiddenEventIds(new Set(data.map((d) => d.event_id)));
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
        { user_id: user.id, venue_id: venueId, is_hidden: true, updated_at: new Date().toISOString() },
        { onConflict: "user_id,venue_id" }
      );
      setHiddenVenueIds((prev) => new Set(prev).add(venueId));
    }
    setTogglingId(null);
  }

  // Toggle hide/show individual event
  async function toggleHideEvent(eventId: string) {
    if (!user) return;
    const isCurrentlyHidden = hiddenEventIds.has(eventId);

    if (isCurrentlyHidden) {
      await supabase
        .from("user_event_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .eq("interaction_type", "hidden");
      setHiddenEventIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    } else {
      await supabase.from("user_event_interactions").insert({
        user_id: user.id,
        event_id: eventId,
        interaction_type: "hidden",
      });
      setHiddenEventIds((prev) => new Set(prev).add(eventId));
    }
  }

  // Filtered + searched venues
  const displayedVenues = useMemo(() => {
    let result = venues;
    if (filter === "my" && user) {
      result = result.filter((v) => !hiddenVenueIds.has(v.id));
    }
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

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="mt-6">
      {/* Top bar: toggle + search + count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
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
              className="w-full sm:w-56 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
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
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-blue-600">
          <LogIn className="h-4 w-4 flex-shrink-0" />
          <span>
            <a href="/subscribe" className="font-medium underline hover:no-underline">
              Sign in
            </a>{" "}
            to customize your venue list — hide venues you don&apos;t visit.
          </span>
        </div>
      )}

      {/* Venue Cards */}
      <div className="space-y-3">
        {displayedVenues.map((venue) => {
          const isHidden = hiddenVenueIds.has(venue.id);
          const count = eventCounts[venue.id] || 0;
          const isToggling = togglingId === venue.id;
          const isExpanded = expandedVenueId === venue.id;
          const venueEvents = eventsByVenue[venue.id] || [];

          return (
            <div
              key={venue.id}
              className={`rounded-xl border bg-white transition-all ${
                isHidden ? "opacity-40 border-gray-200" : isExpanded ? "border-[var(--primary)]/30 shadow-sm" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Venue Header */}
              <div className="px-4 py-3.5 flex items-center gap-3">
                {/* Expand arrow + Name block */}
                <button
                  onClick={() => setExpandedVenueId(isExpanded ? null : venue.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  disabled={count === 0}
                >
                  {count > 0 ? (
                    isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )
                  ) : (
                    <div className="w-4 flex-shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${isHidden ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {venue.name}
                      </span>
                      {count > 0 && (
                        <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                          {count} event{count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {venue.city}{venue.state ? `, ${venue.state}` : ""}
                      </span>
                      {/* Categories inline */}
                      <div className="hidden sm:flex flex-wrap gap-1">
                        {venue.categories?.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight ${getCategoryBadgeClasses(cat)}`}
                          >
                            {getCategoryShortLabel(cat)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {venue.website && (
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title={`Visit ${venue.name} website`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Website</span>
                    </a>
                  )}

                  {user && (
                    <button
                      onClick={() => toggleHide(venue.id)}
                      disabled={isToggling}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        isHidden
                          ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                      title={isHidden ? "Show this venue" : "Hide this venue"}
                    >
                      {isHidden ? (
                        <><EyeOff className="h-3.5 w-3.5" /><span>Show</span></>
                      ) : (
                        <><Eye className="h-3.5 w-3.5" /><span>Hide</span></>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile categories (shown below venue name) */}
              {venue.categories && venue.categories.length > 0 && (
                <div className="sm:hidden px-4 pb-2 -mt-1 flex flex-wrap gap-1 ml-7">
                  {venue.categories.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight ${getCategoryBadgeClasses(cat)}`}
                    >
                      {getCategoryShortLabel(cat)}
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded Events List */}
              {isExpanded && venueEvents.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                  <div className="space-y-2">
                    {venueEvents.map((event) => {
                      const isEventHidden = hiddenEventIds.has(event.id);
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center gap-3 rounded-lg bg-white border border-gray-100 px-3 py-2.5 transition-opacity ${
                            isEventHidden ? "opacity-40" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium ${isEventHidden ? "line-through text-gray-400" : "text-gray-900"}`}>
                              {event.name}
                            </span>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(event.start_date)}
                                {event.end_date && event.end_date !== event.start_date && ` – ${formatDate(event.end_date)}`}
                              </span>
                              {event.time_text && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time_text}
                                </span>
                              )}
                              {event.cost && (
                                <span className={event.cost.toLowerCase().includes("free") ? "text-green-600 font-medium" : ""}>
                                  {event.cost}
                                </span>
                              )}
                              {event.event_type === "hours" && (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">hours</span>
                              )}
                            </div>
                          </div>

                          {/* Per-event hide button */}
                          {user && (
                            <button
                              onClick={() => toggleHideEvent(event.id)}
                              className={`flex-shrink-0 rounded-lg p-1.5 text-xs transition-colors ${
                                isEventHidden
                                  ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                                  : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                              }`}
                              title={isEventHidden ? "Show this event" : "Hide this event"}
                            >
                              {isEventHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-center text-[11px] text-gray-400">
                    {venueEvents.length} upcoming event{venueEvents.length !== 1 ? "s" : ""}
                    {hiddenEventIds.size > 0 && ` · ${[...hiddenEventIds].filter(id => venueEvents.some(e => e.id === id)).length} hidden`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayedVenues.length === 0 && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">
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
  );
}
