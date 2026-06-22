/**
 * Quick test: hit several venue URLs with the new Chrome User-Agent
 * and try scraping a few with the actual engine.
 * 
 * Run: npx tsx scripts/test-scrape.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testFetch(name: string, url: string) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });
    const size = (await resp.text()).length;
    console.log(`  ${resp.ok ? "✅" : "❌"} ${name}: HTTP ${resp.status} (${(size / 1024).toFixed(0)}KB)`);
    return resp.ok;
  } catch (err: any) {
    console.log(`  ❌ ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  // Step 1: Fetch all active venues from DB
  console.log("\n=== Fetching venue list from database ===\n");
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, scrape_url, preferred_strategy, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("DB error:", error.message);
    return;
  }

  const withUrl = venues?.filter(v => v.scrape_url) || [];
  const withoutUrl = venues?.filter(v => !v.scrape_url) || [];

  console.log(`Total active venues: ${venues?.length}`);
  console.log(`With scrape_url: ${withUrl.length}`);
  console.log(`WITHOUT scrape_url (can't scrape): ${withoutUrl.length}`);
  
  if (withoutUrl.length > 0) {
    console.log(`\n⚠️  Venues missing scrape_url:`);
    for (const v of withoutUrl) {
      console.log(`   - ${v.name}`);
    }
  }

  // Step 2: Test connectivity on a mix of venues
  console.log("\n=== Testing HTTP connectivity with Chrome User-Agent ===\n");
  
  // Pick venues that were known to be problematic + some working ones
  const testVenues = withUrl.slice(0, 20); // Test first 20 alphabetically
  
  let successCount = 0;
  let failCount = 0;
  
  for (const v of testVenues) {
    const ok = await testFetch(v.name, v.scrape_url);
    if (ok) successCount++;
    else failCount++;
  }
  
  console.log(`\n  Summary: ${successCount} reachable, ${failCount} blocked/failed out of ${testVenues.length} tested`);

  // Step 3: Count events per venue
  console.log("\n=== Current event counts by venue ===\n");
  const today = new Date().toISOString().split("T")[0];
  const { data: events } = await supabase
    .from("events")
    .select("venue_id")
    .gte("start_date", today);

  const countByVenue: Record<string, number> = {};
  for (const e of events || []) {
    countByVenue[e.venue_id] = (countByVenue[e.venue_id] || 0) + 1;
  }

  const zeroEventVenues = withUrl.filter(v => !countByVenue[v.id]);
  const hasEventVenues = withUrl.filter(v => countByVenue[v.id]);

  console.log(`Venues with upcoming events: ${hasEventVenues.length}`);
  console.log(`Venues with 0 upcoming events (have scrape_url): ${zeroEventVenues.length}`);
  
  if (zeroEventVenues.length > 0) {
    console.log(`\n🔍 Zero-event venues worth re-scraping:`);
    for (const v of zeroEventVenues) {
      console.log(`   - ${v.name} [strategy: ${v.preferred_strategy || "none"}] → ${v.scrape_url}`);
    }
  }

  console.log("\n=== Done ===\n");
}

main().catch(console.error);
