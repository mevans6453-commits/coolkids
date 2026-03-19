/**
 * Seed script — inserts the 12 starter venues into Supabase
 * 
 * Run with: npm run db:seed
 * 
 * NOTE: You must first create the database tables by running
 * data/supabase-schema.sql in the Supabase SQL Editor.
 */

import { createClient } from "@supabase/supabase-js";
import venues from "../../data/venues-seed.json";

// Use the same env vars as the app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("   Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedVenues() {
  console.log(`\n🌱 Seeding ${venues.length} venues into Supabase...\n`);

  for (const venue of venues) {
    const { data, error } = await supabase
      .from("venues")
      .upsert(venue, { onConflict: "name" })
      .select();

    if (error) {
      console.error(`  ❌ Failed to insert "${venue.name}": ${error.message}`);
    } else {
      console.log(`  ✅ ${venue.name}`);
    }
  }

  console.log("\n🎉 Seeding complete!\n");
}

seedVenues();
