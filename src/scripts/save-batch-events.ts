/**
 * Save scraped events for 6 venues (batch scrape 2026-03-18).
 * Run: npx tsx src/scripts/save-batch-events.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(__dirname, "../../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}
const supabase = createClient(envVars["NEXT_PUBLIC_SUPABASE_URL"], envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

// Venue IDs
const BOOTH = "fc72f9b0-0e14-4f8e-a286-ba33f6269309";
const AQUATIC = "420e2402-88cc-4247-a768-4fb02dcedb7c";
const FARMERS = "31e61033-d40b-492a-ab3b-892b5e5affbe";
const ZOO = "cdb17d15-ce63-450a-b6ba-1f27ea2e33ed";
const AMICALOLA = "7c30b2ef-1e6d-48ae-8052-650f47df703c";

const events: any[] = [
  // === BOOTH WESTERN ART MUSEUM ===
  {
    venue_id: BOOTH, name: "Featured Artist Reception @ Downtown Gallery",
    description: "Featured Artists: Neil Lorenzo, Mary Jo Cox, Virginia Dauth. Reception at the Downtown Gallery.",
    start_date: "2026-03-19", end_date: null, start_time: "3:30 PM", end_time: "5:30 PM",
    cost: null, is_free: false, categories: ["museum", "arts", "education"],
    source_url: "https://boothmuseum.org/event/featured-artist-reception-downtown-gallery/",
    image_url: null, status: "published",
  },
  {
    venue_id: BOOTH, name: "TEEN Home School Friday: Visual Complexity",
    description: "TEEN Home School Friday program exploring visual complexity through art.",
    start_date: "2026-03-20", end_date: null, start_time: "1:00 PM", end_time: "3:00 PM",
    cost: null, is_free: false, categories: ["museum", "arts", "education"],
    source_url: "https://boothmuseum.org/event/teen-home-school-friday-visual-complexity/",
    image_url: null, status: "published",
  },
  {
    venue_id: BOOTH, name: "FREE Family Thursday",
    description: "Free admission on the second Thursday of each month. Family-friendly activities and art exploration.",
    start_date: "2026-04-09", end_date: null, start_time: "4:00 PM", end_time: "8:00 PM",
    cost: "Free", is_free: true, categories: ["museum", "arts", "education", "free"],
    source_url: "https://boothmuseum.org/event/first-free-thursday-64-2/2026-04-09/",
    image_url: null, status: "published",
  },
  {
    venue_id: BOOTH, name: "Art For Lunch: Mark Medley",
    description: "Art For Lunch: Mark Medley - The West in Focus: Indigenous People.",
    start_date: "2026-04-01", end_date: null, start_time: "12:15 PM", end_time: "1:30 PM",
    cost: null, is_free: false, categories: ["museum", "arts", "education"],
    source_url: "https://boothmuseum.org/event/art-for-lunch-mark-medley-the-west-in-focus-indigenous-people/",
    image_url: null, status: "published",
  },

  // === CANTON FARMERS MARKET ===
  {
    venue_id: FARMERS, name: "2026 Canton Farmers Market",
    description: "Open-air market at Brown Park featuring farm-fresh produce, baked goods, specialty foods, garden flowers, and herbs. Every Saturday 9 AM - 12:30 PM.",
    start_date: "2026-05-30", end_date: "2026-08-29", start_time: "9:00 AM", end_time: "12:30 PM",
    cost: "Free", is_free: true, categories: ["market", "outdoor", "free"],
    source_url: "https://explorecantonga.com/events/2026-canton-farmers-market/",
    image_url: null, status: "published",
  },

  // === NORTH GEORGIA ZOO ===
  {
    venue_id: ZOO, name: "Bouncing Babies",
    description: "Spring is baby season at North Georgia Wildlife Park! Come check out all the adorable baby animals. Friday-Sunday only.",
    start_date: "2026-03-01", end_date: "2026-04-30", start_time: "10:00 AM", end_time: "4:00 PM",
    cost: null, is_free: false, categories: ["zoo", "outdoor", "education", "seasonal"],
    source_url: "https://www.northgeorgiazoo.com/park-admission.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "Bunnypalooza",
    description: "Easter weekend! Visit, cuddle and play with bunnies, chicks, and other tiny critters. Great photo opportunity.",
    start_date: "2026-04-04", end_date: "2026-04-05", start_time: "1:00 PM", end_time: "3:00 PM",
    cost: null, is_free: false, categories: ["zoo", "outdoor", "education", "seasonal"],
    source_url: "https://www.northgeorgiazoo.com/spring--easter.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "Mother's Day Celebration",
    description: "Moms get free admission with paying child or adult admission.",
    start_date: "2026-05-10", end_date: null, start_time: "10:00 AM", end_time: "5:00 PM",
    cost: "Free for moms", is_free: false, categories: ["zoo", "outdoor", "education"],
    source_url: "https://www.northgeorgiazoo.com/seasonal-events-and-calender.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "Tadpole Day Camp",
    description: "Day camp for ages 5-8 with animal fun and activities.",
    start_date: "2026-06-01", end_date: "2026-06-02", start_time: "9:00 AM", end_time: "12:00 PM",
    cost: null, is_free: false, age_range_min: 5, age_range_max: 8,
    categories: ["zoo", "outdoor", "education"],
    source_url: "https://www.northgeorgiazoo.com/zoo-day-camp.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "Father's Day Celebration",
    description: "Dads get free admission with paid child or adult admission.",
    start_date: "2026-06-21", end_date: null, start_time: "10:00 AM", end_time: "5:00 PM",
    cost: "Free for dads", is_free: false, categories: ["zoo", "outdoor", "education"],
    source_url: "https://www.northgeorgiazoo.com/seasonal-events-and-calender.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "4th of July Celebration",
    description: "Wild America Tours! Learn about animals that call America home. Special activities for kids.",
    start_date: "2026-07-04", end_date: "2026-07-05", start_time: "10:00 AM", end_time: "5:00 PM",
    cost: null, is_free: false, categories: ["zoo", "outdoor", "education", "seasonal"],
    source_url: "https://www.northgeorgiazoo.com/park-admission.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "Back to School Bash",
    description: "Special night at the Wildlife Park to celebrate the start of another school year!",
    start_date: "2026-08-15", end_date: null, start_time: null, end_time: null,
    cost: null, is_free: false, categories: ["zoo", "outdoor", "education"],
    source_url: "https://www.northgeorgiazoo.com/back-to-school-bashfamily-night.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "NOGAWILD Safari Run",
    description: "Family-friendly run/walk through the park, passing by hundreds of animals. Fundraiser for Creation Encounters.",
    start_date: "2026-09-12", end_date: null, start_time: null, end_time: null,
    cost: null, is_free: false, categories: ["zoo", "outdoor", "sports"],
    source_url: "https://www.northgeorgiazoo.com/safari-runs.html",
    image_url: null, status: "published",
  },
  {
    venue_id: ZOO, name: "Boo at the Zoo",
    description: "The perfect Halloween alternative! Come dressed up for trick or treat in a fun, safe environment.",
    start_date: "2026-10-30", end_date: "2026-11-01", start_time: null, end_time: null,
    cost: null, is_free: false, categories: ["zoo", "outdoor", "seasonal"],
    source_url: "https://www.northgeorgiazoo.com/boo-at-the-zoo.html",
    image_url: null, status: "published",
  },

  // === AMICALOLA FALLS STATE PARK ===
  {
    venue_id: AMICALOLA, name: "Zip Line Canopy Tours",
    description: "Screaming Eagle Aerial Adventure Tour at Amicalola Falls State Park. Year-round adventure in the trees!",
    start_date: "2026-03-18", end_date: "2026-12-31", start_time: null, end_time: null,
    cost: null, is_free: false, categories: ["park", "outdoor"],
    source_url: "https://amicalolafallslodge.com/zip-line-canopy-tours/",
    image_url: null, status: "published",
  },
  {
    venue_id: AMICALOLA, name: "Guided Waterfall Hike",
    description: "Explore trails and come face-to-face with the tallest cascading waterfall east of the Mississippi.",
    start_date: "2026-03-18", end_date: "2026-12-31", start_time: null, end_time: null,
    cost: null, is_free: false, categories: ["park", "outdoor"],
    source_url: "https://amicalolafallslodge.com/waterfall/",
    image_url: null, status: "published",
  },

  // === CHEROKEE COUNTY AQUATIC CENTER ===
  {
    venue_id: AQUATIC, name: "Parents' Night Out - Pool Party",
    description: "Drop off for ages 5-12 with crafts, pizza, games, and swimming at Cherokee County Aquatic Center.",
    start_date: "2026-04-10", end_date: null, start_time: "5:30 PM", end_time: "9:30 PM",
    cost: "$30", is_free: false, age_range_min: 5, age_range_max: 12,
    categories: ["aquatic", "sports"],
    source_url: "https://www.playcherokee.org",
    image_url: null, status: "published",
  },
];

async function main() {
  console.log(`Saving ${events.length} events across 5 venues...\n`);
  let saved = 0, updated = 0, failed = 0;

  for (const event of events) {
    const { data: existing } = await supabase
      .from("events").select("id")
      .eq("venue_id", event.venue_id)
      .eq("name", event.name)
      .eq("start_date", event.start_date)
      .limit(1);

    if (existing && existing.length > 0) {
      const { venue_id, ...updateFields } = event;
      const { error } = await supabase.from("events").update(updateFields).eq("id", existing[0].id);
      if (error) { console.log(`  FAIL: "${event.name}": ${error.message}`); failed++; }
      else { console.log(`  UPDATED: "${event.name}"`); updated++; }
    } else {
      const { error } = await supabase.from("events").insert(event);
      if (error) { console.log(`  FAIL: "${event.name}": ${error.message}`); failed++; }
      else { console.log(`  SAVED: "${event.name}" (${event.start_date})`); saved++; }
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`  New: ${saved}  |  Updated: ${updated}  |  Failed: ${failed}`);
  const { count } = await supabase.from("events").select("*", { count: "exact", head: true });
  console.log(`\nTotal events in database: ${count}`);
}
main();
