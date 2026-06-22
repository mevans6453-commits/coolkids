/**
 * Actually run the scraper on a few zero-event venues
 * to test if the fixes help.
 * 
 * Run: npx tsx scripts/test-scrape-live.ts
 */

// Need to set up env before any imports that use it
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { runScrapeAll } from "../src/scrapers/scrape-engine";

// Pick 5 diverse venues to test
const TEST_VENUES = [
  // JSON-LD strategy venues
  "9a41f781-3591-4253-8023-d10650fd7dbd", // Tellus Science Museum (jsonld, has events usually)
  
  // HTML strategy venues  
  "fc72f9b0-0e14-4f8e-a286-ba33f6269309", // Booth Western Art Museum
  
  // Zero-event venues to re-test
  "311e6655-ee10-49f5-981c-ac7ec436fec8", // Cagle's Family Farm
];

async function main() {
  console.log("\n=== Live Scrape Test (3 venues) ===\n");
  console.log("Testing with Chrome User-Agent + retry logic + relaxed dedup\n");

  const summary = await runScrapeAll(TEST_VENUES, true); // forceDetect = true to try all strategies

  console.log("\n=== RESULTS ===\n");
  for (const r of summary.results) {
    const status = r.events_found > 0 ? "✅" : "❌";
    console.log(`${status} ${r.venue_name}`);
    console.log(`   Strategy: ${r.strategy_used || "none"}`);
    console.log(`   Events found: ${r.events_found}, saved: ${r.events_saved}`);
    if (r.error) console.log(`   Error: ${r.error}`);
    console.log(`   Attempts: ${r.attempts.map(a => `${a.strategy}(${a.status})`).join(" → ")}`);
    console.log();
  }

  console.log(`Total: ${summary.events_found} events found, ${summary.events_saved} saved`);
  console.log(`Venues: ${summary.successful} succeeded, ${summary.failed} failed`);
}

main().catch(console.error);
