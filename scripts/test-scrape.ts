// Test: scrape Mill on Etowah with the new link-following strategy
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

async function main() {
  // First update the Mill on Etowah URL
  const { data } = await supabase
    .from("venues")
    .update({ scrape_url: "https://www.etowahmill.com/events" })
    .ilike("name", "%Mill on Etowah%")
    .select("id, name, scrape_url");
  
  console.log("Updated:", data?.[0]?.name, "→", data?.[0]?.scrape_url);

  // Now import and run the scraper
  const { runScrapeAll } = await import("../src/scrapers/scrape-engine");
  
  if (!data?.[0]?.id) {
    console.log("Could not find Mill on Etowah venue");
    return;
  }

  console.log("\nScraping Mill on Etowah...\n");
  const results = await runScrapeAll([data[0].id], true);

  console.log("\n=== RESULTS ===");
  for (const r of results.results) {
    console.log(`${r.venue_name}: ${r.events_found} found, ${r.events_saved} saved (${r.strategy_used || "none"})`);
    if (r.error) console.log(`  Error: ${r.error}`);
    for (const a of r.attempts) {
      console.log(`  Strategy ${a.strategy}: ${a.events_found} found, ${a.status}`);
    }
  }
}

main().catch(console.error);
