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
async function main() {
  const { data } = await sb.from("venues").select("id, name").order("name");
  data?.forEach((v: any) => console.log(v.id + " | " + v.name));
}
main();
