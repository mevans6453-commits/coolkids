/**
 * Load events for multiple venues from scraped markdown files.
 * 
 * Run with: npx tsx src/scripts/load-all-events.ts
 */

import { createClient } from "@supabase/supabase-js";
import { parseEventsFromMarkdown } from "../scrapers/parse-utils";
import * as fs from "fs";
import * as path from "path";

// Load env vars from .env.local
const envPath = path.join(__dirname, "../../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
}

const supabase = createClient(
  envVars["NEXT_PUBLIC_SUPABASE_URL"],
  envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
);

// Venues to load — each entry maps a markdown file to a venue ID and categories
const venuesToLoad = [
  {
    venue_id: "fc72f9b0-0e14-4f8e-a286-ba33f6269309",
    venue_name: "Booth Western Art Museum",
    file: "booth-scraped.md",
    categories: ["museum", "arts", "education"],
  },
  {
    venue_id: "e17eebde-93b3-4b49-81ce-23bb1e6fbe3a",
    venue_name: "Gibbs Gardens",
    file: "gibbs-scraped.md",
    categories: ["garden", "outdoor", "seasonal"],
  },
  {
    venue_id: "311e6655-ee10-49f5-981c-ac7ec436fec8",
    venue_name: "Cagle's Family Farm",
    file: "cagles-scraped.md",
    categories: ["farm", "outdoor", "seasonal"],
  },
];

async function main() {
  let totalSaved = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const venue of venuesToLoad) {
    const filePath = path.join(__dirname, "../../data", venue.file);

    if (!fs.existsSync(filePath)) {
      console.log(`\nSKIP: ${venue.venue_name} — file not found: ${venue.file}`);
      continue;
    }

    const markdown = fs.readFileSync(filePath, "utf-8");
    const events = parseEventsFromMarkdown(markdown, venue.categories);

    console.log(`\n--- ${venue.venue_name} (${events.length} events parsed) ---`);

    for (const event of events) {
      // Check for duplicates
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("venue_id", venue.venue_id)
        .eq("name", event.name)
        .eq("start_date", event.start_date)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`  SKIP: "${event.name}" (already exists)`);
        totalSkipped++;
        continue;
      }

      const { error } = await supabase.from("events").insert({
        venue_id: venue.venue_id,
        name: event.name,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        start_time: event.start_time,
        end_time: event.end_time,
        cost: event.cost,
        is_free: event.is_free,
        age_range_min: event.age_range_min,
        age_range_max: event.age_range_max,
        categories: event.categories,
        source_url: event.source_url,
        image_url: event.image_url,
        status: "published",
      });

      if (error) {
        console.log(`  FAIL: "${event.name}": ${error.message}`);
        totalFailed++;
      } else {
        console.log(`  OK: "${event.name}" (${event.start_date})`);
        totalSaved++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`  Saved: ${totalSaved}`);
  console.log(`  Skipped (duplicates): ${totalSkipped}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`========================================\n`);

  // Show all events in the database
  const { data: allEvents } = await supabase
    .from("events")
    .select("name, start_date, venues!inner(name)")
    .order("start_date");

  if (allEvents) {
    console.log(`Total events in database: ${allEvents.length}\n`);
    for (const e of allEvents) {
      const venueName = (e as any).venues?.name || "Unknown";
      console.log(`  ${e.start_date} | ${venueName} | ${e.name}`);
    }
  }
}

main();
