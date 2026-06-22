/**
 * Check deactivated venues — which ones might be worth reactivating?
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function main() {
  const { data: deactivated } = await supabase
    .from("venues")
    .select("id, name, scrape_url, website, preferred_strategy")
    .eq("is_active", false)
    .order("name");

  console.log(`\n=== Deactivated Venues (${deactivated?.length || 0}) ===\n`);

  for (const v of deactivated || []) {
    const url = v.scrape_url || v.website;
    let status = "No URL";
    
    if (url) {
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": UA },
          signal: AbortSignal.timeout(10000),
        });
        status = `HTTP ${resp.status} (${(await resp.text()).length / 1024 | 0}KB)`;
      } catch (err: any) {
        status = `Error: ${err.message.slice(0, 60)}`;
      }
    }

    const reactivatable = status.startsWith("HTTP 200");
    console.log(`${reactivatable ? "🟢" : "🔴"} ${v.name}`);
    console.log(`   URL: ${url || "none"}`);
    console.log(`   Status: ${status}`);
    console.log(`   Strategy: ${v.preferred_strategy || "none"}`);
    if (reactivatable) console.log(`   → CANDIDATE FOR REACTIVATION`);
    console.log();
  }
}

main().catch(console.error);
