// Fix Canton Theatre URL and re-scrape, plus fix other red venues
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

// URL fixes for venues that are showing red/errors
const FIXES = [
  // Canton Theatre — cantontheatre.org doesn't exist, events are on cantonga.gov
  { match: "Canton Theatre", url: "https://www.cantonga.gov/visitors/special-events", notes: "Canton Theatre events listed on city site" },
  // INK Children's Museum — wrong URL (was Children's Museum of Atlanta)
  { match: "INK Children", url: "https://inkid.org/events", notes: "INK = Imagine, Navigate, Know — Gainesville museum, NOT Children's Museum of Atlanta" },
  // Cumming Fairgrounds — try the specific events/calendar page
  { match: "Cumming Fairgrounds", url: "https://www.cummingfairgrounds.net/calendar/", notes: "Try /calendar/ instead of /events/" },
  // Sandy Springs — try without https (some old sites redirect oddly)
  { match: "Sandy Springs Performing", url: "https://www.sandyspringsperformingarts.org/calendar/", notes: "Try /calendar/ endpoint" },
  // Blue Ridge Community Theater
  { match: "Blue Ridge Community", url: "https://blueridgetheater.net/shows/", notes: "Try /shows/ for current productions" },
  // Atlantic Station — try the specific events page
  { match: "Atlantic Station", url: "https://atlanticstation.com/happenings/", notes: "Try /happenings/ as alternate events page" },
];

async function main() {
  console.log("=== FIX RED VENUES ===\n");

  for (const fix of FIXES) {
    const { data, error } = await supabase
      .from("venues")
      .update({ scrape_url: fix.url })
      .ilike("name", `%${fix.match}%`)
      .select("id, name");

    if (data?.[0]) {
      console.log(`🔗 ${data[0].name} → ${fix.url}`);
      console.log(`   (${fix.notes})\n`);
    } else {
      console.log(`⏭️ Not found: ${fix.match}\n`);
    }
  }

  // Now scrape the fixed venues
  const { runScrapeAll } = await import("../src/scrapers/scrape-engine");

  // Get IDs of the venues we just fixed
  const fixedNames = FIXES.map(f => f.match);
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .eq("is_active", true);

  const fixedVenues = venues?.filter(v => fixedNames.some(f => v.name.toLowerCase().includes(f.toLowerCase()))) || [];

  console.log(`\nScraping ${fixedVenues.length} fixed venues...\n`);

  const results = await runScrapeAll(fixedVenues.map(v => v.id), true);

  console.log(`\n${"=".repeat(50)}`);
  console.log("RESULTS:");
  for (const r of results.results) {
    const icon = r.events_found > 0 ? "✅" : "❌";
    console.log(`  ${icon} ${r.venue_name}: ${r.events_found} found, ${r.events_saved} saved (${r.strategy_used || "none"})`);
    if (r.error) console.log(`     ${r.error}`);
  }
  console.log(`${"=".repeat(50)}`);
}

main().catch(console.error);
