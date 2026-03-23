// Add Atlanta Regional Airport as a venue and scrape it
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
  // Check if venue already exists
  const { data: existing } = await supabase
    .from("venues")
    .select("id, name")
    .ilike("name", "%Atlanta Regional Airport%");

  let venueId: string;

  if (existing && existing.length > 0) {
    console.log(`Venue already exists: ${existing[0].name}`);
    // Update the URL
    await supabase.from("venues").update({ scrape_url: "https://atlantaregionalairport.com/events/" }).eq("id", existing[0].id);
    venueId = existing[0].id;
  } else {
    // Create new venue
    const { data: newVenue, error } = await supabase
      .from("venues")
      .insert({
        name: "Atlanta Regional Airport (Falcon Field)",
        city: "Peachtree City",
        state: "GA",
        address: "1 Falcon Field, Peachtree City, GA 30269",
        scrape_url: "https://atlantaregionalairport.com/events/",
        is_active: true,
        categories: ["outdoor", "family"],
      })
      .select("id, name")
      .single();

    if (error) {
      console.log("❌ Error creating venue:", error.message);
      return;
    }
    console.log(`✅ Created venue: ${newVenue.name}`);
    venueId = newVenue.id;
  }

  // Scrape it
  console.log(`\nScraping via API...\n`);
  const resp = await fetch(`http://localhost:3000/api/scrape?venue=${venueId}&detect=true`, { method: "POST" });
  const result = await resp.json();

  console.log("Result:", JSON.stringify(result, null, 2));

  // Show events in DB
  const { data: events } = await supabase
    .from("events")
    .select("id, name, start_date, end_date")
    .eq("venue_id", venueId)
    .eq("status", "published");

  console.log(`\nEvents in DB: ${events?.length || 0}`);
  for (const e of events || []) {
    console.log(`  📅 "${e.name}" (${e.start_date}${e.end_date ? " – " + e.end_date : ""})`);
  }
}

main().catch(console.error);
