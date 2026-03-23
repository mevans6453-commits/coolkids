/**
 * Test scrape on Chattahoochee Nature Center with the new WordPress parser
 */
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

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  // First, update the scrape URL
  const { error: updateErr } = await supabase
    .from("venues")
    .update({ scrape_url: "https://chattnaturecenter.org/all-events/" })
    .ilike("name", "%chattahoochee nature%");
  
  if (updateErr) {
    console.log("Error updating URL:", updateErr.message);
    return;
  }
  console.log("✅ Updated scrape URL to /all-events/\n");

  // Find the venue
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, scrape_url")
    .ilike("name", "%chattahoochee nature%")
    .limit(1);

  if (!venues || venues.length === 0) {
    console.log("Venue not found!");
    return;
  }

  const venue = venues[0];
  console.log(`Scraping: ${venue.name}`);
  console.log(`URL: ${venue.scrape_url}\n`);

  const { runScrapeAll } = await import("../src/scrapers/scrape-engine");
  const summary = await runScrapeAll([venue.id], true);

  console.log(`\n=== RESULTS ===`);
  for (const r of summary.results) {
    console.log(`Strategy used: ${r.strategy_used}`);
    console.log(`Events found: ${r.events_found}`);
    console.log(`Events saved: ${r.events_saved}`);
    for (const a of r.attempts) {
      console.log(`  ${a.strategy}: ${a.status} (${a.events_found} events, ${a.duration_ms}ms)`);
      if (a.error_message) console.log(`    Error: ${a.error_message}`);
    }
  }
}

test().catch(console.error);
