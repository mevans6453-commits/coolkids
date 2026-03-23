/**
 * Batch Scrape Script — Scrapes all zero-event venues
 * Runs locally (no Vercel timeout) with Apify cost tracking
 * 
 * Usage: npx tsx scripts/batch-scrape.ts
 * Options: 
 *   --detect   Force auto-detection (ignore preferred_strategy)
 *   --dry-run  Just list venues, don't scrape
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load env
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

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2";

// Track costs
let totalApifyCalls = 0;
let totalEventsFound = 0;
let totalEventsSaved = 0;

const isDryRun = process.argv.includes("--dry-run");
const forceDetect = process.argv.includes("--detect");

async function getZeroEventVenues() {
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city, scrape_url, preferred_strategy")
    .eq("is_active", true)
    .order("name");

  // Get venues that have events
  const { data: eventVenues } = await supabase
    .from("events")
    .select("venue_id")
    .eq("status", "published");

  const venueIdsWithEvents = new Set((eventVenues || []).map(e => e.venue_id));

  return (venues || []).filter(v => 
    !venueIdsWithEvents.has(v.id) && v.scrape_url
  );
}

async function checkApifyBalance(): Promise<{ credits: number; plan: string } | null> {
  if (!APIFY_TOKEN) return null;
  try {
    const res = await fetch(`${APIFY_BASE}/users/me?token=${APIFY_TOKEN}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      credits: data.data?.proxy?.usageUSD ?? data.data?.plan?.usageCreditsAmount ?? 0,
      plan: data.data?.plan?.id || "unknown",
    };
  } catch {
    return null;
  }
}

async function scrapeWithApify(url: string, venueName: string): Promise<string[]> {
  if (!APIFY_TOKEN) {
    console.log(`  [SKIP] No APIFY_API_TOKEN`);
    return [];
  }

  totalApifyCalls++;
  
  try {
    // Start the RAG Web Browser actor
    const runUrl = `${APIFY_BASE}/acts/apify~rag-web-browser/runs?token=${APIFY_TOKEN}`;
    const response = await fetch(runUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: url,
        maxResults: 1,
        outputFormats: ["markdown"],
      }),
    });

    if (!response.ok) {
      console.log(`  [ERROR] Apify API: ${response.status} ${response.statusText}`);
      return [];
    }

    const runData = await response.json();
    const datasetId = runData?.data?.defaultDatasetId;
    const runId = runData?.data?.id;
    
    if (!datasetId) {
      console.log(`  [ERROR] No dataset ID returned`);
      return [];
    }

    // Wait for actor to finish (poll status)
    let attempts = 0;
    while (attempts < 12) { // Max 60 seconds
      await new Promise(r => setTimeout(r, 5000));
      attempts++;
      
      const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        const status = statusData?.data?.status;
        if (status === "SUCCEEDED") break;
        if (status === "FAILED" || status === "ABORTED") {
          console.log(`  [ERROR] Actor run ${status}`);
          return [];
        }
      }
    }

    // Fetch results
    const datasetUrl = `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
    const datasetResponse = await fetch(datasetUrl);
    if (!datasetResponse.ok) {
      console.log(`  [ERROR] Failed to fetch dataset`);
      return [];
    }

    const items = await datasetResponse.json();
    if (!items || items.length === 0) {
      console.log(`  [EMPTY] No items in dataset`);
      return [];
    }

    const markdown = items[0].markdown || items[0].text || "";
    const lines = markdown.split("\n").filter((l: string) => l.trim());
    
    console.log(`  [OK] Got ${lines.length} lines of content (${markdown.length} chars)`);
    return [markdown];
  } catch (err) {
    console.log(`  [ERROR] ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   CoolKids Batch Scrape — Zero Events   ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const venues = await getZeroEventVenues();
  console.log(`Found ${venues.length} venues with 0 events and scrape URLs\n`);

  if (isDryRun) {
    console.log("DRY RUN — just listing venues:\n");
    for (const v of venues) {
      console.log(`  ${v.name} (${v.city}) — ${v.scrape_url}`);
    }
    return;
  }

  const startTime = Date.now();

  // Trigger scrapes via the existing engine (which handles multi-strategy + save)
  const { runScrapeAll } = await import("../src/scrapers/scrape-engine");

  const venueIds = venues.map(v => v.id);
  console.log(`Starting scrape of ${venueIds.length} venues (forceDetect: ${forceDetect})...\n`);

  const summary = await runScrapeAll(venueIds, true); // Force detect for zero-event venues

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print results
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║              SCRAPE RESULTS              ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Total venues scraped: ${summary.total_venues}`);
  console.log(`║  Successful (got events): ${summary.successful}`);
  console.log(`║  Empty/failed: ${summary.failed}`);
  console.log(`║  Events found: ${summary.events_found}`);
  console.log(`║  Events saved: ${summary.events_saved}`);
  console.log(`║  Duration: ${elapsed}s`);
  console.log("╠══════════════════════════════════════════╣");
  console.log("║           PER-VENUE BREAKDOWN            ║");
  console.log("╠══════════════════════════════════════════╣");

  let apifyAttempts = 0;
  for (const r of summary.results) {
    const status = r.events_found > 0 ? "✅" : "🔴";
    console.log(`║  ${status} ${r.venue_name}`);
    console.log(`║     Strategy: ${r.strategy_used || "none worked"} | Events: ${r.events_found} found, ${r.events_saved} saved`);
    for (const a of r.attempts) {
      if (a.strategy === "apify") apifyAttempts++;
      if (a.error_message) {
        console.log(`║     ${a.strategy}: ${a.status} — ${a.error_message}`);
      }
    }
  }

  // Apify cost estimate
  // RAG Web Browser: ~$0.01-0.05 per run depending on complexity
  const estimatedCost = apifyAttempts * 0.035; // avg $0.035 per run
  
  console.log("╠══════════════════════════════════════════╣");
  console.log("║            💰 COST TRACKING              ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Apify calls made: ${apifyAttempts}`);
  console.log(`║  Est. cost this run: $${estimatedCost.toFixed(2)}`);
  console.log(`║  Cost per venue: $${(estimatedCost / Math.max(apifyAttempts, 1)).toFixed(3)}`);
  console.log(`║  Cost per event found: $${summary.events_found > 0 ? (estimatedCost / summary.events_found).toFixed(3) : "N/A"}`);
  console.log("╚══════════════════════════════════════════╝\n");
}

main().catch(console.error);
