/**
 * Event Cleanup Script — Approved by Mike
 * 1. Delete junk/broken events
 * 2. Flag adult-only events as not_for_kids  
 * 3. Remove duplicates (keep earliest future instance)
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

let deletedCount = 0;
let flaggedCount = 0;

async function deleteByName(name: string, venue?: string) {
  const query = supabase.from("events").delete().eq("name", name);
  if (venue) {
    // Need to look up venue_id
    const { data: v } = await supabase.from("venues").select("id").ilike("name", `%${venue}%`).limit(1);
    if (v?.[0]) query.eq("venue_id", v[0].id);
  }
  const { error, count } = await query.select("id");
  if (error) console.log(`  ❌ Error deleting "${name}": ${error.message}`);
  else { deletedCount++; }
}

async function deleteByNameLike(pattern: string) {
  const { data, error } = await supabase.from("events").select("id, name").ilike("name", pattern);
  if (error || !data?.length) return;
  for (const e of data) {
    await supabase.from("events").delete().eq("id", e.id);
    deletedCount++;
    console.log(`  🗑️ Deleted: "${e.name}"`);
  }
}

async function flagNotForKids(name: string, reason: string) {
  const { data, error } = await supabase
    .from("events")
    .update({ event_type: "not_for_kids", not_for_kids_reason: reason })
    .ilike("name", `%${name}%`)
    .select("id, name");
  if (error) console.log(`  ❌ Error flagging "${name}": ${error.message}`);
  else if (data?.length) { flaggedCount += data.length; console.log(`  🚫 Flagged: "${data[0].name}" — ${reason}`); }
}

async function main() {
  console.log("=== EVENT CLEANUP ===\n");

  // ============================================
  // STEP 1: Delete junk/broken event names
  // ============================================
  console.log("--- Step 1: Delete Junk/Broken Events ---");

  // North Georgia Zoo junk
  await deleteByNameLike("Friday-Sunday");
  await deleteByNameLike("June 1st%9am%");
  await deleteByNameLike("June 8th%9am%");
  await deleteByNameLike("June 29th%9am%");
  await deleteByNameLike("November 7th-8th%");
  await deleteByNameLike("Saturdays in December%");
  await deleteByNameLike("To apply $1 off%");
  await deleteByNameLike("Open daily during Spring Break%");
  await deleteByNameLike("Open on Columbus Day%");
  await deleteByNameLike("WILD AMERICA TOURS%");

  // Pettit Creek Farms junk
  await deleteByNameLike("Pettit Creek Farms!");

  // Explore Canton / Farmers Market taglines
  await deleteByNameLike("Your guide to Canton%");

  // Atlanta Botanical Garden Gainesville generic
  await deleteByNameLike("Gainesville Events, Classes and Tours%");

  // Fernbank image path as name
  await deleteByNameLike("!/media/%");

  console.log(`\n  Total deleted: ${deletedCount}\n`);

  // ============================================
  // STEP 2: Flag adult-only events
  // ============================================
  console.log("--- Step 2: Flag Adult-Only Events ---");

  // Confirmed adult-only from audit
  await flagNotForKids("City Winery Tour + Tasting", "Alcohol/bar event");
  await flagNotForKids("Brewer's Alley Spring Social", "Alcohol/bar event");
  await flagNotForKids("Chef & Winemaker Dinner", "Alcohol/bar event");
  await flagNotForKids("who says learning can't come with a garnish", "Adult cocktail event");

  // Probably not for kids — from audit review
  await flagNotForKids("SCANDAL! The Bare", "Adult comedy show");
  await flagNotForKids("AARP TAX AIDE", "Senior service — not for kids");
  await flagNotForKids("Active Beginnings for Adults/Seniors", "Adult/senior program");
  await flagNotForKids("ESL/English Classes", "Adult education");
  await flagNotForKids("Mat Yoga - Monday", "Adult fitness class");
  await flagNotForKids("Line Dancing", "Adult activity");
  await flagNotForKids("Yoga Class at Ponce", "Adult fitness class");
  await flagNotForKids("RUMC Job Networking", "Adult job networking");
  await flagNotForKids("Ask The Social Worker", "Adult social services");
  await flagNotForKids("Mahjong Mondays", "Adult activity");
  await flagNotForKids("Educator Soiree", "Adult-only event");
  await flagNotForKids("Beastly Feast Gala", "Adult gala event");
  await flagNotForKids("no chaperones", "Explicitly adult event");
  await flagNotForKids("Primäl Crüe", "Adult tribute concert");
  await flagNotForKids("Talk Dirty", "Adult tribute concert");
  await flagNotForKids("Letterbomb", "Adult tribute concert");
  await flagNotForKids("Purple Madness", "Adult tribute concert");
  await flagNotForKids("ATL Blues Festival", "Adult music festival");
  await flagNotForKids("Turandot", "Adult opera");
  await flagNotForKids("Frida", "Adult dance performance");
  await flagNotForKids("Las Alucines", "Adult show");
  await flagNotForKids("Brit Floyd", "Adult tribute concert");
  await flagNotForKids("David Sedaris", "Adult comedy/author");
  await flagNotForKids("Marisela", "Adult concert");
  await flagNotForKids("Pride Night", "Adult-only event");

  console.log(`\n  Total flagged: ${flaggedCount}\n`);

  // ============================================
  // STEP 3: Remove duplicates (keep earliest future)
  // ============================================
  console.log("--- Step 3: Remove Duplicates ---");

  const today = new Date().toISOString().split("T")[0];
  const { data: allEvents } = await supabase
    .from("events")
    .select("id, name, start_date, venue_id")
    .eq("status", "published")
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  if (allEvents) {
    const seen = new Map<string, { id: string; start_date: string }>();
    let dupeCount = 0;

    for (const e of allEvents) {
      const key = `${e.name.toLowerCase().trim()}|${e.venue_id}`;
      if (seen.has(key)) {
        // This is a duplicate — delete it
        await supabase.from("events").delete().eq("id", e.id);
        dupeCount++;
        console.log(`  📋 Removed dupe: "${e.name}" (${e.start_date}) — kept ${seen.get(key)!.start_date}`);
      } else {
        seen.set(key, { id: e.id, start_date: e.start_date });
      }
    }
    console.log(`\n  Total duplicates removed: ${dupeCount}`);
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  const { count: remaining } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .neq("event_type", "not_for_kids");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`CLEANUP COMPLETE`);
  console.log(`  Junk events deleted: ${deletedCount}`);
  console.log(`  Adult events flagged: ${flaggedCount}`);
  console.log(`  Clean events remaining: ${remaining}`);
  console.log(`${"=".repeat(50)}`);
}

main().catch(console.error);
