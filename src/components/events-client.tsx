"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import type { Event, AgeFilter } from "@/lib/types";
import { AGE_FILTER_RANGES } from "@/lib/types";
import { ChevronDown, MapPin } from "lucide-react";
import { getCategoryBadgeClasses } from "@/lib/category-colors";
import EventCard from "./event-card";
import EventCalendar from "./event-calendar";
import EventFilters, { type SortOption, type TimeFilter, type CostFilter, type ViewMode, type GroupBy } from "./event-filters";
import { mergeConsecutiveEvents } from "@/lib/event-utils";
import { haversineDistance, zipToCoords, getProximityTier, TIER_LABELS, type ProximityTier } from "@/lib/geo-utils";

type Props = {
  events: Event[];
  interactionCounts: Record<string, { stars: number; attending: number }>;
};

export default function EventsClient({ events, interactionCounts }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [hiddenVenueIds, setHiddenVenueIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [costFilter, setCostFilter] = useState<CostFilter>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const searchParams = useSearchParams();

  // Handle ?event=UUID param — scroll to and highlight a shared event
  useEffect(() => {
    const eventId = searchParams.get("event");
    if (!eventId) return;
    setHighlightedEventId(eventId);
    // Wait for render then scroll
    const timer = setTimeout(() => {
      const el = document.getElementById(`event-${eventId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 500);
    // Clear highlight after 4 seconds
    const clearTimer = setTimeout(() => setHighlightedEventId(null), 4000);
    return () => { clearTimeout(timer); clearTimeout(clearTimer); };
  }, [searchParams]);

  // Load user's hidden events + hidden venues + profile ZIP on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_event_interactions")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("interaction_type", "hidden")
      .then(({ data }) => {
        if (data) setHiddenIds(new Set(data.map((d) => d.event_id)));
      });
    supabase
      .from("user_venue_preferences")
      .select("venue_id")
      .eq("user_id", user.id)
      .eq("is_hidden", true)
      .then(({ data }) => {
        if (data) setHiddenVenueIds(new Set(data.map((d) => d.venue_id)));
      });
    // Fetch user profile ZIP for proximity sorting
    supabase
      .from("profiles")
      .select("zip")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.zip) {
          const coords = zipToCoords(data.zip);
          if (coords) {
            setUserCoords(coords);
            setSortBy("for-you"); // Auto-default to For You
          }
        }
      });
  }, [supabase, user]);

  const handleHide = useCallback((eventId: string) => {
    setHiddenIds((prev) => new Set(prev).add(eventId));
  }, []);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function clearFilters() {
    setSortBy("date");
    setTimeFilter("all");
    setCostFilter("all");
    setSelectedCategories([]);
    setAgeFilter("all");
    setGroupBy("none");
  }

  function toggleVenueExpanded(venueId: string) {
    setExpandedVenues((prev) => {
      const next = new Set(prev);
      if (next.has(venueId)) next.delete(venueId);
      else next.add(venueId);
      return next;
    });
  }

  // Filter + sort pipeline
  const filtered = useMemo(() => {
    let result = events.filter((e) => !hiddenIds.has(e.id) && !hiddenVenueIds.has(e.venue_id));
    const totalAfterHidden = result.length;

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (timeFilter === "this-week") {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        result = result.filter((e) => {
          const start = new Date(e.start_date + "T00:00:00");
          const end = e.end_date ? new Date(e.end_date + "T00:00:00") : start;
          return end >= today && start <= endOfWeek;
        });
      } else if (timeFilter === "this-weekend") {
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - today.getDay()));
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        result = result.filter((e) => {
          const start = new Date(e.start_date + "T00:00:00");
          const end = e.end_date ? new Date(e.end_date + "T00:00:00") : start;
          return end >= saturday && start <= sunday;
        });
      } else if (timeFilter === "this-month") {
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        result = result.filter((e) => {
          const start = new Date(e.start_date + "T00:00:00");
          const end = e.end_date ? new Date(e.end_date + "T00:00:00") : start;
          return end >= today && start <= endOfMonth;
        });
      } else if (timeFilter === "next-month") {
        const startOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endOfNext = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        result = result.filter((e) => {
          const start = new Date(e.start_date + "T00:00:00");
          const end = e.end_date ? new Date(e.end_date + "T00:00:00") : start;
          return end >= startOfNext && start <= endOfNext;
        });
      }
    }

    // Cost filter
    if (costFilter === "free") {
      result = result.filter((e) => e.is_free);
    } else if (costFilter === "under10") {
      result = result.filter((e) => e.is_free || (e.cost_max !== null && e.cost_max < 10));
    } else if (costFilter === "under25") {
      result = result.filter((e) => e.is_free || (e.cost_max !== null && e.cost_max < 25));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((e) =>
        e.categories?.some((c) => selectedCategories.includes(c))
      );
    }

    // Hide not_for_kids events
    result = result.filter((e) => e.event_type !== "not_for_kids");

    // Age filter — show events that OVERLAP the selected range
    // Null-age events only pass if they have kid-friendly categories
    if (ageFilter !== "all") {
      const range = AGE_FILTER_RANGES[ageFilter];
      const KID_FRIENDLY_CATS = new Set([
        "hands-on-art", "animals-nature", "shows-performances", "science-stem",
        "festivals-fairs", "seasonal-holidays", "active-sports", "markets-shopping",
        "storytime-learning", "family-fun",
      ]);
      if (range) {
        result = result.filter((e) => {
          if (e.age_range_min === null && e.age_range_max === null) {
            // No age data — only include if at least one category is kid-friendly
            return (e.categories || []).some((cat) => KID_FRIENDLY_CATS.has(cat.toLowerCase()));
          }
          const eMin = e.age_range_min ?? 0;
          const eMax = e.age_range_max ?? 99;
          return eMin <= range.max && eMax >= range.min;
        });
      }
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "date" || sortBy === "for-you") {
        return a.start_date.localeCompare(b.start_date);
      } else if (sortBy === "venue") {
        return (a.venue?.name ?? "").localeCompare(b.venue?.name ?? "");
      } else if (sortBy === "trending") {
        const aStars = interactionCounts[a.id]?.stars ?? 0;
        const bStars = interactionCounts[b.id]?.stars ?? 0;
        return bStars - aStars;
      } else if (sortBy === "recent") {
        return b.created_at.localeCompare(a.created_at);
      }
      return 0;
    });

    // Merge consecutive-day duplicates (e.g. "Museums On Us" Apr 4 + Apr 5 → one card showing Apr 4–5)
    result = mergeConsecutiveEvents(result);

    return { events: result, totalAfterHidden };
  }, [events, hiddenIds, hiddenVenueIds, timeFilter, costFilter, selectedCategories, ageFilter, sortBy, interactionCounts]);

  // Group events by category or venue
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;

    if (groupBy === "category") {
      const map = new Map<string, Event[]>();
      for (const event of filtered.events) {
        const cats = event.categories?.length ? event.categories : ["Other"];
        for (const cat of cats) {
          if (!map.has(cat)) map.set(cat, []);
          map.get(cat)!.push(event);
        }
      }
      // Sort category groups alphabetically
      return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }

    if (groupBy === "venue") {
      const map = new Map<string, { name: string; events: Event[] }>();
      for (const event of filtered.events) {
        const venueId = event.venue_id;
        const venueName = event.venue?.name ?? "Unknown Venue";
        if (!map.has(venueId)) map.set(venueId, { name: venueName, events: [] });
        map.get(venueId)!.events.push(event);
      }
      // Sort venue groups alphabetically
      return Array.from(map.entries()).sort(([, a], [, b]) => a.name.localeCompare(b.name));
    }

    return null;
  }, [filtered.events, groupBy]);

  // Proximity-grouped events for "For You" sort
  const proximityGroups = useMemo(() => {
    if (sortBy !== "for-you" || !userCoords) return null;

    const tiers: Record<ProximityTier, Event[]> = {
      near: [],
      "short-drive": [],
      "worth-the-trip": [],
    };

    for (const event of filtered.events) {
      const venueLat = event.venue?.latitude;
      const venueLng = event.venue?.longitude;

      if (venueLat && venueLng) {
        const dist = haversineDistance(userCoords.lat, userCoords.lng, venueLat, venueLng);
        const tier = getProximityTier(dist, event.expected_attendance);
        tiers[tier].push(event);
      } else {
        // No coordinates — default to short-drive
        tiers["short-drive"].push(event);
      }
    }

    return tiers;
  }, [filtered.events, sortBy, userCoords]);

  // Render a flat list of event cards
  function renderEventList(evts: Event[], view: "list" | "grid") {
    return evts.map((event) => (
      <div
        key={event.id}
        id={`event-${event.id}`}
        className={highlightedEventId === event.id
          ? "rounded-xl ring-2 ring-blue-500 ring-offset-2 animate-pulse transition-all duration-500"
          : ""}
      >
        <EventCard
          event={event}
          starCount={interactionCounts[event.id]?.stars ?? 0}
          attendingCount={interactionCounts[event.id]?.attending ?? 0}
          onHide={handleHide}
          view={view}
        />
      </div>
    ));
  }

  // Render events grouped by venue (works within any event subset like proximity tiers)
  function renderVenueGrouped(evts: Event[], view: "list" | "grid") {
    const map = new Map<string, { name: string; events: Event[] }>();
    for (const event of evts) {
      const venueId = event.venue_id;
      const venueName = event.venue?.name ?? "Unknown Venue";
      if (!map.has(venueId)) map.set(venueId, { name: venueName, events: [] });
      map.get(venueId)!.events.push(event);
    }
    const sorted = Array.from(map.entries()).sort(([, a], [, b]) => a.name.localeCompare(b.name));
    return (
      <div className="space-y-2">
        {sorted.map(([venueId, { name, events: venueEvents }]) => {
          const isExpanded = expandedVenues.has(venueId);
          return (
            <div key={venueId} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => toggleVenueExpanded(venueId)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">{name}</h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {venueEvents.length} event{venueEvents.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              {isExpanded && (
                <div className={`border-t border-gray-100 p-3 ${view === "grid" ? "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}`}>
                  {renderEventList(venueEvents, view)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Render events grouped by category (works within any event subset)
  function renderCategoryGrouped(evts: Event[], view: "list" | "grid") {
    const map = new Map<string, Event[]>();
    for (const event of evts) {
      const cats = event.categories?.length ? event.categories : ["Other"];
      for (const cat of cats) {
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(event);
      }
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    return (
      <div className="space-y-6">
        {sorted.map(([category, catEvents]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getCategoryBadgeClasses(category)}`}>
                {category}
              </span>
              <span className="text-xs text-gray-400">{catEvents.length} event{catEvents.length !== 1 ? "s" : ""}</span>
            </div>
            <div className={view === "grid" ? "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
              {renderEventList(catEvents, view)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render grouped content
  function renderGrouped(view: "list" | "grid") {
    if (!grouped) return null;

    if (groupBy === "category") {
      return (
        <div className="mt-6 space-y-8">
          {(grouped as [string, Event[]][]).map(([category, evts]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-[var(--background)] py-2 z-10">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getCategoryBadgeClasses(category)}`}>
                  {category}
                </span>
                <span className="text-xs text-gray-400">{evts.length} event{evts.length !== 1 ? "s" : ""}</span>
              </div>
              <div className={view === "grid" ? "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                {renderEventList(evts, view)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (groupBy === "venue") {
      return (
        <div className="mt-6 space-y-2">
          {(grouped as [string, { name: string; events: Event[] }][]).map(([venueId, { name, events: evts }]) => {
            const isExpanded = expandedVenues.has(venueId);
            return (
              <div key={venueId} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => toggleVenueExpanded(venueId)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{name}</h3>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {evts.length} event{evts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                {isExpanded && (
                  <div className={`border-t border-gray-100 p-3 ${view === "grid" ? "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}`}>
                    {renderEventList(evts, view)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <EventFilters
        sortBy={sortBy}
        onSortChange={setSortBy}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        costFilter={costFilter}
        onCostFilterChange={setCostFilter}
        selectedCategories={selectedCategories}
        onCategoryToggle={toggleCategory}
        ageFilter={ageFilter}
        onAgeFilterChange={setAgeFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        onClearFilters={clearFilters}
        resultCount={filtered.events.length}
        totalCount={filtered.totalAfterHidden}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasUserZip={!!userCoords}
      />

      {filtered.events.length === 0 ? (
        <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No events match your filters.</p>
          <button onClick={clearFilters} className="mt-2 text-sm text-[var(--primary)] hover:underline">
            Clear filters
          </button>
        </div>
      ) : viewMode === "calendar" ? (
        <>
          {/* Full calendar on desktop, list fallback on mobile */}
          <div className="hidden sm:block">
            <EventCalendar events={filtered.events} interactionCounts={interactionCounts} />
          </div>
          <div className="sm:hidden mt-4">
            <p className="mb-3 text-xs text-gray-400 text-center">📅 Switch to desktop for the full calendar view</p>
            <div className="space-y-2">
              {filtered.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  starCount={interactionCounts[event.id]?.stars ?? 0}
                  attendingCount={interactionCounts[event.id]?.attending ?? 0}
                  onHide={handleHide}
                  view="list"
                />
              ))}
            </div>
          </div>
        </>
      ) : sortBy === "for-you" && proximityGroups ? (
        <div className="mt-6 space-y-8">
          {(["near", "short-drive", "worth-the-trip"] as ProximityTier[]).map((tier) => {
            const tierEvents = proximityGroups[tier];
            if (tierEvents.length === 0) return null;
            const label = TIER_LABELS[tier];
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-[var(--background)] py-2 z-10">
                  <span className="text-lg">{label.emoji}</span>
                  <h3 className="text-lg font-bold text-gray-900">{label.title}</h3>
                  <span className="text-xs text-gray-400">{label.subtitle} · {tierEvents.length} event{tierEvents.length !== 1 ? "s" : ""}</span>
                </div>
                {groupBy === "venue" ? (
                  renderVenueGrouped(tierEvents, viewMode === "grid" ? "grid" : "list")
                ) : groupBy === "category" ? (
                  renderCategoryGrouped(tierEvents, viewMode === "grid" ? "grid" : "list")
                ) : (
                  <div className={viewMode === "grid" ? "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                    {renderEventList(tierEvents, viewMode === "grid" ? "grid" : "list")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : groupBy !== "none" ? (
        renderGrouped(viewMode === "grid" ? "grid" : "list")
      ) : (
        <div className={viewMode === "grid" ? "mt-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "mt-6 space-y-2"}>
          {filtered.events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              starCount={interactionCounts[event.id]?.stars ?? 0}
              attendingCount={interactionCounts[event.id]?.attending ?? 0}
              onHide={handleHide}
              view={viewMode}
            />
          ))}
        </div>
      )}
    </>
  );
}
