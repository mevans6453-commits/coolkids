// Delete the duplicate Wings Over North Georgia event
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
  const { data } = await supabase
    .from("events")
    .delete()
    .ilike("name", "%Thunderbirds Headline%")
    .select("id, name");
  console.log(`Deleted ${data?.length || 0} duplicate(s):`, data?.map(e => e.name));

  // Verify remaining
  const { data: remaining } = await supabase
    .from("events")
    .select("name, start_date")
    .eq("status", "published")
    .ilike("name", "%Wings%");
  console.log("\nRemaining Wings events:", remaining);
}
main().catch(console.error);
