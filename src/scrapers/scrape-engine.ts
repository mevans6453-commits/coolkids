/**
 * Scrape Engine — orchestrates scraping across all venues.
 * 
 * This is the "brain" of the scraper system. It:
 * 1. Loads venue configs (which venues to scrape and how)
 * 2. Runs the appropriate scraper for each venue
 * 3. Saves the discovered events to Supabase
 * 4. Returns a summary of what happened
 */

import { createClient } from "@supabase/supabase-js";
import type { ScrapeResult, VenueConfig } from "./base-scraper";
import { scrapeWithApify } from "./apify-scraper";
import { getAllVenueConfigs } from "./venues";

// Create Supabase client for saving events
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ScrapeRunSummary = {
  started_at: string;
  finished_at: string;
  total_venues: number;
  successful: number;
  failed: number;
  events_found: number;
  events_saved: number;
  results: ScrapeResult[];
};

/**
 * Run scrapers for all configured venues (or a specific list)
 */
export async function runScrapeAll(
  venueIds?: string[]
): Promise<ScrapeRunSummary> {
  const startedAt = new Date().toISOString();
  const allConfigs = getAllVenueConfigs();

  // Filter to specific venues if requested
  const configs = venueIds
    ? allConfigs.filter((c) => venueIds.includes(c.venue_id))
    : allConfigs;

  console.log(`\n=== Starting scrape run: ${configs.length} venues ===\n`);

  const results: ScrapeResult[] = [];
  let eventsFound = 0;
  let eventsSaved = 0;
  let successful = 0;
  let failed = 0;

  // Scrape each venue one at a time (to avoid rate limits)
  for (const config of configs) {
    const result = await scrapeVenue(config);
    results.push(result);

    if (result.error) {
      failed++;
    } else {
      successful++;
      eventsFound += result.events.length;

      // Save events to the database
      const saved = await saveEvents(result);
      eventsSaved += saved;
    }

    // Small delay between venues to be polite
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const finishedAt = new Date().toISOString();

  console.log(`\n=== Scrape run complete ===`);
  console.log(`  Venues: ${successful} OK, ${failed} failed`);
  console.log(`  Events: ${eventsFound} found, ${eventsSaved} saved\n`);

  return {
    started_at: startedAt,
    finished_at: finishedAt,
    total_venues: configs.length,
    successful,
    failed,
    events_found: eventsFound,
    events_saved: eventsSaved,
    results,
  };
}

/**
 * Scrape a single venue using the configured method
 */
async function scrapeVenue(config: VenueConfig): Promise<ScrapeResult> {
  switch (config.scrape_method) {
    case "apify":
      return scrapeWithApify(config);
    case "firecrawl":
      // Firecrawl not available yet — fall back to Apify
      console.log(`[Engine] Firecrawl unavailable, using Apify for ${config.venue_name}`);
      return scrapeWithApify(config);
    case "manual":
      return {
        venue_id: config.venue_id,
        venue_name: config.venue_name,
        events: [],
        error: "Manual venues are not auto-scraped",
        scraped_at: new Date().toISOString(),
      };
    default:
      return {
        venue_id: config.venue_id,
        venue_name: config.venue_name,
        events: [],
        error: `Unknown scrape method: ${config.scrape_method}`,
        scraped_at: new Date().toISOString(),
      };
  }
}

/**
 * Save scraped events to the Supabase database.
 * Uses upsert logic — if an event with the same name + date + venue
 * already exists, it gets updated instead of duplicated.
 */
async function saveEvents(result: ScrapeResult): Promise<number> {
  let saved = 0;

  for (const event of result.events) {
    // Check if this event already exists (same venue + name + date)
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("venue_id", result.venue_id)
      .eq("name", event.name)
      .eq("start_date", event.start_date)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing event
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
      // Insert new event
      const { error } = await supabase.from("events").insert({
        venue_id: result.venue_id,
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
