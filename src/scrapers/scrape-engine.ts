/**
 * Multi-Strategy Scrape Engine
 *
 * Orchestrates scraping across all venues using multiple strategies.
 * For each venue:
 * 1. Try preferred_strategy first (if set)
 * 2. If 0 results or error, auto-detect by trying ALL strategies
 * 3. First strategy that returns events wins
 * 4. Logs every attempt to scrape_runs table
 * 5. Updates venue.preferred_strategy with the winner
 */

import { createClient } from "@supabase/supabase-js";
import type { ScrapedEvent, VenueConfig } from "./base-scraper";
import { ALL_STRATEGIES, getStrategy } from "./strategies";
import { getAllVenueConfigs } from "./venues";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -----------------------------------------------
// Types
// -----------------------------------------------

export type StrategyAttempt = {
  strategy: string;
  events_found: number;
  events_saved: number;
  duration_ms: number;
  status: "success" | "empty" | "error";
  error_message: string | null;
};

export type VenueScrapeResult = {
  venue_id: string;
  venue_name: string;
  strategy_used: string | null;
  events_found: number;
  events_saved: number;
  error: string | null;
  attempts: StrategyAttempt[];
};

export type ScrapeRunSummary = {
  started_at: string;
  finished_at: string;
  total_venues: number;
  successful: number;
  failed: number;
  events_found: number;
  events_saved: number;
  results: VenueScrapeResult[];
};

// -----------------------------------------------
// Main entry point
// -----------------------------------------------

/**
 * Run scrapers for all configured venues (or a specific list).
 * @param venueIds Optional list of venue IDs to scrape (defaults to all)
 * @param forceDetect If true, skip preferred_strategy and try all strategies
 */
