// COMPREHENSIVE CLEANUP: delete junk, fix names, hours→event, reassign categories, set indoor/outdoor
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

// --- NEW CATEGORIES ---
type Category = "hands-on-art" | "animals-nature" | "shows-performances" | "science-stem" |
  "festivals-fairs" | "seasonal-holidays" | "active-sports" | "markets-shopping" |
  "storytime-learning" | "family-fun";

// Keyword-based auto-categorization
function categorize(name: string, desc: string, venueName: string): Category[] {
  const text = `${name} ${desc} ${venueName}`.toLowerCase();
  const cats: Set<Category> = new Set();

  // Hands-On Art
  if (/\b(watercolor|painting|acrylic|pottery|wheel throwing|felting|card making|doodling|art class|craft|mixed.media|art workshop|oil workshop|container class|salt painting)\b/i.test(text)) cats.add("hands-on-art");

  // Animals & Nature
  if (/\b(zoo|animal|bird|nature walk|forest|wildlife|raptor|nature center|botanical|garden|plant sale|orchid|fireflies|flora|fauna)\b/i.test(text)) cats.add("animals-nature");

  // Shows & Performances
  if (/\b(theater|theatre|musical|opera|improv|comedy|concert|tribute|band|live music|movie|drive-in|puppet|show|ensemble|performance|jazz|percussion|wind ensemble|film)\b/i.test(text)) cats.add("shows-performances");

  // Science & STEM
  if (/\b(science|stem|steam|rocket|lab|experiment|sky watch|telescope|astrono|chemistry|code|forensic|model rr|railroad|locomotive|train|scenic railroad)\b/i.test(text)) cats.add("science-stem");

  // Festivals & Fairs
  if (/\b(fest|fair|festival|cruise.in|expo|gala|block party|extravaganza|air show)\b/i.test(text)) cats.add("festivals-fairs");

  // Seasonal & Holidays
  if (/\b(easter|christmas|santa|halloween|4th of july|independence day|fireworks|pumpkin|corn maze|holiday|egg hunt|boo at|mother.s day|pride night|new year)\b/i.test(text)) cats.add("seasonal-holidays");

  // Active & Sports
  if (/\b(5k|run|hike|hiking|yoga|splash|swim|aquatic|cornhole|pickleball|mini golf|skyhike|zipline|zip line|skate|skating|bike|kayak)\b/i.test(text)) cats.add("active-sports");

  // Markets & Shopping
  if (/\b(market|farmer|makers|pop.up|sale|shopping|flower truck|sidewalk sale)\b/i.test(text)) cats.add("markets-shopping");

  // Storytime & Learning
  if (/\b(story time|storytime|reading|book|lecture|writing|homeschool|gallery talk|author|conversation|study hall|workshop|class)\b/i.test(text)) cats.add("storytime-learning");

  // Family Fun (catch-all for social/game events)
  if (/\b(bingo|trivia|game|family|kids zone|play|tea with|karaoke|line dancing|pajama|stay . play|sensory|members only night|camp)\b/i.test(text)) cats.add("family-fun");

  // If nothing matched, default to family-fun
  if (cats.size === 0) cats.add("family-fun");

  return Array.from(cats);
}

// Indoor/outdoor classification based on venue
function classifySetting(venueName: string, eventName: string, desc: string): "indoor" | "outdoor" | "both" {
  const text = `${venueName} ${eventName} ${desc}`.toLowerCase();

  // Definite outdoor
  if (/\b(park|farm|orchard|botanical garden|nature center|air show|drive-in|corn maze|splash|outdoor|5k|run|hike)\b/.test(text)) {
    if (/\b(museum|theater|theatre|indoor|gallery)\b/.test(text)) return "both";
    return "outdoor";
  }

  // Definite indoor
  if (/\b(museum|theater|theatre|library|gallery|aquarium|puppet|arts center|cinema|indoor)\b/.test(text)) {
    if (/\b(outdoor|forest|hike|nature walk)\b/.test(text)) return "both";
    return "indoor";
  }

  // Venues that are both
  if (/\b(zoo|stone mountain|avalon|ponce city|market|mill on etowah)\b/.test(text)) return "both";

  return "both"; // Default uncertain
}

