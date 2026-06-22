/**
 * Reactivate deactivated venues that are reachable and worth scraping.
 * Then scrape them to see if we get events.
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

// Venues confirmed reachable (HTTP 200) and likely to have events
const REACTIVATE_CANDIDATES = [
  "Cagle's Family Farm",
  "Callanwolde Fine Arts Center",
  "Cobb Energy Performing Arts Centre",
  "Dad's Garage Theatre",
  "Forsyth County Public Library",
  "Fulton County Library System",
  "Georgia Aquarium",
  "Play Street Museum",
  "Roswell Cultural Arts Center",
  "The Art Barn at Morning Glory Farm",
  "The Holler",
];

async function main() {
  console.log(`\n=== Reactivating ${REACTIVATE_CANDIDATES.length} venues ===\n`);

  const reactivatedIds: string[] = [];

  for (const name of REACTIVATE_CANDIDATES) {
    const { data, error } = await supabase
      .from("venues")
      .update({ is_active: true })
      .eq("name", name)
      .eq("is_active", false)
      .select("id, name, scrape_url")
      .single();

    if (data) {
      console.log(`  ✅ Reactivated: ${data.name} (${data.scrape_url || "no URL"})`);
      if (data.scrape_url) reactivatedIds.push(data.id);
    } else {
      console.log(`  ⚠️ Could not reactivate: ${name} (${error?.message || "not found"})`);
    }
  }

  console.log(`\n=== Scraping ${reactivatedIds.length} reactivated venues ===\n`);

  if (reactivatedIds.length > 0) {
    const summary = await runScrapeAll(reactivatedIds, true);

    console.log("\n" + "=".repeat(60));
    console.log("REACTIVATION SCRAPE RESULTS");
    console.log("=".repeat(60) + "\n");

    for (const r of summary.results) {
      const icon = r.events_found > 0 ? "✅" : "❌";
      console.log(`${icon} ${r.venue_name}: ${r.events_found} events (${r.strategy_used || "none"})`);
      if (r.error) console.log(`   Error: ${r.error.slice(0, 80)}`);
    }

    console.log(`\nTotal: ${summary.events_found} events found, ${summary.events_saved} saved`);
  }
}

main().catch(console.error);
