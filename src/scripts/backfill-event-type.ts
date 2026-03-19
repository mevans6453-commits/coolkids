/**
 * Backfill event_type and age_range for all existing events.
 * Run with: npx tsx src/scripts/backfill-event-type.ts
 */
import { createClient } from "@supabase/supabase-js";
import { classifyEventType, extractAge } from "../scrapers/parse-utils";
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

async function main() {
  const { data: events } = await sb.from("events").select("id, name, description, start_date, end_date, is_recurring, event_type, age_range_min, age_range_max");
  if (!events) { console.log("No events found"); return; }

  let updated = 0;
  let hoursCount = 0;
  let agePopulated = 0;

  for (const e of events) {
    const text = `${e.name} ${e.description || ""}`;
    const eventType = classifyEventType(e.name, e.description, e.start_date, e.end_date, e.is_recurring);
    const ageInfo = extractAge(text);

    const updates: Record<string, unknown> = {};

    // Always update event_type (backfill from default 'event')
    if (eventType !== e.event_type) {
      updates.event_type = eventType;
    }

    // Only update age if we found something and it was previously null
    if (ageInfo.age_range_min !== null && e.age_range_min === null) {
      updates.age_range_min = ageInfo.age_range_min;
    }
    if (ageInfo.age_range_max !== null && e.age_range_max === null) {
      updates.age_range_max = ageInfo.age_range_max;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await sb.from("events").update(updates).eq("id", e.id);
      if (!error) {
        updated++;
        if (updates.event_type === "hours") hoursCount++;
        if (updates.age_range_min !== undefined || updates.age_range_max !== undefined) agePopulated++;
        console.log(`  Updated: "${e.name}" → type=${updates.event_type || e.event_type}, age=${updates.age_range_min ?? e.age_range_min}-${updates.age_range_max ?? e.age_range_max}`);
      } else {
        console.log(`  FAIL: "${e.name}": ${error.message}`);
      }
    }
  }

  console.log(`\nDone: ${updated} of ${events.length} events updated`);
  console.log(`  ${hoursCount} classified as 'hours'`);
  console.log(`  ${agePopulated} got age range populated`);
}

main();
