/**
 * Live scrape test — fetches real events from Tellus Science Museum
 * and saves them to the Supabase database.
 * 
 * Run with: npx tsx src/scripts/live-scrape-tellus.ts
 */

import { createClient } from "@supabase/supabase-js";
import { parseEventsFromMarkdown } from "../scrapers/apify-scraper";
import * as fs from "fs";
import * as path from "path";

// Load env vars
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

// Tellus venue ID from the database
const TELLUS_VENUE_ID = "9a41f781-3591-4253-8023-d10650fd7dbd";

async function main() {
  // Read markdown from a file if provided, otherwise use inline sample
  const markdownFile = path.join(__dirname, "../../data/tellus-scraped.md");

  let markdown: string;
  if (fs.existsSync(markdownFile)) {
    markdown = fs.readFileSync(markdownFile, "utf-8");
    console.log("Loaded markdown from data/tellus-scraped.md\n");
  } else {
    console.log("No scraped data file found. Create data/tellus-scraped.md first.\n");
    console.log("You can get this data by running the Apify RAG Web Browser");
    console.log("against https://tellusmuseum.org/explore/events/\n");
    process.exit(1);
  }

  // Parse events
  const events = parseEventsFromMarkdown(markdown, ["museum", "education"]);
  console.log(`Parsed ${events.length} events from Tellus Science Museum\n`);

  // Save each event to Supabase
  let saved = 0;
  for (const event of events) {
    // Check for duplicates
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("venue_id", TELLUS_VENUE_ID)
      .eq("name", event.name)
      .eq("start_date", event.start_date)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  SKIP: "${event.name}" (already exists)`);
      saved++;
      continue;
    }

    const { error } = await supabase.from("events").insert({
      venue_id: TELLUS_VENUE_ID,
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
    } else {
      console.log(`  OK: "${event.name}" (${event.start_date})`);
      saved++;
    }
  }

  console.log(`\nDone! ${saved}/${events.length} events saved.\n`);

  // Show total events in database
  const { data: allEvents } = await supabase
    .from("events")
    .select("name, start_date")
    .order("start_date");
  console.log(`Total events in database: ${allEvents?.length || 0}`);
}

main();
