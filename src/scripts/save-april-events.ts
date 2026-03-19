/**
 * Save April 2026 events for Gibbs Gardens and Cagle's Family Farm.
 * Scraped via Apify on 2026-03-18.
 *
 * Run with: npx tsx src/scripts/save-april-events.ts
 */

import { createClient } from "@supabase/supabase-js";
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

// Venue IDs
const GIBBS_ID = "e17eebde-93b3-4b49-81ce-23bb1e6fbe3a";
const CAGLES_ID = "311e6655-ee10-49f5-981c-ac7ec436fec8";

// Events active during April 2026 (scraped 2026-03-18)
const events = [
  {
    venue_id: GIBBS_ID,
    name: "Daffodil Festival",
    description: "Voted #1 Flower Festival in the U.S. by USA Today 2025 & 2026. Over 20 million daffodils across 220 acres.",
    start_date: "2026-03-01",
    end_date: "2026-04-14",
    start_time: "9 AM",
    end_time: "4 PM",
    cost: null,
    is_free: false,
    age_range_min: null,
    age_range_max: null,
    categories: ["garden", "outdoor", "seasonal", "festival"],
    source_url: "https://www.gibbsgardens.com/garden-photos/daffodil-gardens/",
    image_url: "https://www.gibbsgardens.com/wp-content/uploads/2022/03/hills-and-dales-2252x1622-1-e1708722129943-1510x1510-c-default.jpg",
    status: "published",
  },
  {
    venue_id: GIBBS_ID,
    name: "Tulip Season",
    description: "Thousands of tulips in full bloom across the gardens.",
    start_date: "2026-03-01",
    end_date: "2026-05-08",
    start_time: "9 AM",
    end_time: "4 PM",
    cost: null,
    is_free: false,
    age_range_min: null,
    age_range_max: null,
    categories: ["garden", "outdoor", "seasonal"],
    source_url: "https://www.gibbsgardens.com/garden-photos/tulips/",
    image_url: "https://www.gibbsgardens.com/wp-content/uploads/2023/11/P1060865-scaled-1510x1510-c-default.jpg",
    status: "published",
  },
  {
    venue_id: GIBBS_ID,
    name: "Azalea Season",
    description: "Spectacular azalea gardens in bloom from spring through early fall.",
    start_date: "2026-04-01",
    end_date: "2026-09-30",
    start_time: "9 AM",
    end_time: "4 PM",
    cost: null,
    is_free: false,
    age_range_min: null,
    age_range_max: null,
    categories: ["garden", "outdoor", "seasonal"],
    source_url: "https://www.gibbsgardens.com/garden-photos/azalea-gardens/",
    image_url: "https://www.gibbsgardens.com/wp-content/uploads/2023/11/Photo-Apr-11-9-57-36-AM-1-scaled-1510x1510-c-default.jpg",
    status: "published",
  },
  {
    venue_id: CAGLES_ID,
    name: "Spring School Field Trips",
    description: "Spring field trips at Cagle's Farm. Farm animals, sheepdog herding demos, pig races, wagon rides, and planting stations. Tuesday-Friday, reservations required. Minimum 50 students.",
    start_date: "2026-04-14",
    end_date: "2026-05-08",
    start_time: "9:30 AM",
    end_time: null,
    cost: "$10",
    is_free: false,
    age_range_min: null,
    age_range_max: null,
    categories: ["farm", "outdoor", "seasonal", "education"],
    source_url: "https://caglesfarm.com/school-field-trips/",
    image_url: "https://caglesfarm.com/wp-content/uploads/2025/07/newHeader2025.webp",
    status: "published",
  },
];

async function main() {
  console.log("Saving 4 April 2026 events...\n");

  let saved = 0;
  let updated = 0;
  let failed = 0;

  for (const event of events) {
    // Check for existing (same venue + name + start_date)
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("venue_id", event.venue_id)
      .eq("name", event.name)
      .eq("start_date", event.start_date)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing
      const { venue_id, ...updateFields } = event;
      const { error } = await supabase
        .from("events")
        .update(updateFields)
        .eq("id", existing[0].id);

      if (error) {
        console.log(`  FAIL (update): "${event.name}": ${error.message}`);
        failed++;
      } else {
        console.log(`  UPDATED: "${event.name}" (${event.start_date})`);
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase.from("events").insert(event);

      if (error) {
        console.log(`  FAIL (insert): "${event.name}": ${error.message}`);
        failed++;
      } else {
        console.log(`  SAVED: "${event.name}" (${event.start_date})`);
        saved++;
      }
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`  New: ${saved}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);

  // Show event count
  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true });
  console.log(`\nTotal events in database: ${count}`);
}

main();
