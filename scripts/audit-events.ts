/**
 * Add Art Barn + Tanglewood Farm with correct schema
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
  // Add Art Barn
  const { data: ab, error: abErr } = await supabase.from("venues").insert({
    name: "The Art Barn at Morning Glory Farm",
    city: "Canton",
    county: "Cherokee",
    state: "GA",
    website: "https://www.theartbarn.com",
    scrape_url: "https://www.theartbarn.com/events",
    categories: ["farms", "arts", "outdoor"],
    description: "A unique Canton farm where kids meet friendly animals and create art. Play Dates, Unicorn Day, field trips, birthday parties, and camps.",
    is_active: true,
  }).select("id, name");
  
  if (abErr) console.log("Art Barn error:", abErr.message);
  else console.log(`✅ Added: ${ab?.[0]?.name} (${ab?.[0]?.id})`);

  // Add Tanglewood Farm
  const { data: tw, error: twErr } = await supabase.from("venues").insert({
    name: "Tanglewood Farm Miniatures",
    city: "Canton",
    county: "Cherokee",
    state: "GA",
    website: "https://tanglewoodfarm.com",
    scrape_url: null,
    categories: ["farms", "outdoor", "education"],
    description: "Home to over 150 rare, heritage, and miniature breed therapy farm animals. Educational tours, birthday parties, and seasonal events. All ages.",
    is_active: true,
  }).select("id, name");
  
  if (twErr) console.log("Tanglewood error:", twErr.message);
  else console.log(`✅ Added: ${tw?.[0]?.name} (${tw?.[0]?.id})`);
}

main().catch(console.error);
