/**
 * Fix admin dashboard issues:
 * 1. Delete the stuck __RLS_TEST__ venue suggestion
 * 2. Check what's in profiles table
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // 1. Delete the stuck __RLS_TEST__ suggestion
  console.log("\n=== Deleting __RLS_TEST__ suggestion ===\n");
  const { data: deleted, error: delErr } = await supabase
    .from("venue_suggestions")
    .delete()
    .eq("venue_name", "__RLS_TEST__")
    .select();
  
  if (delErr) {
    console.log(`  ❌ Error: ${delErr.message}`);
    // Try ilike in case exact match fails
    const { data: all } = await supabase
      .from("venue_suggestions")
      .select("id, venue_name")
      .limit(10);
    console.log("  All suggestions:", all);
  } else {
    console.log(`  ✅ Deleted ${deleted?.length || 0} rows`);
  }

  // 2. Check profiles table
  console.log("\n=== Checking profiles table ===\n");
  const { count, error: countErr } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  
  console.log(`  Count via anon key: ${count} (error: ${countErr?.message || "none"})`);

  // Try to read profiles directly
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, email")
    .limit(5);
  
  console.log(`  Direct read: ${profiles?.length || 0} rows (error: ${profErr?.message || "none"})`);
  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      console.log(`    - ${p.email || p.id}`);
    }
  }

  // Check all venue_suggestions to see what's there
  console.log("\n=== All venue suggestions ===\n");
  const { data: allSuggestions } = await supabase
    .from("venue_suggestions")
    .select("id, venue_name, suggested_by_email, created_at");
  
  console.log(`  ${allSuggestions?.length || 0} total suggestions:`);
  for (const s of allSuggestions || []) {
    console.log(`    - "${s.venue_name}" by ${s.suggested_by_email} (${s.created_at})`);
  }
}

main().catch(console.error);
