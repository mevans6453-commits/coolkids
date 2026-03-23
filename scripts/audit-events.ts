/**
 * Test script: Try the Chromium strategy on one venue
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
  // Find Puppetry Arts venue
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, scrape_url")
    .ilike("name", "%puppetry%")
    .limit(1);

  if (!venues || venues.length === 0) {
    console.log("Puppetry Arts venue not found!");
    return;
  }

  const venue = venues[0];
  console.log(`Testing Chromium scrape on: ${venue.name}`);
  console.log(`URL: ${venue.scrape_url}\n`);

  // Import and run the scrape engine for just this venue
  const { runScrapeAll } = await import("../src/scrapers/scrape-engine");
  const summary = await runScrapeAll([venue.id], true); // forceDetect = true

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
