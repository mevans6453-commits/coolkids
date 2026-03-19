/**
 * Pricing Update Script — populates cost, cost_min, cost_max, is_free, pricing_notes
 * for all events based on scraped venue admission data (March 2026).
 *
 * Run with: npx tsx src/scripts/pricing-update.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envContent = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (t && !t.startsWith("#")) {
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i)] = t.slice(i + 1);
  }
}
const sb = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

// Venue admission pricing (scraped March 2026)
const VENUE_PRICING: Record<string, {
  adult: number;
  child: number;
  notes: string;
}> = {
  // Tellus Science Museum — Adults $20, Kids $16, Seniors $18
  "9a41f781-3591-4253-8023-d10650fd7dbd": {
    adult: 20,
    child: 16,
    notes: "Members free; Military free",
  },
  // Booth Western Art Museum — Adults $15, Kids (4-12) $9
  "fc72f9b0-0e14-4f8e-a286-ba33f6269309": {
    adult: 15,
    child: 9,
    notes: "Members free; Kids under 4 free",
  },
  // Gibbs Gardens — Adults $25, Kids (3-12) $10, Young Adult $16
  "e17eebde-93b3-4b49-81ce-23bb1e6fbe3a": {
    adult: 25,
    child: 10,
    notes: "Under 3 free; Seniors $18",
  },
  // Cagle's Family Farm
  "311e6655-ee10-49f5-981c-ac7ec436fec8": {
    adult: 15,
    child: 15,
    notes: "Seasonal pricing varies",
  },
  // North Georgia Zoo — Adults $15, Kids (3-12) $12
  "cdb17d15-ce63-450a-b6ba-1f27ea2e33ed": {
    adult: 15,
    child: 12,
    notes: "Under 3 free; Military discount",
  },
  // Amicalola Falls State Park — $5 parking pass, activities vary
  "7c30b2ef-1e6d-48ae-8052-650f47df703c": {
    adult: 5,
    child: 5,
    notes: "$5 parking pass required; activity fees additional",
  },
};

// Events with special/known pricing (by event name pattern)
const SPECIAL_PRICING: Array<{
  pattern: RegExp;
  cost: string;
  cost_min: number;
  cost_max: number;
  is_free: boolean;
  pricing_notes: string | null;
}> = [
  // Free events
  { pattern: /FREE Family Thursday/i, cost: "Free", cost_min: 0, cost_max: 0, is_free: true, pricing_notes: "Free admission 4-8 PM" },
  { pattern: /Bank of America.*Museums On Us/i, cost: "Free", cost_min: 0, cost_max: 0, is_free: true, pricing_notes: "Free with Bank of America card" },
  { pattern: /Members Only Story Time/i, cost: "Free", cost_min: 0, cost_max: 0, is_free: true, pricing_notes: "Members only" },
  { pattern: /Canton Farmers Market/i, cost: "Free", cost_min: 0, cost_max: 0, is_free: true, pricing_notes: null },
  { pattern: /Christmas Tree Season/i, cost: "Free", cost_min: 0, cost_max: 0, is_free: true, pricing_notes: "Free admission; trees priced separately" },
  { pattern: /Middle School.*Student Art/i, cost: "Free", cost_min: 0, cost_max: 0, is_free: true, pricing_notes: "Free with museum admission" },
  { pattern: /Mother.*Day/i, cost: "Free for moms", cost_min: 0, cost_max: 0, is_free: false, pricing_notes: "Free for moms; regular admission for others" },
  // Sky watch / special Tellus events — included with admission
  { pattern: /Sky Watch/i, cost: "$16-$20", cost_min: 16, cost_max: 20, is_free: false, pricing_notes: "Included with museum admission" },
  { pattern: /Crystal Clear Perspective/i, cost: "$16-$20", cost_min: 16, cost_max: 20, is_free: false, pricing_notes: "Included with museum admission" },
  { pattern: /Symposium/i, cost: "$16-$20", cost_min: 16, cost_max: 20, is_free: false, pricing_notes: "Included with museum admission" },
  // Tellus summer camps
  { pattern: /Science Explorer Camp/i, cost: "$175-$225", cost_min: 175, cost_max: 225, is_free: false, pricing_notes: "Week-long camp; members discount available" },
  // Booth art workshops (BAA)
  { pattern: /BAA.*Workshop/i, cost: "$400-$600", cost_min: 400, cost_max: 600, is_free: false, pricing_notes: "Multi-day professional workshop" },
  // Art For Lunch — free with admission
  { pattern: /Art For Lunch/i, cost: "$15", cost_min: 0, cost_max: 15, is_free: false, pricing_notes: "Free with museum admission" },
  // Homeschool Friday
  { pattern: /Home School Friday/i, cost: "$9-$15", cost_min: 9, cost_max: 15, is_free: false, pricing_notes: "Museum admission required" },
  // Booth Gala
  { pattern: /Gala.*Art Auction/i, cost: "$150-$250", cost_min: 150, cost_max: 250, is_free: false, pricing_notes: "Ticketed fundraiser event" },
  // Farm field trips
  { pattern: /Field Trip/i, cost: "$10", cost_min: 10, cost_max: 10, is_free: false, pricing_notes: "Per student" },
  // Fall/pumpkin festival
  { pattern: /Fall Festival|Pumpkin/i, cost: "$15", cost_min: 15, cost_max: 15, is_free: false, pricing_notes: null },
  // Boo at the Zoo
  { pattern: /Boo at the Zoo/i, cost: "$15-$20", cost_min: 15, cost_max: 20, is_free: false, pricing_notes: null },
  // Bouncing Babies (zoo)
  { pattern: /Bouncing Babies/i, cost: "$15-$20", cost_min: 15, cost_max: 20, is_free: false, pricing_notes: "Included with zoo admission" },
  // Zoo events
  { pattern: /Tadpole Day Camp/i, cost: "$100-$150", cost_min: 100, cost_max: 150, is_free: false, pricing_notes: "Day camp registration required" },
  { pattern: /NOGAWILD Safari Run/i, cost: "$25-$40", cost_min: 25, cost_max: 40, is_free: false, pricing_notes: "Registration fee; supports zoo" },
  // Amicalola Falls
  { pattern: /Zip Line/i, cost: "$40-$100", cost_min: 40, cost_max: 100, is_free: false, pricing_notes: "Plus $5 parking pass; reservations required" },
  { pattern: /Guided.*Hike/i, cost: "$5", cost_min: 5, cost_max: 5, is_free: false, pricing_notes: "Free with parking pass" },
];

async function main() {
  const { data: events } = await sb.from("events").select("id, name, venue_id, cost, is_free, cost_min, cost_max, pricing_notes");
  if (!events) { console.log("No events found"); return; }

  let updated = 0;
  for (const e of events) {
    // Skip events that already have full pricing data
    if (e.cost && e.cost_min !== null && e.cost_max !== null) continue;

    // Check special pricing first
    let matched = false;
    for (const sp of SPECIAL_PRICING) {
      if (sp.pattern.test(e.name)) {
        const { error } = await sb.from("events").update({
          cost: sp.cost,
          cost_min: sp.cost_min,
          cost_max: sp.cost_max,
          is_free: sp.is_free,
          pricing_notes: sp.pricing_notes,
        }).eq("id", e.id);
        if (!error) {
          console.log(`  [Special] "${e.name}" -> ${sp.cost} (${sp.is_free ? "FREE" : `$${sp.cost_min}-$${sp.cost_max}`})`);
          updated++;
        } else {
          console.log(`  FAIL: "${e.name}": ${error.message}`);
        }
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Fall back to venue's general admission pricing
    const venuePricing = VENUE_PRICING[e.venue_id];
    if (venuePricing) {
      const cost = venuePricing.child === venuePricing.adult
        ? `$${venuePricing.adult}`
        : `$${venuePricing.child}-$${venuePricing.adult}`;
      const { error } = await sb.from("events").update({
        cost: cost,
        cost_min: venuePricing.child,
        cost_max: venuePricing.adult,
        is_free: false,
        pricing_notes: venuePricing.notes,
      }).eq("id", e.id);
      if (!error) {
        console.log(`  [Venue]   "${e.name}" -> ${cost} (${venuePricing.notes})`);
        updated++;
      } else {
        console.log(`  FAIL: "${e.name}": ${error.message}`);
      }
    } else {
      console.log(`  [Skip]    "${e.name}" — no venue pricing config`);
    }
  }
  console.log(`\nUpdated ${updated} of ${events.length} events`);
}

main();