export async function runScrapeAll(
  venueIds?: string[],
  forceDetect = false
): Promise<ScrapeRunSummary> {
  const startedAt = new Date().toISOString();
  const configs = await buildVenueConfigs(venueIds);

  console.log(`\n=== Starting multi-strategy scrape: ${configs.length} venues ===\n`);

  const results: VenueScrapeResult[] = [];
  let totalEventsFound = 0;
  let totalEventsSaved = 0;
  let successful = 0;
  let failed = 0;

  for (const config of configs) {
    const result = await scrapeVenue(config, forceDetect);
    results.push(result);

    if (result.events_found > 0) {
      successful++;
      totalEventsFound += result.events_found;
      totalEventsSaved += result.events_saved;
    } else {
      failed++;
    }

    // Polite delay between venues
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const finishedAt = new Date().toISOString();

  console.log(`\n=== Multi-strategy scrape complete ===`);
  console.log(`  Venues: ${successful} with events, ${failed} empty/failed`);
  console.log(`  Events: ${totalEventsFound} found, ${totalEventsSaved} saved\n`);

  return {
    started_at: startedAt,
    finished_at: finishedAt,
    total_venues: configs.length,
    successful,
    failed,
    events_found: totalEventsFound,
    events_saved: totalEventsSaved,
    results,
  };
}

// -----------------------------------------------
// Per-venue scraping with multi-strategy fallback
// -----------------------------------------------

async function scrapeVenue(
  config: VenueConfig,
  forceDetect: boolean
): Promise<VenueScrapeResult> {
  const attempts: StrategyAttempt[] = [];
  let winningStrategy: string | null = null;
  let winningEvents: ScrapedEvent[] = [];

  console.log(`[Engine] Scraping: ${config.venue_name}`);

  // Step 1: Try preferred strategy (unless force-detecting)
  if (!forceDetect && config.preferred_strategy) {
    const preferred = getStrategy(config.preferred_strategy);
    if (preferred && preferred.canAttempt(config.scrape_url)) {
      console.log(`[Engine]   Trying preferred: ${preferred.name}`);

      const startMs = Date.now();
      try {
        const result = await withTimeout(preferred.scrape(config), 30000, `${preferred.name} strategy`);
        const durationMs = Date.now() - startMs;

        if (result.events.length > 0) {
          winningStrategy = preferred.name;
          winningEvents = result.events;

          const attempt: StrategyAttempt = {
            strategy: preferred.name,
            events_found: result.events.length,
            events_saved: 0,
            duration_ms: durationMs,
            status: "success",
            error_message: null,
          };
          attempts.push(attempt);
          await logScrapeRun(config.venue_id, attempt);
        } else {
          const attempt: StrategyAttempt = {
            strategy: preferred.name,
            events_found: 0,
            events_saved: 0,
            duration_ms: durationMs,
            status: result.error ? "error" : "empty",
            error_message: result.error,
          };
          attempts.push(attempt);
          await logScrapeRun(config.venue_id, attempt);
        }
      } catch (err) {
        const attempt: StrategyAttempt = {
          strategy: preferred.name,
          events_found: 0,
          events_saved: 0,
          duration_ms: Date.now() - startMs,
          status: "error",
          error_message: err instanceof Error ? err.message : String(err),
        };
        attempts.push(attempt);
        await logScrapeRun(config.venue_id, attempt);
      }
    }
  }

  // Step 2: Auto-detect if no winner yet
  if (winningEvents.length === 0) {
    console.log(`[Engine]   Auto-detecting best strategy...`);

    for (const strategy of ALL_STRATEGIES) {
      // Skip if we already tried this one as preferred
      if (attempts.some((a) => a.strategy === strategy.name)) continue;

      if (!strategy.canAttempt(config.scrape_url)) {
        console.log(`[Engine]   Skipping ${strategy.name} (not applicable)`);
        continue;
      }

      console.log(`[Engine]   Trying: ${strategy.name}`);
      const startMs = Date.now();

      try {
        const result = await withTimeout(strategy.scrape(config), 30000, `${strategy.name} strategy`);
        const durationMs = Date.now() - startMs;
        const eventsFound = result.events.length;

        const attempt: StrategyAttempt = {
          strategy: strategy.name,
          events_found: eventsFound,
          events_saved: 0,
          duration_ms: durationMs,
          status: result.error ? "error" : eventsFound > 0 ? "success" : "empty",
          error_message: result.error,
        };
        attempts.push(attempt);
        await logScrapeRun(config.venue_id, attempt);

        if (eventsFound > 0) {
          winningStrategy = strategy.name;
          winningEvents = result.events;
          break; // Found a winner
        }
      } catch (err) {
        const attempt: StrategyAttempt = {
          strategy: strategy.name,
          events_found: 0,
          events_saved: 0,
          duration_ms: Date.now() - startMs,
          status: "error",
          error_message: err instanceof Error ? err.message : String(err),
        };
        attempts.push(attempt);
        await logScrapeRun(config.venue_id, attempt);
      }
    }
  }

  // Step 3: Save events if we found any
  let eventsSaved = 0;
  if (winningEvents.length > 0) {
    eventsSaved = await saveEvents(config.venue_id, winningEvents);

    // Update preferred_strategy if it changed
    if (winningStrategy && winningStrategy !== config.preferred_strategy) {
      await updatePreferredStrategy(config.venue_id, winningStrategy);
      console.log(`[Engine]   Updated preferred_strategy to: ${winningStrategy}`);
    }
  }

  const eventsFound = winningEvents.length;
  console.log(`[Engine]   Result: ${eventsFound} events found, ${eventsSaved} saved (strategy: ${winningStrategy || "none"})`);

  return {
    venue_id: config.venue_id,
    venue_name: config.venue_name,
    strategy_used: winningStrategy,
    events_found: eventsFound,
    events_saved: eventsSaved,
    error: eventsFound === 0
      ? (attempts.find((a) => a.error_message)?.error_message || "No events found with any strategy")
      : null,
    attempts,
  };
}

// -----------------------------------------------
// Timeout utility
// -----------------------------------------------

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// -----------------------------------------------
// Build venue configs from hardcoded + database
// -----------------------------------------------

async function buildVenueConfigs(venueIds?: string[]): Promise<VenueConfig[]> {
  const hardcoded = getAllVenueConfigs();
  const hardcodedIds = new Set(hardcoded.map((c) => c.venue_id));

  // Fetch all venues from DB that have a scrape_url
  const { data: dbVenues } = await supabase
    .from("venues")
    .select("id, name, scrape_url, scrape_method, preferred_strategy, categories")
    .not("scrape_url", "is", null)
    .eq("is_active", true);

  const configs: VenueConfig[] = [...hardcoded];

  // Attach preferred_strategy from DB to hardcoded configs
  for (const config of configs) {
    const dbVenue = dbVenues?.find((v) => v.id === config.venue_id);
    if (dbVenue?.preferred_strategy) {
      config.preferred_strategy = dbVenue.preferred_strategy;
    }
  }

  // Add DB-only venues (not in hardcoded list)
  for (const v of dbVenues || []) {
    if (!hardcodedIds.has(v.id) && v.scrape_url) {
      configs.push({
        venue_id: v.id,
        venue_name: v.name,
        scrape_url: v.scrape_url,
        scrape_method: v.scrape_method || "apify",
        preferred_strategy: v.preferred_strategy || null,
        default_categories: v.categories || [],
      });
    }
  }

  if (venueIds) {
    return configs.filter((c) => venueIds.includes(c.venue_id));
  }

  return configs;
}

// -----------------------------------------------
// Database operations
// -----------------------------------------------

async function logScrapeRun(venueId: string, attempt: StrategyAttempt): Promise<void> {
  const { error } = await supabase.from("scrape_runs").insert({
    venue_id: venueId,
    strategy: attempt.strategy,
    events_found: attempt.events_found,
    events_saved: attempt.events_saved,
    status: attempt.status,
    error_message: attempt.error_message,
    duration_ms: attempt.duration_ms,
  });

  if (error) {
    console.error(`[Engine] Failed to log scrape run: ${error.message}`);
  }
}

async function updatePreferredStrategy(venueId: string, strategy: string): Promise<void> {
  const { error } = await supabase
    .from("venues")
    .update({ preferred_strategy: strategy })
    .eq("id", venueId);

  if (error) {
    console.error(`[Engine] Failed to update preferred_strategy: ${error.message}`);
  }
}

async function saveEvents(venueId: string, events: ScrapedEvent[]): Promise<number> {
  let saved = 0;

  for (const event of events) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("venue_id", venueId)
      .eq("name", event.name)
      .eq("start_date", event.start_date)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from("events")
        .update({
          description: event.description,
          end_date: event.end_date,
          start_time: event.start_time,
          end_time: event.end_time,
          cost: event.cost,
          cost_min: event.cost_min,
          cost_max: event.cost_max,
          is_free: event.is_free,
          pricing_notes: event.pricing_notes,
          categories: event.categories,
          source_url: event.source_url,
          image_url: event.image_url,
        })
        .eq("id", existing[0].id);

      if (!error) {
        console.log(`  [DB] Updated: "${event.name}" (${event.start_date})`);
        saved++;
      } else {
        console.error(`  [DB] Update failed for "${event.name}": ${error.message}`);
      }
    } else {
      const { error } = await supabase.from("events").insert({
        venue_id: venueId,
        name: event.name,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        start_time: event.start_time,
        end_time: event.end_time,
        cost: event.cost,
        cost_min: event.cost_min,
        cost_max: event.cost_max,
        is_free: event.is_free,
        pricing_notes: event.pricing_notes,
        age_range_min: event.age_range_min,
        age_range_max: event.age_range_max,
        categories: event.categories,
        source_url: event.source_url,
        image_url: event.image_url,
        status: "published",
      });

      if (!error) {
        console.log(`  [DB] Saved: "${event.name}" (${event.start_date})`);
        saved++;
      } else {
        console.error(`  [DB] Insert failed for "${event.name}": ${error.message}`);
      }
    }
  }

  return saved;
}
