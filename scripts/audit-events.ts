/**
 * Add remaining community-vetted venues from the audit
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

async function main() {
  // First, list all active venues
  const { data: venues } = await supabase
    .from("venues")
    .select("name, city, county, is_active, scrape_url")
    .eq("is_active", true)
    .order("name");

  console.log(`=== CURRENT ACTIVE VENUES: ${venues?.length} ===\n`);
  for (const v of venues || []) {
    const u = v.scrape_url ? "🔗" : "⬜";
    console.log(`  ${u} ${v.name} | ${v.city || "-"}, ${v.county || "-"}`);
  }

  // Now check what's missing from the community-verified audit list
  const communityVenues = [
    "Art Barn", "Tanglewood Farm", "Etowah River Park", "Cherokee Veterans",
    "Canton First Friday", "Hickory Flat", "Reeves House",
    "Cherokee County Aquatic", "Mill on Etowah",
  ];

  console.log(`\n=== AUDIT CHECKLIST ===`);
  for (const name of communityVenues) {
    const match = venues?.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (match) {
      console.log(`  ✅ ${name} → ${match.name}`);
    } else {
      console.log(`  ❌ MISSING: ${name}`);
    }
  }

  // Add any that are missing
  const missing: Array<{
    name: string; city: string; county: string;
    website?: string; scrape_url?: string | null;
    categories: string[]; description: string;
  }> = [];

  // Check if Cherokee Aquatic Center exists
  const hasAquatic = venues?.find(v => v.name.toLowerCase().includes("aquatic"));
  if (!hasAquatic) {
    missing.push({
      name: "Cherokee County Aquatic Center",
      city: "Holly Springs", county: "Cherokee",
      website: "https://playcherokee.org",
      scrape_url: null,
      categories: ["recreation", "sports", "swimming"],
      description: "County aquatic center with pools, splash zones, swim lessons, and water programs. Affordable family fun in Holly Springs.",
    });
  }

  // Check if The Mill on Etowah exists
  const hasMill = venues?.find(v => v.name.toLowerCase().includes("mill on etowah") || v.name.toLowerCase().includes("mill"));
  if (!hasMill) {
    missing.push({
      name: "The Mill on Etowah",
      city: "Canton", county: "Cherokee",
      website: "https://themillonetowah.com",
      scrape_url: null,
      categories: ["entertainment", "shopping", "events"],
      description: "Canton's mixed-use event hub in a renovated cotton mill. Hosts Easter Egg Crawl, community events, restaurants, and shops.",
    });
  }

  // Add additional community venues from research that weren't in the Top 10
  // but are community-verified
  const hasCannon = venues?.find(v => v.name.toLowerCase().includes("cannon park"));
  if (!hasCannon) {
    missing.push({
      name: "Cannon Park Canton",
      city: "Canton", county: "Cherokee",
      website: "https://www.cantonga.gov",
      scrape_url: null,
      categories: ["parks", "outdoor", "community"],
      description: "Downtown Canton park with gazebo. Hosts Pop-Up Storytimes by the library, community events, and a mobile library.",
    });
  }

  const hasWingRock = venues?.find(v => v.name.toLowerCase().includes("wing") && v.name.toLowerCase().includes("rock"));
  if (!hasWingRock) {
    missing.push({
      name: "Wing & Rock Festival",
      city: "Canton", county: "Cherokee",
      website: "https://wingandrockfest.com",
      scrape_url: "https://wingandrockfest.com",
      categories: ["festivals", "food", "music"],
      description: "Annual two-day festival at Etowah River Park — chicken wings, live music, Arts & Crafts Market, Farmers Market, Kid Zone, and wing-eating contests.",
    });
  }

  const hasExploreCanton = venues?.find(v => v.name.toLowerCase().includes("explore canton"));
  // Explore Canton Events is already in DB but may be deactivated — reactivate if so
  if (!hasExploreCanton) {
    const { data: deactivated } = await supabase
      .from("venues")
      .select("id, name, is_active")
      .ilike("name", "%explore canton%")
      .limit(1);
    if (deactivated?.[0] && !deactivated[0].is_active) {
      await supabase.from("venues").update({ is_active: true }).eq("id", deactivated[0].id);
      console.log(`\n  🔄 Reactivated: ${deactivated[0].name}`);
    }
  }

  // Add Canton Farmers Market check
  const hasFarmersMkt = venues?.find(v => v.name.toLowerCase().includes("canton") && v.name.toLowerCase().includes("farmer"));
  if (!hasFarmersMkt) {
    const { data: deactivated } = await supabase
      .from("venues")
      .select("id, name, is_active")
      .ilike("name", "%canton%farmer%")
      .limit(1);
    if (deactivated?.[0] && !deactivated[0].is_active) {
      await supabase.from("venues").update({ is_active: true }).eq("id", deactivated[0].id);
      console.log(`  🔄 Reactivated: ${deactivated[0].name}`);
    }
  }

  // Add the Goddard School Canton (does free community events)
  const hasGoddard = venues?.find(v => v.name.toLowerCase().includes("goddard"));
  if (!hasGoddard) {
    missing.push({
      name: "The Goddard School Canton",
      city: "Canton", county: "Cherokee",
      website: "https://www.goddardschool.com/",
      scrape_url: null,
      categories: ["education", "community"],
      description: "Preschool/early learning center that hosts free community events — Spring Fling & Egg Hunt, family fun days with games, music, and activities.",
    });
  }

  // Add Revolution Church Canton (does Give A Kid A Chance and other free events)
  const hasRevolution = venues?.find(v => v.name.toLowerCase().includes("revolution"));
  if (!hasRevolution) {
    missing.push({
      name: "Revolution Church Canton",
      city: "Canton", county: "Cherokee",
      website: "https://revolution.church",
      scrape_url: null,
      categories: ["community", "charity"],
      description: "Canton church that hosts 'Give A Kid A Chance' (free backpacks & school supplies) and other free family events for Cherokee and Pickens counties.",
    });
  }

  if (missing.length > 0) {
    console.log(`\n=== ADDING ${missing.length} MISSING VENUES ===`);
    for (const v of missing) {
      const { data, error } = await supabase
        .from("venues")
        .insert({ ...v, state: "GA", is_active: true })
        .select("id, name");
      if (error) console.log(`  ❌ ${v.name}: ${error.message}`);
      else console.log(`  ✅ Added: ${data?.[0]?.name} (${data?.[0]?.id})`);
    }
  } else {
    console.log("\n  All community-verified venues already in DB!");
  }

  // Final count
  const { count } = await supabase
    .from("venues")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  console.log(`\n=== FINAL: ${count} active venues ===`);
}

main().catch(console.error);
