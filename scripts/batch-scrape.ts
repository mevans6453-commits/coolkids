// Load env FIRST before any other imports
import { readFileSync } from "fs";
import { resolve } from "path";
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// Now safe to import scrape engine
import { createClient } from "@supabase/supabase-js";
import { runScrapeAll } from "../src/scrapers/scrape-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Get all active venues with scrape URLs
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .eq("is_active", true)
    .not("scrape_url", "is", null);

  // Get event counts per venue
  const { data: events } = await supabase
    .from("events")
    .select("venue_id")
    .eq("status", "published")
    .neq("event_type", "not_for_kids");

  const venueCounts: Record<string, number> = {};
  for (const e of events || []) {
    venueCounts[e.venue_id] = (venueCounts[e.venue_id] || 0) + 1;
  }

  // Filter to zero-event venues
  const zeroEventVenues = venues?.filter(v => !venueCounts[v.id]) || [];
  console.log(`Found ${zeroEventVenues.length} zero-event venues with scrape URLs:`);
  for (const v of zeroEventVenues) {
    console.log(`  - ${v.name}`);
  }

  const venueIds = zeroEventVenues.map(v => v.id);

  if (venueIds.length === 0) {
    console.log("No zero-event venues to scrape!");
    return;
  }

  console.log(`\nStarting batch scrape of ${venueIds.length} venues...\n`);

  const results = await runScrapeAll(venueIds, true);

  console.log(`\n${"=".repeat(50)}`);
  console.log("BATCH RE-SCRAPE SUMMARY");
  console.log(`  Venues scraped: ${results.total_venues}`);
  console.log(`  Successful: ${results.successful}`);
  console.log(`  Failed/Empty: ${results.failed}`);
  console.log(`  New events found: ${results.events_found}`);
  console.log(`  New events saved: ${results.events_saved}`);

  console.log("\nResults by venue:");
  for (const r of results.results) {
    const icon = r.events_found > 0 ? "✅" : "❌";
    console.log(`  ${icon} ${r.venue_name}: ${r.events_found} found, ${r.events_saved} saved (${r.strategy_used || "none"})`);
  }
  console.log(`${"=".repeat(50)}`);
}

main().catch(console.error);
