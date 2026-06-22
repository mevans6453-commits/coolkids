/**
 * Batch scrape ALL zero-event venues to see how many we can recover.
 * 
 * Run: npx tsx scripts/test-scrape-batch.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import { runScrapeAll } from "../src/scrapers/scrape-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Find all active venues with scrape_url but 0 upcoming events
  const today = new Date().toISOString().split("T")[0];

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, scrape_url, preferred_strategy")
    .eq("is_active", true)
    .not("scrape_url", "is", null);

  const { data: events } = await supabase
    .from("events")
    .select("venue_id")
    .gte("start_date", today);

  const venuesWithEvents = new Set((events || []).map(e => e.venue_id));
  const zeroEventVenues = (venues || []).filter(v => !venuesWithEvents.has(v.id));

  console.log(`\n=== Batch Scrape: ${zeroEventVenues.length} zero-event venues ===\n`);
  for (const v of zeroEventVenues) {
    console.log(`  - ${v.name} [${v.preferred_strategy || "no strategy"}]`);
  }
  console.log();

  const venueIds = zeroEventVenues.map(v => v.id);
  
  // Run with forceDetect to try ALL strategies fresh
  const summary = await runScrapeAll(venueIds, true);

  console.log("\n" + "=".repeat(60));
  console.log("BATCH RESULTS");
  console.log("=".repeat(60) + "\n");

  // Sort: successes first, then failures
  const sorted = [...summary.results].sort((a, b) => b.events_found - a.events_found);

  const recovered: typeof sorted = [];
  const stillFailed: typeof sorted = [];

  for (const r of sorted) {
    if (r.events_found > 0) {
      recovered.push(r);
      console.log(`✅ ${r.venue_name}: ${r.events_found} events (${r.strategy_used})`);
    } else {
      stillFailed.push(r);
    }
  }

  if (stillFailed.length > 0) {
    console.log();
    for (const r of stillFailed) {
      const lastError = r.attempts.find(a => a.error_message)?.error_message || "No events found";
      const strategies = r.attempts.map(a => `${a.strategy}(${a.status})`).join(" → ");
      console.log(`❌ ${r.venue_name}: ${lastError.slice(0, 80)}`);
      console.log(`   Tried: ${strategies}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Recovered: ${recovered.length} venues with ${summary.events_found} total events`);
  console.log(`Still failing: ${stillFailed.length} venues`);
  console.log(`Events saved to DB: ${summary.events_saved}`);
  console.log();
}

main().catch(console.error);
