"use client";

import { useState } from "react";
import type { Event, DadJoke as DadJokeType } from "@/lib/types";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { getCategoryBadgeClasses } from "@/lib/category-colors";
import { MapPin, ExternalLink, Calendar, ChevronRight, Sparkles, Clock } from "lucide-react";
import InteractionButtons from "./interaction-buttons";
import EventActions from "./event-actions";
import DadJoke from "./dad-joke";

type Props = {
  weekendEvents: Event[];
  comingUpEvents: Event[];
  interactionCounts: Record<string, { stars: number; attending: number }>;
  saturdayStr: string;
  sundayStr: string;
  todayStr: string;
  isWeekend: boolean;
  todaysJoke: DadJokeType | null;
};

/** Check if event is "featured" (festival, fair, gala, etc. or high engagement) */
function isFeatured(event: Event, counts: { stars: number; attending: number }): boolean {
  const name = (event.name || "").toLowerCase();
  const featuredKeywords = ["festival", "fair", "gala", "celebration", "palooza", "expo", "fireworks", "concert"];
  if (featuredKeywords.some((kw) => name.includes(kw))) return true;
  if ((counts.stars + counts.attending) >= 3) return true;
  return false;
}

/** Format a date string as "Saturday, March 22" */
function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** Format a date string as "Mar 22" */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Group upcoming events by week label */
function groupByWeek(events: Event[]): { label: string; events: Event[] }[] {
  const groups: Map<string, Event[]> = new Map();

  events.forEach((e) => {
    const d = new Date(e.start_date + "T12:00:00");
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const label = `${formatShortDate(weekStart.toISOString().split("T")[0])} – ${formatShortDate(weekEnd.toISOString().split("T")[0])}`;

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(e);
  });

  return Array.from(groups.entries()).map(([label, events]) => ({ label, events }));
}

