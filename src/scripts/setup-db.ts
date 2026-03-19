/**
 * Database setup script — creates all tables in Supabase
 * and seeds the 12 starter venues.
 * 
 * Run with: npx tsx src/scripts/setup-db.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load env vars from .env.local
const envPath = path.join(__dirname, "../../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
}

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseAnonKey = envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Load the venues seed data
const venuesPath = path.join(__dirname, "../../data/venues-seed.json");
const venues = JSON.parse(fs.readFileSync(venuesPath, "utf-8"));

async function seedVenues() {
  console.log(`\nSeeding ${venues.length} venues into Supabase...\n`);

  let success = 0;
  let failed = 0;

  for (const venue of venues) {
    const { error } = await supabase.from("venues").insert(venue);

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        console.log(`  SKIP: "${venue.name}" (already exists)`);
        success++;
      } else {
        console.error(`  FAIL: "${venue.name}": ${error.message} (code: ${error.code})`);
        failed++;
      }
    } else {
      console.log(`  OK: ${venue.name}`);
      success++;
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed.\n`);
}

async function main() {
  // Test connection first
  console.log("Testing Supabase connection...");
  const { error: testError } = await supabase.from("venues").select("id").limit(1);

  if (testError) {
    if (testError.message.includes("does not exist") || testError.code === "42P01") {
      console.log("\nThe 'venues' table does not exist yet.");
      console.log("You need to create the database tables first.\n");
      console.log("HOW TO DO THIS:");
      console.log("1. Go to https://supabase.com/dashboard");
      console.log("2. Click your project");
      console.log("3. Click 'SQL Editor' in the left sidebar");
      console.log("4. Click 'New query'");
      console.log("5. Paste the contents of data/supabase-schema.sql");
      console.log("6. Click 'Run'\n");
      console.log("Then run this script again.\n");
      process.exit(1);
    } else {
      console.error(`Connection error: ${testError.message}`);
      process.exit(1);
    }
  }

  console.log("Connected to Supabase successfully!\n");

  // Seed venues
  await seedVenues();

  // Show what's in the database now
  const { data: allVenues } = await supabase
    .from("venues")
    .select("name, city, categories")
    .eq("is_active", true)
    .order("name");

  if (allVenues) {
    console.log(`Total venues in database: ${allVenues.length}\n`);
  }
}

main();
