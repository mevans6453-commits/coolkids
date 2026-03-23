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
import { validateScrapedEvents } from "./parse-utils";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

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
  events_raw: number;
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
      // Chromium needs more time (JS rendering)
      const timeout = strategy.name === "apify-chromium" ? 120000 : 30000;

      try {
        const result = await withTimeout(strategy.scrape(config), timeout, `${strategy.name} strategy`);
        const durationMs = Date.now() - startMs;
        const eventsFound = result.events.length;

        // Pre-validate: only count events that will survive validation (not past, not junk)
        let validCount = eventsFound;
        if (eventsFound > 0) {
          const preValidation = validateScrapedEvents(result.events, config.venue_name);
          validCount = preValidation.valid.length;
        }

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

        if (validCount > 0) {
          winningStrategy = strategy.name;
          winningEvents = result.events;
          break; // Found a winner with events that will survive validation
        } else if (eventsFound > 0) {
          console.log(`[Engine]   ${strategy.name} found ${eventsFound} raw but 0 survived validation — continuing...`);
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

  // Step 3: Validate, filter, then save
  let eventsSaved = 0;
  let eventsFound = winningEvents.length;
  if (winningEvents.length > 0) {
    // Smart validation: reject junk, past, closures; consolidate daily attractions
    const validation = validateScrapedEvents(winningEvents, config.venue_name);

    console.log(`[Engine]   Validation: ${winningEvents.length} raw → ${validation.valid.length} valid, ${validation.rejected.length} rejected`);
    if (validation.consolidated.length > 0) {
      console.log(`[Engine]   Consolidated ${validation.consolidated.length} daily attractions into hours entries`);
    }
    for (const r of validation.rejected.slice(0, 5)) {
      console.log(`[Engine]     Rejected: ${r.reason}`);
    }
    if (validation.rejected.length > 5) {
      console.log(`[Engine]     ... and ${validation.rejected.length - 5} more`);
    }

    // Delete individual-day entries for consolidated attractions
    // (prevents both "hours" and per-day "event" entries existing for same name)
    if (validation.consolidated.length > 0) {
      for (const c of validation.consolidated) {
        const { error } = await getSupabase()
          .from("events")
          .delete()
          .eq("venue_id", config.venue_id)
          .eq("name", c.name)
          .neq("event_type", "hours");

        if (!error) {
          console.log(`[Engine]   Cleaned up individual entries for consolidated: "${c.name}"`);
        }
      }
    }

    eventsFound = validation.valid.length;
    if (validation.valid.length > 0) {
      eventsSaved = await saveEvents(config.venue_id, validation.valid);
    }

    // Update preferred_strategy if it changed
    if (winningStrategy && winningStrategy !== config.preferred_strategy) {
      await updatePreferredStrategy(config.venue_id, winningStrategy);
      console.log(`[Engine]   Updated preferred_strategy to: ${winningStrategy}`);
    }
  }

  console.log(`[Engine]   Result: ${winningEvents.length} raw → ${eventsFound} valid → ${eventsSaved} saved (strategy: ${winningStrategy || "none"})`);

  return {
    venue_id: config.venue_id,
    venue_name: config.venue_name,
    strategy_used: winningStrategy,
    events_found: eventsFound,
    events_saved: eventsSaved,
    events_raw: winningEvents.length,
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
  const { data: dbVenues } = await getSupabase()
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
  const { error } = await getSupabase().from("scrape_runs").insert({
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
  const { error } = await getSupabase()
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
    // Estimate attendance for new events
    const estimatedAttendance = estimateAttendance(event);

    // Check if event should be auto-flagged as not for kids
    const notForKidsCheck = isNotForKids(event);

    // Default pricing fallback
    if (!event.cost && !event.is_free && event.cost_min === null && event.cost_max === null && !event.pricing_notes) {
      event.pricing_notes = "Check venue website for pricing";
    }
    const { data: existing } = await getSupabase()
      .from("events")
      .select("id")
      .eq("venue_id", venueId)
      .eq("name", event.name)
      .eq("start_date", event.start_date)
      .limit(1);

    if (existing && existing.length > 0) {
      // Check if event_type was manually set to something the scraper wouldn't produce
      const { data: current } = await getSupabase()
        .from("events")
        .select("event_type, expected_attendance")
        .eq("id", existing[0].id)
        .single();
      
      // Preserve manual edits: if admin set it to 'not_for_kids', don't overwrite
      // Also auto-flag if keyword blocklist matches
      let preservedEventType = current?.event_type === "not_for_kids" 
        ? "not_for_kids" 
        : notForKidsCheck.flagged ? "not_for_kids" : event.event_type;
      const notForKidsReason = current?.event_type === "not_for_kids"
        ? undefined // Don't overwrite existing reason
        : notForKidsCheck.flagged ? notForKidsCheck.reason : undefined;

      const { error } = await getSupabase()
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
          age_range_min: event.age_range_min,
          age_range_max: event.age_range_max,
          event_type: preservedEventType,
          categories: event.categories,
          source_url: event.source_url,
          image_url: event.image_url,
          // Only update attendance if admin hasn't manually set it
          ...(current?.expected_attendance ? {} : { expected_attendance: estimatedAttendance }),
          // Set reason if auto-flagged
          ...(notForKidsReason ? { not_for_kids_reason: notForKidsReason } : {}),
        })
        .eq("id", existing[0].id);

      if (!error) {
        console.log(`  [DB] Updated: "${event.name}" (${event.start_date})`);
        saved++;
      } else {
        console.error(`  [DB] Update failed for "${event.name}": ${error.message}`);
      }
    } else {
      const { error } = await getSupabase().from("events").insert({
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
        event_type: notForKidsCheck.flagged ? "not_for_kids" : event.event_type,
        not_for_kids_reason: notForKidsCheck.flagged ? notForKidsCheck.reason : null,
        categories: event.categories,
        source_url: event.source_url,
        image_url: event.image_url,
        expected_attendance: estimatedAttendance,
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

// -----------------------------------------------
// Attendance Estimation
// -----------------------------------------------

/**
 * Estimate expected attendance from event properties.
 * Uses keywords, categories, duration, and cost as signals.
 */
function estimateAttendance(event: ScrapedEvent): number {
  const name = (event.name || "").toLowerCase();
  const desc = (event.description || "").toLowerCase();
  const text = `${name} ${desc}`;
  const cats = (event.categories || []).map(c => c.toLowerCase());

  // Calculate multi-day span
  let daySpan = 1;
  if (event.end_date && event.end_date !== event.start_date) {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    daySpan = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  }

  let score = 100; // baseline: small local event

  // Major event keywords (10,000+)
  const majorKeywords = ["air show", "airshow", "festival", "fair ", " fair", "expo", "marathon", "fireworks"];
  if (majorKeywords.some(k => text.includes(k))) score = Math.max(score, 10000);

  // Medium event keywords (5,000+)
  const mediumKeywords = ["concert", "parade", "5k", "10k", "run ", "race", "holiday lights", "light show", "tree lighting"];
  if (mediumKeywords.some(k => text.includes(k))) score = Math.max(score, 5000);

  // Moderate event keywords (1,000+)
  const moderateKeywords = ["market", "farmers market", "craft fair", "car show", "wine", "beer fest", "food truck"];
  if (moderateKeywords.some(k => text.includes(k))) score = Math.max(score, 1000);

  // Category signals
  if (cats.includes("festival")) score = Math.max(score, 5000);
  if (cats.includes("seasonal")) score = Math.max(score, 2000);

  // Multi-day events (3+ days) suggest a bigger deal
  if (daySpan >= 3) score = Math.max(score, 2000);
  if (daySpan >= 7) score = Math.max(score, 5000);

  // High-cost events suggest larger productions
  if (event.cost_max && event.cost_max >= 50) score = Math.max(score, 3000);
  if (event.cost_max && event.cost_max >= 25) score = Math.max(score, 1000);

  // Small / local keywords (stay at baseline or reduce)
  const smallKeywords = ["storytime", "story time", "craft", "class", "workshop", "playdate", "play date", "toddler"];
  if (smallKeywords.some(k => text.includes(k)) && score <= 100) score = 50;

  return score;
}

// -----------------------------------------------
// Not-For-Kids Keyword Blocklist
// -----------------------------------------------

const ADULT_KEYWORDS: [string, string][] = [
  // Alcohol
  ["bar crawl", "bar crawl"], ["pub crawl", "pub crawl"],
  ["brewery tour", "brewery"], ["beer tasting", "beer tasting"],
  ["wine tasting", "wine tasting"], ["wine dinner", "wine dinner"],
  ["cocktail", "cocktail event"], ["bourbon", "bourbon/whiskey event"],
  ["whiskey", "bourbon/whiskey event"], ["happy hour", "happy hour"],
  // 21+
  ["21+", "21+ event"], ["21 and over", "21+ event"],
  ["adults only", "adults only"], ["adult night", "adult night"],
  ["adult league", "adult league"],
  // Adult programs
  ["garden club", "garden club (adult)"], ["book club", "book club (adult)"],
  ["quilting", "quilting group"], ["knitting group", "knitting group"],
  ["aarp", "AARP/senior program"], ["for adults/seniors", "adult/senior program"],
  ["for seniors", "senior program"], ["retirement", "retirement event"],
  ["medicare", "medicare event"], ["estate planning", "estate planning"],
  ["ask the social worker", "adult social services"],
  // Entertainment
  ["comedy night", "adult comedy"], ["stand-up comedy", "adult comedy"],
  ["trivia night", "trivia night"], ["karaoke night", "karaoke"],
  ["drag show", "drag show"], ["open mic night", "open mic"],
  // Business
  ["networking event", "networking"], ["business mixer", "business event"],
  ["chamber of commerce", "chamber of commerce"],
  ["career fair", "career fair"], ["job fair", "job fair"],
  // Dining
  ["brunch", "adult dining"], ["dinner series", "adult dining"],
  // Fitness (adult)
  ["run club", "adult run club"], ["boot camp", "boot camp"],
  // Blood/medical
  ["blood drive", "blood drive"],
  // Financial
  ["tax prep", "tax preparation"], ["financial planning", "financial event"],
];

const KID_OVERRIDES = [
  "family", "kids", "children", "toddler", "youth",
  "all ages", "baby", "infant", "kid-friendly",
  "storytime", "story time", "puppet",
];

/**
 * Check if an event should be auto-flagged as not for kids.
 * Returns { flagged: true, reason } or { flagged: false }.
 */
function isNotForKids(event: ScrapedEvent): { flagged: boolean; reason?: string } {
  const text = `${event.name} ${event.description || ""}`.toLowerCase();

  // Check kid-friendly overrides first
  if (KID_OVERRIDES.some(k => text.includes(k))) {
    return { flagged: false };
  }

  for (const [keyword, reason] of ADULT_KEYWORDS) {
    if (text.includes(keyword)) {
      console.log(`  [FILTER] Auto-flagged "${event.name}" as not for kids (${reason})`);
      return { flagged: true, reason };
    }
  }

  return { flagged: false };
}
