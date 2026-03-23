"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Play, RefreshCw, ChevronDown, ChevronUp, Check, Trash2, RotateCcw, Link } from "lucide-react";

// -----------------------------------------------
// Types
// -----------------------------------------------

type Venue = {
  id: string;
  name: string;
  preferred_strategy: string | null;
  scrape_url: string | null;
  is_active: boolean;
  categories: string[];
};

type ScrapeRun = {
  id: string;
  venue_id: string;
  strategy: string;
  events_found: number;
  events_saved: number;
  status: string;
  error_message: string | null;
  duration_ms: number;
  run_date: string;
};

type EventSummary = {
  id: string;
  venue_id: string;
  name: string;
  event_type: string | null;
  age_range_min: number | null;
  age_range_max: number | null;
};

type Props = {
  venues: Venue[];
  scrapeRuns: ScrapeRun[];
  events: EventSummary[];
};

// -----------------------------------------------
// Status colors
// -----------------------------------------------

function statusBadge(status: string) {
  switch (status) {
    case "success":
      return "bg-green-50 text-green-700 border-green-200";
    case "empty":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "error":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
  }
}

// -----------------------------------------------
// Main Dashboard Component
// -----------------------------------------------

export default function ScrapeDashboard({ venues, scrapeRuns, events }: Props) {
  const router = useRouter();
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());
  const [scrapingAll, setScrapingAll] = useState(false);
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);

  // Compute latest run per venue
  const latestRunByVenue = useMemo(() => {
    const map = new Map<string, ScrapeRun>();
    for (const run of scrapeRuns) {
      if (!map.has(run.venue_id)) map.set(run.venue_id, run);
    }
    return map;
  }, [scrapeRuns]);

  // Compute event counts per venue
  const eventsByVenue = useMemo(() => {
    const map = new Map<string, EventSummary[]>();
    for (const e of events) {
      if (!map.has(e.venue_id)) map.set(e.venue_id, []);
      map.get(e.venue_id)!.push(e);
    }
    return map;
  }, [events]);

  // Strategy scoreboard
  const strategyStats = useMemo(() => {
    const stats: Record<string, { venues: number; events: number }> = {};
    for (const v of venues) {
      const strat = v.preferred_strategy || "none";
      if (!stats[strat]) stats[strat] = { venues: 0, events: 0 };
      stats[strat].venues++;
      stats[strat].events += (eventsByVenue.get(v.id)?.length ?? 0);
    }
    return Object.entries(stats).sort((a, b) => b[1].events - a[1].events);
  }, [venues, eventsByVenue]);

  // Sort venues: error first, then empty, then success, then no runs
  const sortedVenues = useMemo(() => {
    return [...venues].sort((a, b) => {
      const aRun = latestRunByVenue.get(a.id);
      const bRun = latestRunByVenue.get(b.id);
      const statusOrder: Record<string, number> = { error: 0, empty: 1, success: 2 };
      const aOrder = aRun ? (statusOrder[aRun.status] ?? 3) : 3;
      const bOrder = bRun ? (statusOrder[bRun.status] ?? 3) : 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });
  }, [venues, latestRunByVenue]);

  async function runScrape(venueId?: string) {
    if (venueId) {
      setScrapingIds((prev) => new Set(prev).add(venueId));
    } else {
      setScrapingAll(true);
    }

    try {
      const url = venueId ? `/api/scrape?venue=${venueId}` : "/api/scrape";
      await fetch(url, { method: "POST" });
      router.refresh();
    } finally {
      if (venueId) {
        setScrapingIds((prev) => {
          const next = new Set(prev);
          next.delete(venueId);
          return next;
        });
      } else {
        setScrapingAll(false);
      }
    }
  }

  async function toggleVenueActive(venueId: string, currentlyActive: boolean) {
    const supabase = createClient();
    await supabase.from("venues").update({ is_active: !currentlyActive }).eq("id", venueId);
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Strategy Scoreboard */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Strategy Performance</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {strategyStats.map(([name, stats]) => (
            <div key={name} className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <div className="text-sm font-medium text-gray-500">{name}</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{stats.venues}</div>
              <div className="text-xs text-gray-400">{stats.events} events</div>
            </div>
          ))}
        </div>
      </section>

      {/* Run All Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => runScrape()}
          disabled={scrapingAll}
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-light)] disabled:opacity-50"
        >
          {scrapingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {scrapingAll ? "Scraping All..." : "Run Scrape (All Venues)"}
        </button>
        <span className="text-sm text-gray-500">
          {venues.filter(v => v.is_active).length} active venues · {events.length} events
        </span>
      </div>

      {/* Active Venue Scoreboard Table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Active Venues</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Strategy</th>
                <th className="px-4 py-3">Last Scrape</th>
                <th className="px-4 py-3 text-center">Events</th>
                <th className="px-4 py-3 text-center">Hrs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedVenues.map((venue) => {
                const run = latestRunByVenue.get(venue.id);
                const venueEvents = eventsByVenue.get(venue.id) ?? [];
                const eventCount = venueEvents.filter((e) => e.event_type !== "hours").length;
                const hoursCount = venueEvents.filter((e) => e.event_type === "hours").length;
                const status = run?.status ?? "none";
                const isExpanded = expandedVenue === venue.id;
                const isScraping = scrapingIds.has(venue.id);

                return (
                  <VenueRow
                    key={venue.id}
                    venue={venue}
                    run={run}
                    eventCount={eventCount}
                    hoursCount={hoursCount}
                    status={status}
                    isExpanded={isExpanded}
                    isScraping={isScraping}
                    events={venueEvents}
                    onToggleExpand={() => setExpandedVenue(isExpanded ? null : venue.id)}
                    onRunScrape={() => runScrape(venue.id)}
                    onToggleActive={() => toggleVenueActive(venue.id, venue.is_active)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deactivated Venues */}
      {venues.some(v => !v.is_active) && (
        <section>
          <h2 className="text-lg font-semibold text-gray-400">Deactivated Venues</h2>
          <p className="mt-1 text-xs text-gray-400">These venues are hidden from all public pages.</p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {venues.filter(v => !v.is_active).map((venue) => (
                  <tr key={venue.id} className="bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400 line-through">{venue.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleVenueActive(venue.id, venue.is_active)}
                        className="flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// -----------------------------------------------
// Venue Row (with expandable event list)
// -----------------------------------------------

function VenueRow({
  venue, run, eventCount, hoursCount, status, isExpanded, isScraping, events, onToggleExpand, onRunScrape, onToggleActive,
}: {
  venue: Venue;
  run: ScrapeRun | undefined;
  eventCount: number;
  hoursCount: number;
  status: string;
  isExpanded: boolean;
  isScraping: boolean;
  events: EventSummary[];
  onToggleExpand: () => void;
  onRunScrape: () => void;
  onToggleActive: () => void;
}) {
  return (
    <>
      <tr className={`${status === "error" ? "bg-red-50/50" : status === "empty" ? "bg-amber-50/30" : ""}`}>
        <td className="px-4 py-3">
          <button onClick={onToggleExpand} className="flex items-center gap-1 text-left font-medium text-gray-900 hover:text-[var(--primary)]">
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {venue.name}
          </button>
        </td>
        <td className="px-4 py-3">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
            {venue.preferred_strategy || "—"}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {run ? new Date(run.run_date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never"}
        </td>
        <td className="px-4 py-3 text-center font-medium">{eventCount}</td>
        <td className="px-4 py-3 text-center text-gray-400">{hoursCount}</td>
        <td className="px-4 py-3">
          <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge(status)}`}>
            {status}
          </span>
          {run?.error_message && (
            <div className="mt-0.5 text-[10px] text-red-500 truncate max-w-[150px]" title={run.error_message}>
              {run.error_message}
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={onRunScrape}
              disabled={isScraping}
              className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {isScraping ? <RefreshCw className="inline h-3 w-3 animate-spin" /> : "Scrape"}
            </button>
            <button
              onClick={onToggleActive}
              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
              title="Deactivate this venue"
            >
              <Trash2 className="inline h-3 w-3" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-gray-50/50 px-4 py-3">
            <VenueExpandedView venue={venue} events={events} />
          </td>
        </tr>
      )}
    </>
  );
}

// -----------------------------------------------
// Venue Expanded View (URL editing + events)
// -----------------------------------------------

function VenueExpandedView({ venue, events }: { venue: Venue; events: EventSummary[] }) {
  const supabase = createClient();
  const [urlValue, setUrlValue] = useState(venue.scrape_url || "");
  const [urlSaved, setUrlSaved] = useState(false);

  async function saveUrl() {
    await supabase.from("venues").update({ scrape_url: urlValue || null }).eq("id", venue.id);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Editable scrape URL */}
      <div>
        <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase mb-1">
          <Link className="h-3 w-3" />
          Scrape URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onBlur={saveUrl}
            placeholder="https://example.com/events"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          {urlSaved && <Check className="h-4 w-4 text-green-500 flex-shrink-0 self-center" />}
        </div>
      </div>

      {/* Events list */}
      <EventEditList events={events} />
    </div>
  );
}

// -----------------------------------------------
// Inline Event Edit List
// -----------------------------------------------

function EventEditList({ events }: { events: EventSummary[] }) {
  const supabase = createClient();
  const [saving, setSaving] = useState<string | null>(null);

  async function updateField(eventId: string, field: string, value: string | number | null) {
    setSaving(eventId);
    await supabase.from("events").update({ [field]: value }).eq("id", eventId);
    setSaving(null);
  }

  if (events.length === 0) {
    return <p className="text-xs text-gray-400">No events for this venue.</p>;
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_100px_60px_60px] gap-2 text-[10px] font-medium text-gray-400 uppercase">
        <span>Event Name</span>
        <span>Type</span>
        <span>Age Min</span>
        <span>Age Max</span>
      </div>
      {events.map((e) => (
        <div key={e.id} className="grid grid-cols-[1fr_100px_60px_60px] gap-2 items-center">
          <span className="text-xs text-gray-700 truncate" title={e.name}>{e.name}</span>
          <select
            value={e.event_type || "event"}
            onChange={(ev) => { e.event_type = ev.target.value; updateField(e.id, "event_type", ev.target.value); }}
            className="rounded border border-gray-200 px-1 py-0.5 text-xs"
          >
            <option value="event">event</option>
            <option value="hours">hours</option>
            <option value="not_for_kids">not for kids</option>
          </select>
          <input
            type="number"
            defaultValue={e.age_range_min ?? ""}
            placeholder="—"
            onBlur={(ev) => updateField(e.id, "age_range_min", ev.target.value ? parseInt(ev.target.value) : null)}
            className="w-full rounded border border-gray-200 px-1 py-0.5 text-xs text-center"
          />
          <input
            type="number"
            defaultValue={e.age_range_max ?? ""}
            placeholder="—"
            onBlur={(ev) => updateField(e.id, "age_range_max", ev.target.value ? parseInt(ev.target.value) : null)}
            className="w-full rounded border border-gray-200 px-1 py-0.5 text-xs text-center"
          />
          {saving === e.id && <Check className="h-3 w-3 text-green-500" />}
        </div>
      ))}
    </div>
  );
}
