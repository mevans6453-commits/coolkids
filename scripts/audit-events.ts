// Fix event names by fetching real titles from source URLs
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

// Known good data from the Atlanta History Center events page we scraped earlier
const ATLANTA_HISTORY_FIXES: Record<string, { name: string; desc: string }> = {
  "2026-03-26": { name: "Beauty Walk", desc: "Onsite | Included with Admission | Family-Friendly. Explore seasonal beauty in the gardens." },
  "2026-04-15": { name: "Cherokee Garden Library Spring Lecture: Thomas Woltz", desc: "Spring lecture at the Cherokee Garden Library." },
  "2026-04-16": { name: "Homeschool Day: Hidden Histories", desc: "Onsite | Included with Admission | Family-Friendly. Ages 5-12 welcome." },
  "2026-04-20": { name: "Jeffrey O. G. Ogbar", desc: "Author of \"America's Black Capital: How African Americans Remade Atlanta.\"" },
  "2026-04-30": { name: "Ron Hsu in Conversation", desc: "Author of \"Down South + East: A Chinese American Cookbook.\"" },
  "2026-05-06": { name: "Toddler Storytime: Going Wild!", desc: "Onsite | Included with Admission | Family-Friendly. Ages 0-3 welcome." },
  "2026-05-21": { name: "Homeschool Day: Atlanta in 100 Objects", desc: "Onsite | Included with Admission | Family-Friendly. Ages 5-12." },
};

// High Museum event data from URLs
const HIGH_MUSEUM_EVENTS: Record<string, { name: string; desc: string }> = {
  "2026-03-26": { name: "Friday Gallery Talk", desc: "An art historian leads a discussion of works in the galleries." },
  "2026-03-27": { name: "Palette & Pour", desc: "Wine tasting and art viewing event at the High Museum." },
  "2026-03-28": { name: "STEAM Teacher Series", desc: "Creating Exhibitions using design thinking." },
  "2026-03-29": { name: "Study Hall at the High", desc: "Free study and creative workspace in the museum." },
  "2026-04-02": { name: "Distinguished Conversation in the Arts", desc: "An evening of art and dialogue featuring Edmonia Lewis." },
  "2026-04-03": { name: "Studio Workshop: Paper Marbling", desc: "Hands-on art workshop for adults." },
  "2026-04-04": { name: "Toddler Saturday", desc: "Art activities designed for toddlers and their caregivers. Ages 0-3." },
};

async function main() {
  console.log("=== FIX EVENT NAMES ===\n");

  // Fix Atlanta History Center events
  const { data: ahcEvents } = await supabase
    .from("events")
    .select("id, name, start_date, venue_id")
    .eq("status", "published")
    .or("name.like.%Onsite%,name.like.%Author of%,name.like.[%,name.like.Cherokee Garden Library");

  // Also get venue IDs for matching
  const { data: ahcVenue } = await supabase
    .from("venues")
    .select("id")
    .ilike("name", "%Atlanta History Center%")
    .limit(1);

  const { data: highVenue } = await supabase
    .from("venues")
    .select("id")
    .ilike("name", "%High Museum%")
    .limit(1);

  const ahcId = ahcVenue?.[0]?.id;
  const highId = highVenue?.[0]?.id;

  // Fix Atlanta History Center events by date
  if (ahcId) {
    const { data: events } = await supabase
      .from("events")
      .select("id, name, start_date, image_url")
      .eq("venue_id", ahcId)
      .eq("status", "published");

    for (const e of events || []) {
      const fix = ATLANTA_HISTORY_FIXES[e.start_date];
      if (fix) {
        await supabase.from("events").update({ name: fix.name, description: fix.desc }).eq("id", e.id);
        console.log(`  ✅ AHC: "${e.name?.slice(0, 30)}..." → "${fix.name}"`);
      } else if (e.name.startsWith("!") || e.name.startsWith("[") || e.name.startsWith("http") || e.name.includes("Author of")) {
        // Delete events we can't fix
        await supabase.from("events").delete().eq("id", e.id);
        console.log(`  🗑️ AHC: Deleted bad name "${e.name?.slice(0, 50)}..."`);
      }
    }
  }

  // Fix High Museum events by date
  if (highId) {
    const { data: events } = await supabase
      .from("events")
      .select("id, name, start_date, image_url")
      .eq("venue_id", highId)
      .eq("status", "published");

    for (const e of events || []) {
      const fix = HIGH_MUSEUM_EVENTS[e.start_date];
      if (fix) {
        await supabase.from("events").update({ name: fix.name, description: fix.desc }).eq("id", e.id);
        console.log(`  ✅ High: "${e.name?.slice(0, 30)}..." → "${fix.name}"`);
      } else if (e.name.startsWith("!") || e.name.startsWith("[") || e.name.startsWith("http")) {
        await supabase.from("events").delete().eq("id", e.id);
        console.log(`  🗑️ High: Deleted bad name "${e.name?.slice(0, 50)}..."`);
      }
    }
  }

  // Clean up Forsyth Library meeting room event
  const { data: forsyth } = await supabase
    .from("events")
    .select("id, name")
    .eq("status", "published")
    .like("name", "%Meeting Room%");

  for (const e of forsyth || []) {
    await supabase.from("events").delete().eq("id", e.id);
    console.log(`  🗑️ Deleted: "${e.name}" (not a real event)`);
  }

  // Clean up "Explore Canton" tagline event
  const { data: tagline } = await supabase
    .from("events")
    .select("id, name")
    .eq("status", "published")
    .like("name", "%unforgettable lineup%");

  for (const e of tagline || []) {
    await supabase.from("events").delete().eq("id", e.id);
    console.log(`  🗑️ Deleted: "${e.name}" (tagline, not event)`);
  }

  // Clean up "Gainesville Events" list event
  const { data: gains } = await supabase
    .from("events")
    .select("id, name")
    .eq("status", "published")
    .like("name", "%Gainesville Events%");

  for (const e of gains || []) {
    await supabase.from("events").delete().eq("id", e.id);
    console.log(`  🗑️ Deleted: "${e.name}" (page title, not event)`);
  }

  // Final count
  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Final clean event count: ${count}`);
  console.log(`${"=".repeat(50)}`);
}

main().catch(console.error);
