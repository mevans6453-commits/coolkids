// Test link-following on multiple promising zero-event venues
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

// Test specific venues by name
const TEST_VENUES = [
  "Atlanta History Center",
  "Canton Theatre",
  "Forsyth County Public Library",
  "City of Woodstock",
  "Children's Museum",
  "Sequoyah Regional",
  "Sandy Springs",
  "Cumming Fairgrounds",
  "Blue Ridge Community",
  "Atlantic Station",
  "High Museum",
  "Center for Puppetry",
];

async function main() {
  const { runScrapeAll } = await import("../src/scrapers/scrape-engine");

  // Find venue IDs
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, scrape_url")
    .eq("is_active", true);

  const toTest = venues?.filter(v =>
    TEST_VENUES.some(t => v.name.toLowerCase().includes(t.toLowerCase()))
  ) || [];

  console.log(`Testing ${toTest.length} venues with link-following:\n`);
  for (const v of toTest) {
    console.log(`  ${v.name} → ${v.scrape_url}`);
  }

  const venueIds = toTest.map(v => v.id);
  console.log(`\n${"=".repeat(50)}`);

  const results = await runScrapeAll(venueIds, true);

  console.log(`\n${"=".repeat(50)}`);
  console.log("TEST RESULTS SUMMARY\n");

  const successes: string[] = [];
  const failures: string[] = [];

  for (const r of results.results) {
    const icon = r.events_found > 0 ? "✅" : "❌";
    console.log(`${icon} ${r.venue_name}: ${r.events_found} found, ${r.events_saved} saved (${r.strategy_used || "none"})`);
    if (r.events_found > 0) successes.push(`${r.venue_name} (${r.events_found} events, strategy: ${r.strategy_used})`);
    else failures.push(r.venue_name);

    // Show strategy attempts
    for (const a of r.attempts) {
      if (a.events_found > 0 || a.error_message) {
        console.log(`   ${a.strategy}: ${a.events_found} found (${a.status})${a.error_message ? ` — ${a.error_message}` : ""}`);
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`SUCCESSES: ${successes.length}`);
  for (const s of successes) console.log(`  ✅ ${s}`);
  console.log(`FAILURES: ${failures.length}`);
  for (const f of failures) console.log(`  ❌ ${f}`);
  console.log(`${"=".repeat(50)}`);
}

main().catch(console.error);
