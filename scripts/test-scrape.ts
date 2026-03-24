// Test Firecrawl on ALL venues with 0 events or errors, update strategy for winners
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
import { firecrawlStrategy } from "../src/scrapers/strategies/firecrawl-strategy";
import { parseEventsFromMarkdown, validateScrapedEvents } from "../src/scrapers/parse-utils";
import type { VenueConfig } from "../src/scrapers/base-scraper";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  console.log("=== FIRECRAWL FULL VENUE TEST ===\n");

  // Get all active venues with scrape URLs
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, scrape_url, preferred_strategy")
    .eq("is_active", true)
    .not("scrape_url", "is", null)
    .order("name");

  // Get current event counts
  const { data: events } = await supabase
    .from("events")
    .select("venue_id")
    .eq("status", "published");
  
  const counts: Record<string, number> = {};
  for (const e of events || []) {
    counts[e.venue_id] = (counts[e.venue_id] || 0) + 1;
  }

  // Filter to venues with 0 events or error status
  const problemVenues = (venues || []).filter(v => (counts[v.id] || 0) === 0 && v.scrape_url);
  
  console.log(`Testing ${problemVenues.length} venues with 0 events...\n`);

  const winners: { id: string; name: string; eventsFound: number }[] = [];
  const noEvents: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < problemVenues.length; i++) {
    const v = problemVenues[i];
    const config: VenueConfig = {
      venue_id: v.id,
      venue_name: v.name,
      scrape_url: v.scrape_url,
      scrape_method: "firecrawl",
      default_categories: [],
    };

    process.stdout.write(`[${i + 1}/${problemVenues.length}] ${v.name.padEnd(40)} `);
    
    try {
      const result = await firecrawlStrategy.scrape(config);
      
      if (result.events.length > 0) {
        // Validate the events
        const validated = validateScrapedEvents(result.events);
        const validCount = validated.valid.length;
        
        if (validCount > 0) {
          console.log(`✅ ${validCount} valid events!`);
          for (const e of validated.valid.slice(0, 3)) {
            console.log(`   📅 "${e.name}" (${e.start_date})`);
          }
          winners.push({ id: v.id, name: v.name, eventsFound: validCount });
        } else {
          console.log(`⚠️ ${result.events.length} raw → 0 valid (rejected by validation)`);
          noEvents.push(v.name);
        }
      } else {
        console.log(`— ${result.error || "no events found"}`);
        if (result.error) errors.push(v.name);
        else noEvents.push(v.name);
      }
    } catch (err) {
      console.log(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
      errors.push(v.name);
    }
  }

  // Update preferred_strategy for winners
  if (winners.length > 0) {
    console.log(`\n\n=== UPDATING ${winners.length} VENUES TO FIRECRAWL ===\n`);
    for (const w of winners) {
      const { error } = await supabase
        .from("venues")
        .update({ preferred_strategy: "firecrawl" })
        .eq("id", w.id);
      
      if (!error) {
        console.log(`✅ ${w.name} → preferred_strategy = firecrawl (${w.eventsFound} events)`);
      } else {
        console.log(`❌ Failed to update ${w.name}: ${error.message}`);
      }
    }
  }

  // Now also run Firecrawl on the venues currently using apify/apify-chromium  
  // to see if it can replace them
  const apifyVenues = (venues || []).filter(v => 
    v.preferred_strategy && 
    (v.preferred_strategy === "apify" || v.preferred_strategy === "apify-chromium") &&
    (counts[v.id] || 0) > 0
  );
  
  if (apifyVenues.length > 0) {
    console.log(`\n\n=== TESTING FIRECRAWL ON ${apifyVenues.length} APIFY VENUES ===\n`);
    console.log(`These currently work with Apify — can Firecrawl replace them?\n`);
    
    for (const v of apifyVenues) {
      const config: VenueConfig = {
        venue_id: v.id,
        venue_name: v.name,
        scrape_url: v.scrape_url,
        scrape_method: "firecrawl",
        default_categories: [],
      };

      process.stdout.write(`${v.name.padEnd(40)} `);
      
      try {
        const result = await firecrawlStrategy.scrape(config);
        if (result.events.length > 0) {
          const validated = validateScrapedEvents(result.events);
          if (validated.valid.length > 0) {
            console.log(`✅ ${validated.valid.length} events (currently ${counts[v.id]} via ${v.preferred_strategy}) — CAN REPLACE!`);
            
            // Update to firecrawl
            await supabase.from("venues").update({ preferred_strategy: "firecrawl" }).eq("id", v.id);
            winners.push({ id: v.id, name: v.name, eventsFound: validated.valid.length });
          } else {
            console.log(`⚠️ Raw events but 0 valid — keep ${v.preferred_strategy}`);
          }
        } else {
          console.log(`— no events — keep ${v.preferred_strategy}`);
        }
      } catch (err) {
        console.log(`❌ Error — keep ${v.preferred_strategy}`);
      }
    }
  }

  console.log("\n\n=== FINAL SUMMARY ===");
  console.log(`🟢 Firecrawl winners (updated): ${winners.length}`);
  console.log(`⚠️ No events found: ${noEvents.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`💰 Firecrawl credits used: ~${problemVenues.length + apifyVenues.length}`);
}

main().catch(console.error);