export default function ThisWeekendClient({
  weekendEvents,
  comingUpEvents,
  interactionCounts,
  saturdayStr,
  sundayStr,
  todayStr,
  isWeekend,
  todaysJoke,
}: Props) {
  // Split weekend events into Saturday and Sunday
  const satDate = new Date(saturdayStr + "T00:00:00").getTime();
  const sunDate = new Date(sundayStr + "T00:00:00").getTime();
  const todayDate = new Date(todayStr + "T00:00:00").getTime();

  const saturdayEvents: Event[] = [];
  const sundayEvents: Event[] = [];
  const todayEvents: Event[] = [];

  weekendEvents.forEach((e) => {
    const start = new Date(e.start_date + "T00:00:00").getTime();
    const end = e.end_date ? new Date(e.end_date + "T00:00:00").getTime() : start;

    // Multi-day events appear on both days
    if (start <= satDate && end >= satDate) saturdayEvents.push(e);
    if (start <= sunDate && end >= sunDate) sundayEvents.push(e);
    // Events happening today (only on weekends)
    if (isWeekend && start <= todayDate && end >= todayDate) todayEvents.push(e);
  });

  // Separate featured from community events
  const satFeatured = saturdayEvents.filter((e) => isFeatured(e, interactionCounts[e.id] || { stars: 0, attending: 0 }));
  const satCommunity = saturdayEvents.filter((e) => !isFeatured(e, interactionCounts[e.id] || { stars: 0, attending: 0 }));
  const sunFeatured = sundayEvents.filter((e) => isFeatured(e, interactionCounts[e.id] || { stars: 0, attending: 0 }));
  const sunCommunity = sundayEvents.filter((e) => !isFeatured(e, interactionCounts[e.id] || { stars: 0, attending: 0 }));

  // Coming Up grouped by week
  const weekGroups = groupByWeek(comingUpEvents.slice(0, 30));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 px-4 py-14 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="mx-auto max-w-4xl text-center relative">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-200 mb-2">
            {formatDayLabel(saturdayStr)} – {formatDayLabel(sundayStr).split(", ").slice(1).join(", ")}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Here&apos;s what&apos;s happening
            <span className="block text-amber-300">this weekend</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            {weekendEvents.length > 0
              ? `${weekendEvents.length} event${weekendEvents.length !== 1 ? "s" : ""} across Cherokee County & North Georgia`
              : "Check back soon — weekend events are still loading!"}
          </p>
        </div>
      </section>

      {/* Happening Today — only shown on weekends when there are events today */}
      {isWeekend && todayEvents.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-10 pb-4">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <h2 className="text-xl font-bold text-gray-900">Happening Today</h2>
              <span className="text-sm text-gray-500">{formatDayLabel(todayStr)}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 ml-5">
              {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""} you can go to right now
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {todayEvents.map((event) => (
              <FeaturedEventCard
                key={`today-${event.id}`}
                event={event}
                counts={interactionCounts[event.id] || { stars: 0, attending: 0 }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Weekend Events */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        {/* Saturday */}
        {saturdayEvents.length > 0 && (
          <DaySection
            dayLabel={formatDayLabel(saturdayStr)}
            featuredEvents={satFeatured}
            communityEvents={satCommunity}
            interactionCounts={interactionCounts}
          />
        )}

        {/* Sunday */}
        {sundayEvents.length > 0 && (
          <DaySection
            dayLabel={formatDayLabel(sundayStr)}
            featuredEvents={sunFeatured}
            communityEvents={sunCommunity}
            interactionCounts={interactionCounts}
          />
        )}

        {weekendEvents.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-700">No events this weekend</h3>
            <p className="mt-2 text-gray-500">Check out the full events list or come back later.</p>
            <a href="/events" className="mt-4 inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Browse All Events
            </a>
          </div>
        )}
      </section>

      {/* Dad Joke */}
      {todaysJoke && (
        <DadJoke setup={todaysJoke.setup} punchline={todaysJoke.punchline} />
      )}

      {/* Coming Up This Month */}
      {comingUpEvents.length > 0 && (
        <section className="bg-gray-50 px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-gray-900">Coming Up This Month</h2>
            <p className="mt-1 text-gray-500">What&apos;s ahead after this weekend</p>

            <div className="mt-6 space-y-8">
              {weekGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    <Calendar className="h-4 w-4" />
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.events.map((event) => (
                      <CompactEventRow
                        key={event.id}
                        event={event}
                        counts={interactionCounts[event.id]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <a
                href="/events"
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Events
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** Day section — Featured events at top with big cards, community events below */
function DaySection({
  dayLabel,
  featuredEvents,
  communityEvents,
  interactionCounts,
}: {
  dayLabel: string;
  featuredEvents: Event[];
  communityEvents: Event[];
  interactionCounts: Record<string, { stars: number; attending: number }>;
}) {
  return (
    <div className="mb-10">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
        <span className="rounded-lg bg-[var(--primary)]/10 px-3 py-1 text-[var(--primary)]">
          {dayLabel}
        </span>
      </h2>

      {/* Featured events — big cards */}
      {featuredEvents.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-500">
            <Sparkles className="h-3.5 w-3.5" />
            Featured
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredEvents.map((event) => (
              <FeaturedEventCard
                key={event.id}
                event={event}
                counts={interactionCounts[event.id] || { stars: 0, attending: 0 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Community events — compact rows */}
      {communityEvents.length > 0 && (
        <div>
          {featuredEvents.length > 0 && (
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Community
            </div>
          )}
          <div className="space-y-2">
            {communityEvents.map((event) => (
              <CompactEventRow
                key={event.id}
                event={event}
                counts={interactionCounts[event.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Big featured event card */
function FeaturedEventCard({
  event,
  counts,
}: {
  event: Event;
  counts: { stars: number; attending: number };
}) {
  const desc = event.description
    ? decodeHtmlEntities(event.description).slice(0, 120)
    : null;
  const moreInfoUrl = event.source_url || event.venue?.website;

  return (
    <div className="rounded-xl border border-indigo-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-400" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 border border-indigo-100">
                Featured
              </span>
              {event.categories?.slice(0, 2).map((cat) => (
                <span key={cat} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryBadgeClasses(cat)}`}>
                  {cat}
                </span>
              ))}
            </div>

            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              {decodeHtmlEntities(event.name)}
            </h3>

            {event.venue && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                {event.venue.name}, {event.venue.city}
              </p>
            )}

            {desc && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{desc}{desc.length >= 120 ? "..." : ""}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {event.start_time && (
                <span className="text-sm font-medium text-gray-700">{event.start_time}</span>
              )}
              {event.is_free ? (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600 border border-green-100">FREE</span>
              ) : event.cost ? (
                <span className="text-sm text-gray-600">{event.cost}</span>
              ) : null}
              {moreInfoUrl && (
                <a
                  href={moreInfoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)]/5 px-2.5 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors border border-[var(--primary)]/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  More Info
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3">
          <InteractionButtons eventId={event.id} initialStarCount={counts.stars} initialAttendingCount={counts.attending} />
          <div className="ml-auto">
            <EventActions event={event} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact event row for community events and coming-up section */
function CompactEventRow({
  event,
  counts,
}: {
  event: Event;
  counts?: { stars: number; attending: number };
}) {
  const moreInfoUrl = event.source_url || event.venue?.website;
  const c = counts || { stars: 0, attending: 0 };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5 hover:shadow-sm transition-shadow">
      {/* Date pill */}
      <div className="w-14 flex-shrink-0 text-center">
        <span className="text-xs font-semibold text-[var(--primary)]">
          {formatShortDate(event.start_date)}
        </span>
      </div>

      {/* Event info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-medium text-sm text-gray-900 truncate">
            {decodeHtmlEntities(event.name)}
          </span>
          {event.is_free && (
            <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 flex-shrink-0">FREE</span>
          )}
        </div>
        {event.venue && (
          <span className="text-xs text-gray-400 truncate block">{event.venue.name}</span>
        )}
      </div>

      {/* Actions */}
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
        {moreInfoUrl && (
          <a
            href={moreInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <InteractionButtons eventId={event.id} initialStarCount={c.stars} initialAttendingCount={c.attending} />
        <EventActions event={event} />
      </div>

      {/* Mobile: just the overflow menu */}
      <div className="sm:hidden flex-shrink-0">
        <EventActions event={event} />
      </div>
    </div>
  );
}