async function main() {
  // === STEP 1: Delete junk ===
  const JUNK_IDS = [
    // Description-as-name events
    "96e7437d-52ce-4082-9b17-d752e75720e1", // "Mix, muddle, and discover..." — already marked not_for_kids, delete
    // Generic/not-event names
    "6529d410-215d-46d3-89f2-6c6bfd277cf7", // "Friday Gallery Talk" — keep, it's real
    // Actual junk
    // Forsyth County "Jan - April 2026"
    // Gainesville "Events, Classes and Tours"
    // "The Arts are our heartbeaT"
    // "Spotlight Program"
    // "To Be Announced" x2
    // "Crawl, fly and flutter..."
    // "Enjoy a guided hike..."
    // "Weekend Activities"
  ];
  
  // Find by name for the ones I don't have IDs for
  const junkNames = [
    "Jan - April 2026",
    "Gainesville Events, Classes and Tours",
    "The Arts are our heartbeaT",
    "Spotlight Program",
    "To Be Announced",
    "Crawl, fly and flutter through science, discovery and fun!",
    "Enjoy a guided hike through Fernbank Forest.",
    "Weekend Activities",
  ];

  let deleted = 0;
  for (const name of junkNames) {
    const { data } = await supabase.from("events").delete().eq("name", name).select("id");
    deleted += (data?.length || 0);
  }
  console.log(`🗑️ Deleted ${deleted} junk events by name`);

  // Delete duplicates (keep first occurrence)
  const dupNames = [
    { name: "Spring Gallery", venue: "Chattahoochee Nature Center" },
    { name: "River Roots Science Stations", venue: "Chattahoochee Nature Center" },
    { name: "The Chattahoochee: Re-Imagine our River – Film Showings", venue: "Chattahoochee Nature Center" },
  ];

  for (const { name } of dupNames) {
    const { data } = await supabase.from("events").select("id").eq("name", name).order("created_at");
    if (data && data.length > 1) {
      // Delete all but the first
      for (let i = 1; i < data.length; i++) {
        await supabase.from("events").delete().eq("id", data[i].id);
        deleted++;
      }
    }
  }
  // Also remove duplicate Primal Crue at City of Cumming (exists at Cumming City Center too)
  const { data: primalDupe } = await supabase.from("events").select("id").ilike("name", "%Primal Crue%Tribute to Motley%City of Cumming%");
  // Just delete from "City of Cumming Events" venue — find the venue ID
  const { data: cumVenue } = await supabase.from("venues").select("id").eq("name", "City of Cumming Events").maybeSingle();
  if (cumVenue) {
    const { data: d } = await supabase.from("events").delete().eq("venue_id", cumVenue.id).select("id");
    deleted += (d?.length || 0);
  }
  console.log(`🗑️ Total deleted after dupes: ${deleted}`);

  // === STEP 2: Fix long names ===
  const nameFixes = [
    { old: "Pettit Creek Farms' annual Independence Day Celebration & Fireworks Show!", new: "Independence Day Celebration & Fireworks" },
    { old: "Santa and his elves will call Wednesday, December 10 between 5:00 PM – 7:00 PM.", new: "Santa Phone Calls" },
  ];
  for (const fix of nameFixes) {
    const { data } = await supabase.from("events").update({ name: fix.new }).eq("name", fix.old).select("id");
    if (data?.length) console.log(`✏️ Fixed: "${fix.old}" → "${fix.new}"`);
  }

  // === STEP 3: Convert all hours → event ===
  const { data: hoursFixed } = await supabase.from("events").update({ event_type: "event" }).eq("event_type", "hours").select("id");
  console.log(`📅 Converted ${hoursFixed?.length || 0} hours → event`);

  // === STEP 4: Reassign categories to ALL events ===
  const { data: allEvents } = await supabase
    .from("events")
    .select("id, name, description, venue_id")
    .eq("status", "published");
  
  const { data: venues } = await supabase.from("venues").select("id, name").eq("is_active", true);
  const venueMap: Record<string, string> = {};
  for (const v of venues || []) venueMap[v.id] = v.name;

  let catUpdated = 0;
  for (const e of allEvents || []) {
    const venueName = venueMap[e.venue_id] || "";
    const newCats = categorize(e.name, e.description || "", venueName);
    const setting = classifySetting(venueName, e.name, e.description || "");
    
    const { data } = await supabase.from("events")
      .update({ categories: newCats })
      .eq("id", e.id)
      .select("id");
    if (data?.length) catUpdated++;
  }
  console.log(`🏷️ Re-categorized ${catUpdated} events`);

  // === Count ===
  const { count } = await supabase.from("events").select("id", { count: "exact" }).eq("status", "published");
  console.log(`\n✅ DONE. Remaining events: ${count}`);
  
  // Show category distribution
  const { data: final } = await supabase.from("events").select("categories").eq("status", "published");
  const catCount: Record<string, number> = {};
  for (const e of final || []) {
    for (const c of e.categories || []) {
      catCount[c] = (catCount[c] || 0) + 1;
    }
  }
  console.log("\nNew category distribution:");
  for (const [cat, cnt] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${cnt}`);
  }
}

main().catch(console.error);
