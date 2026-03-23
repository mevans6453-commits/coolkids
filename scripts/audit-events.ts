/**
 * Venue Audit Cleanup — Add missing community venues, deactivate bad fits
 */
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

async function addVenueIfNotExists(venue: {
  name: string; city: string; county: string; state: string;
  website?: string; scrape_url?: string | null;
  categories: string[]; description: string;
}) {
  const { data: existing } = await supabase
    .from("venues")
    .select("id, name")
    .ilike("name", `%${venue.name.split(" ").slice(0, 2).join(" ")}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`  ⏭️  Already exists: ${existing[0].name}`);
    return;
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      ...venue,
      state: "GA",
      is_active: true,
    })
    .select("id, name");

  if (error) console.log(`  ❌ Error: ${error.message}`);
  else console.log(`  ✅ Added: ${data?.[0]?.name} (${data?.[0]?.id})`);
}

async function deactivateVenue(namePart: string, reason: string) {
  const { data, error } = await supabase
    .from("venues")
    .update({ is_active: false })
    .ilike("name", `%${namePart}%`)
    .select("id, name");

  if (error) console.log(`  ❌ Error: ${error.message}`);
  else if (data?.length) console.log(`  🚫 Deactivated: ${data[0].name} — ${reason}`);
  else console.log(`  ⏭️  Not found: ${namePart}`);
}

async function main() {
  console.log("=== VENUE AUDIT CLEANUP ===\n");

  // ============================================
  // STEP 1: Add community-verified local venues
  // ============================================
  console.log("--- Step 1: Add Missing Community Venues ---");

  await addVenueIfNotExists({
    name: "Etowah River Park",
    city: "Canton", county: "Cherokee", state: "GA",
    website: "https://www.cantonga.gov/parks-recreation/etowah-river-park",
    scrape_url: null, // Events come from cantonga.gov — no dedicated calendar
    categories: ["parks", "outdoor", "festivals"],
    description: "Canton's largest park — splash pad, playground, walking trails. Hosts Wing & Rock Fest, Riverfest, Eggstravaganza, and other community festivals.",
  });

  await addVenueIfNotExists({
    name: "Cherokee Veterans Park",
    city: "Canton", county: "Cherokee", state: "GA",
    website: "https://playcherokee.org",
    scrape_url: null, // Events come from playcherokee.org (already scraping Cherokee County Parks)
    categories: ["parks", "outdoor", "recreation"],
    description: "Major Cherokee County park — indoor rec center, rock climbing wall, playgrounds, walking paths. Hosts Flashlight Egg Hunt, Touch-A-Truck, and Christmas lights.",
  });

  await addVenueIfNotExists({
    name: "The Mill on Etowah",
    city: "Canton", county: "Cherokee", state: "GA",
    website: "https://www.themillonetowah.com",
    scrape_url: null, // No dedicated events calendar found
    categories: ["entertainment", "shopping", "events"],
    description: "Canton's mixed-use event hub in a renovated cotton mill. Hosts Easter Egg Crawl, community events, restaurants, and shops.",
  });

  await addVenueIfNotExists({
    name: "Canton First Friday",
    city: "Canton", county: "Cherokee", state: "GA",
    website: "https://www.explorecantonga.com",
    scrape_url: null, // Seasonal May-Oct, listed on explorecantonga.com
    categories: ["festivals", "community", "outdoor"],
    description: "Downtown Canton's monthly block party (May-October). Live music, food trucks, vendors, and family fun on the streets of historic downtown.",
  });

  await addVenueIfNotExists({
    name: "Cherokee County Aquatic Center",
    city: "Holly Springs", county: "Cherokee", state: "GA",
    website: "https://playcherokee.org",
    scrape_url: null, // Programs listed on playcherokee.org
    categories: ["recreation", "sports", "swimming"],
    description: "County aquatic center with pools, splash zones, swim lessons, and water programs. Affordable family fun in Holly Springs.",
  });

  await addVenueIfNotExists({
    name: "Hickory Flat Public Library",
    city: "Canton", county: "Cherokee", state: "GA",
    website: "https://sequoyahregionallibrary.com",
    scrape_url: "https://sequoyahregionallibrary.evanced.info/signup/calendar",
    categories: ["library", "education", "storytime"],
    description: "Part of the Sequoyah Regional Library System. Free Family Storytime, kids programs, and summer reading events.",
  });

  await addVenueIfNotExists({
    name: "Reeves House Visual Arts Center",
    city: "Woodstock", county: "Cherokee", state: "GA",
    website: "https://www.reeveshouse.org",
    scrape_url: "https://www.reeveshouse.org/events",
    categories: ["arts", "gallery", "education"],
    description: "Free community art gallery in Woodstock. Rotating exhibits, art workshops, community events.",
  });

  // ============================================
  // STEP 2: Deactivate bad-fit venues
  // ============================================
  console.log("\n--- Step 2: Deactivate Bad-Fit Venues ---");

  await deactivateVenue("Cobb Energy", "45 min from Canton, almost entirely adult shows (opera, tribute concerts, comedy)");
  await deactivateVenue("Callanwolde", "~1 hr from Canton, adult-focused fine arts, very few kids events");

  // Also delete the leftover adult events from these venues
  console.log("\n--- Step 3: Delete events from deactivated venues ---");
  const { data: deactivated } = await supabase
    .from("venues")
    .select("id, name")
    .eq("is_active", false);

  if (deactivated) {
    for (const v of deactivated) {
      const { data: events } = await supabase
        .from("events")
        .delete()
        .eq("venue_id", v.id)
        .select("id");
      if (events?.length) {
        console.log(`  🗑️ Deleted ${events.length} events from deactivated venue: ${v.name}`);
      }
    }
  }

  // ============================================
  // FINAL: Count remaining
  // ============================================
  const { count: activeVenues } = await supabase
    .from("venues")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: totalEvents } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .neq("event_type", "not_for_kids");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`VENUE AUDIT CLEANUP COMPLETE`);
  console.log(`  Active venues: ${activeVenues}`);
  console.log(`  Clean events: ${totalEvents}`);
  console.log(`${"=".repeat(50)}`);
}

main().catch(console.error);
