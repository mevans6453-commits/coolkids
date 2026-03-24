// Full venue scraping audit: what works, what doesn't, and why
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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  // Get all active venues
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, scrape_url, preferred_strategy, is_active")
    .eq("is_active", true)
    .order("name");

  // Get event counts per venue
  const { data: events } = await supabase
    .from("events")
    .select("venue_id")
    .eq("status", "published");

  const counts: Record<string, number> = {};
  for (const e of events || []) {
    counts[e.venue_id] = (counts[e.venue_id] || 0) + 1;
  }

  // Get latest scrape run per venue
  const { data: runs } = await supabase
    .from("scrape_runs")
    .select("venue_id, strategy, status, error_message, events_found, run_date")
    .order("run_date", { ascending: false });

  const latestRun: Record<string, any> = {};
  for (const r of runs || []) {
    if (!latestRun[r.venue_id]) latestRun[r.venue_id] = r;
  }

  // Categorize
  const working: any[] = [];
  const noEvents: any[] = [];
  const noUrl: any[] = [];
  const errors: any[] = [];

  for (const v of venues || []) {
    const eventCount = counts[v.id] || 0;
    const run = latestRun[v.id];
    const entry = {
      name: v.name,
      url: v.scrape_url ? v.scrape_url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 50) : null,
      strategy: v.preferred_strategy || "—",
      events: eventCount,
      lastStatus: run?.status || "never",
      lastError: run?.error_message || null,
    };

    if (!v.scrape_url) {
      noUrl.push(entry);
    } else if (eventCount > 0) {
      working.push(entry);
    } else if (run?.status === "error") {
      errors.push(entry);
    } else {
      noEvents.push(entry);
    }
  }

  // Output as structured report
  console.log("=== VENUE SCRAPING AUDIT ===\n");
  
  console.log(`\n## ✅ WORKING (${working.length} venues, have events)`);
  console.log("Name | Strategy | Events | URL");
  console.log("-".repeat(100));
  for (const v of working.sort((a, b) => b.events - a.events)) {
    console.log(`${v.name.padEnd(45)} | ${v.strategy.padEnd(15)} | ${String(v.events).padEnd(5)} | ${v.url}`);
  }

  console.log(`\n## 🔴 ERRORS (${errors.length} venues, scrape failed)`);
  console.log("Name | Strategy | Error | URL");
  console.log("-".repeat(100));
  for (const v of errors) {
    console.log(`${v.name.padEnd(45)} | ${v.strategy.padEnd(15)} | ${(v.lastError || "unknown").slice(0, 30).padEnd(30)} | ${v.url}`);
  }

  console.log(`\n## 🟡 NO EVENTS (${noEvents.length} venues, scrape ran but found nothing)`);
  console.log("Name | Strategy | Last Status | URL");
  console.log("-".repeat(100));
  for (const v of noEvents) {
    console.log(`${v.name.padEnd(45)} | ${v.strategy.padEnd(15)} | ${v.lastStatus.padEnd(12)} | ${v.url}`);
  }

  console.log(`\n## ⬜ NO URL (${noUrl.length} venues, no scrape URL set)`);
  for (const v of noUrl) {
    console.log(`  ${v.name}`);
  }

  console.log(`\n## SUMMARY`);
  console.log(`  Working: ${working.length} venues (${working.reduce((s, v) => s + v.events, 0)} events)`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  No events: ${noEvents.length}`);
  console.log(`  No URL: ${noUrl.length}`);
  console.log(`  Total active: ${venues?.length}`);
}
main().catch(console.error);
