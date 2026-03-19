import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
const envContent = fs.readFileSync(path.join(__dirname, "../../.env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) { const t = line.trim(); if (t && !t.startsWith("#")) { const i = t.indexOf("="); if (i > 0) env[t.slice(0, i)] = t.slice(i + 1); } }
const sb = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
async function main() {
  const { data: venues } = await sb.from("venues").select("id, name").order("name");
  const { data: events } = await sb.from("events").select("venue_id");
  if (!venues || !events) { console.log("Error"); return; }
  const counts: Record<string, number> = {};
  for (const v of venues) counts[v.id] = 0;
  for (const e of events) { if (counts[e.venue_id] !== undefined) counts[e.venue_id]++; }
  let total = 0;
  for (const v of venues) { const c = counts[v.id]; console.log(c + " | " + v.name); total += c; }
  console.log("---");
  console.log(venues.length + " venues | " + total + " events");
}
main();
