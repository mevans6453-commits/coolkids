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

async function main() {
  // Check ALL published events for source_url status
  const { data: events } = await supabase
    .from("events")
    .select("id, name, source_url, venue_id")
    .eq("status", "published")
    .order("name");

  const { data: venues } = await supabase.from("venues").select("id, name, scrape_url, website");
  const venueMap: Record<string, any> = {};
  for (const v of venues || []) venueMap[v.id] = v;

  // Count missing vs present
  let missing = 0;
  let hasUrl = 0;
  const missingList: string[] = [];

  for (const e of events || []) {
    if (!e.source_url || e.source_url.trim() === "") {
      missing++;
      const v = venueMap[e.venue_id];
      missingList.push(`MISSING: "${e.name}" @ ${v?.name || "?"} | source_url="${e.source_url}" | venue_url=${v?.scrape_url || v?.website || "NONE"}`);
    } else {
      hasUrl++;
    }
  }

  console.log(`Total: ${(events || []).length}`);
  console.log(`Has URL: ${hasUrl}`);
  console.log(`Missing: ${missing}`);
  
  if (missingList.length > 0) {
    console.log("\nStill missing:");
    for (const m of missingList) console.log(`  ${m}`);
  }

  // Also specifically check Mill on Etowah events
  console.log("\n--- Mill on Etowah events ---");
  const mill = (events || []).filter(e => {
    const v = venueMap[e.venue_id];
    return v?.name?.includes("Mill on Etowah");
  });
  for (const e of mill) {
    console.log(`  "${e.name}" | source_url="${e.source_url || "NULL/EMPTY"}"`);
  }

  // Fix ALL remaining missing ones
  let fixed = 0;
  for (const e of events || []) {
    if (!e.source_url || e.source_url.trim() === "") {
      const v = venueMap[e.venue_id];
      const url = v?.scrape_url || v?.website;
      if (url) {
        await supabase.from("events").update({ source_url: url }).eq("id", e.id);
        fixed++;
      }
    }
  }
  console.log(`\nFixed: ${fixed}`);
}

main().catch(console.error);
