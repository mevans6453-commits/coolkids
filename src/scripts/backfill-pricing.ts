import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
const envContent = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) { const t = line.trim(); if (t && !t.startsWith("#")) { const i = t.indexOf("="); if (i > 0) env[t.slice(0, i)] = t.slice(i + 1); } }
const sb = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

function parseCost(cost: string | null, isFree: boolean): { cost_min: number | null; cost_max: number | null; is_free: boolean } {
  if (isFree || !cost) return { cost_min: isFree ? 0 : null, cost_max: isFree ? 0 : null, is_free: isFree };
  const text = cost.toLowerCase().trim();
  if (text === "free" || text === "$0" || text === "0") {
    return { cost_min: 0, cost_max: 0, is_free: true };
  }
  // "Free for moms", "Free for dads" — conditional free, not truly free
  if (text.startsWith("free for")) {
    return { cost_min: 0, cost_max: 0, is_free: false };
  }
  // Range: "$8-$12", "$8 - $12", "$8–$12"
  const rangeMatch = text.match(/\$?(\d+(?:\.\d+)?)\s*[-–]\s*\$?(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return { cost_min: parseFloat(rangeMatch[1]), cost_max: parseFloat(rangeMatch[2]), is_free: false };
  }
  // Single price: "$30", "$10"
  const singleMatch = text.match(/\$?(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    return { cost_min: val, cost_max: val, is_free: val === 0 };
  }
  return { cost_min: null, cost_max: null, is_free: false };
}

async function main() {
  const { data: events } = await sb.from("events").select("id, name, cost, is_free, cost_min, cost_max");
  if (!events) { console.log("No events found"); return; }

  let updated = 0;
  for (const e of events) {
    const parsed = parseCost(e.cost, e.is_free);
    // Only update if we have new data
    if (parsed.cost_min !== e.cost_min || parsed.cost_max !== e.cost_max || parsed.is_free !== e.is_free) {
      const { error } = await sb.from("events").update({
        cost_min: parsed.cost_min,
        cost_max: parsed.cost_max,
        is_free: parsed.is_free,
      }).eq("id", e.id);
      if (error) {
        console.log(`  FAIL: "${e.name}": ${error.message}`);
      } else {
        console.log(`  OK: "${e.name}" -> min:${parsed.cost_min} max:${parsed.cost_max} free:${parsed.is_free}`);
        updated++;
      }
    }
  }
  console.log(`\nUpdated ${updated} of ${events.length} events`);
}
main();
