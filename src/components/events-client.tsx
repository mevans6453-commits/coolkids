"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Event, AgeFilter } from "@/lib/types";
import { AGE_FILTER_RANGES } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { getCategoryBadgeClasses } from "@/lib/category-colors";
import EventCard from "./event-card";
import EventCalendar from "./event-calendar";
import EventFilters, { type SortOption, type TimeFilter, type CostFilter, type ViewMode, type GroupBy } from "./event-filters";
import { mergeConsecutiveEvents } from "@/lib/event-utils";

type Props = {
  events: Event[];
  interactionCounts: Record<string, { stars: number; attending: number }>;
};

export default function EventsClient({ events, interactionCounts }: Props) {
  const supabase = createClient();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [costFilter, setCostFilter] = useState<CostFilter>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");
  const [showHours, setShowHours] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());

  // Load user's hidden events on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_event_interactions")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("interaction_type", "hidden")
        .then(({ data }) => {
          if (data) setHiddenIds(new Set(data.map((d) => d.event_id)));
        });
    });
  }, [supabase]);

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
    setShowHours(false);
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
    let result = events.filter((e) => !hiddenIds.has(e.id));
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

    // Event type filter — hide 'hours' by default unless toggle is on
    if (!showHours) {
      result = result.filter((e) => e.event_type !== "hours");
    }

    // Age filter — show events that OVERLAP the selected range, plus null ages (for everyone)
    if (ageFilter !== "all") {
      const range = AGE_FILTER_RANGES[ageFilter];
      if (range) {
        result = result.filter((e) => {
          if (e.age_range_min === null && e.age_range_max === null) return true;
          const eMin = e.age_range_min ?? 0;
          const eMax = e.age_range_max ?? 99;
          return eMin <= range.max && eMax >= range.min;
        });
      }
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "date") {
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
  }, [events, hiddenIds, timeFilter, costFilter, selectedCategories, ageFilter, showHours, sortBy, interactionCounts]);

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

  // Render a flat list of event cards
  function renderEventList(evts: Event[], view: "list" | "grid") {
    return evts.map((event) => (
      <EventCard
        key={event.id}
        event={event}
        starCount={interactionCounts[event.id]?.stars ?? 0}
        attendingCount={interactionCounts[event.id]?.attending ?? 0}
        onHide={handleHide}
        view={view}
      />
    ));
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
        showHours={showHours}
        onShowHoursChange={setShowHours}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        onClearFilters={clearFilters}
        resultCount={filtered.events.length}
        totalCount={filtered.totalAfterHidden}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
