// Audit script — load env from .env.local, then scan events
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Keywords suggesting NOT kid-friendly
const ADULT_KEYWORDS = [
  "bar crawl", "pub crawl", "brewery tour", "beer tasting", "wine tasting",
  "wine dinner", "cocktail", "bourbon", "whiskey", "spirits tasting",
  "happy hour", "21+", "21 and over", "ages 21", "must be 21",
  "adults only", "adult night", "adult league", "senior league",
  "trivia night", "karaoke night", "comedy night", "stand-up comedy",
  "drag show", "burlesque", "open mic night",
  "networking event", "business mixer", "chamber of commerce", "rotary club",
  "blood drive", "job fair", "hiring event", "career fair",
  "boot camp", "crossfit",
  "book club", "garden club", "quilting", "knitting group",
  "aarp", "retirement", "medicare", "estate planning",
  "tax prep", "financial planning",
  "political", "campaign rally",
  "brunch", "dinner series", "chef's table",
  "live band", "dj night",
];

// Keywords suggesting kid-friendly (safe override)
const KID_OVERRIDE = [
  "family", "kids", "children", "toddler", "preschool", "youth",
  "storytime", "story time", "puppet", "magic show", "face paint",
  "easter egg", "trunk or treat", "santa", "trick or treat",
  "kid-friendly", "all ages", "baby", "infant",
];

async function audit() {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, description, event_type, venue_id, start_date, categories, venue:venues(name)")
    .eq("status", "published")
    .order("name");

  if (error || !events) {
    console.error("Failed to fetch events:", error);
    return;
  }

  console.log(`\n=== AUDITING ${events.length} EVENTS ===\n`);

  const flagged: { name: string; venue: string; reason: string; id: string; currentType: string }[] = [];
  
  for (const event of events) {
    const text = `${event.name} ${event.description || ""}`.toLowerCase();
    const venueName = (event.venue as any)?.name || "Unknown";

    for (const keyword of ADULT_KEYWORDS) {
      if (text.includes(keyword)) {
        const hasKidOverride = KID_OVERRIDE.some(k => text.includes(k));
        if (!hasKidOverride) {
          flagged.push({
            name: event.name,
            venue: venueName,
            reason: keyword,
            id: event.id,
            currentType: event.event_type,
          });
          break;
        }
      }
    }
  }

  // Sort flagged by reason
  flagged.sort((a, b) => a.reason.localeCompare(b.reason));

  console.log(`FLAGGED ${flagged.length} events as potentially not-for-kids:\n`);
  for (const f of flagged) {
    const status = f.currentType === "not_for_kids" ? " [ALREADY FLAGGED]" : "";
    console.log(`  ❌ "${f.name}" @ ${f.venue}`);
    console.log(`     reason: "${f.reason}"${status}`);
  }

  // Group by reason for pattern analysis
  const reasonCounts = new Map<string, number>();
  for (const f of flagged) {
    reasonCounts.set(f.reason, (reasonCounts.get(f.reason) || 0) + 1);
  }
  console.log(`\n=== REASON BREAKDOWN ===`);
  for (const [reason, count] of Array.from(reasonCounts.entries()).sort(([,a], [,b]) => b - a)) {
    console.log(`  "${reason}": ${count} events`);
  }

  // Show events NOT flagged but with suspicious venue types
  const allClean = events.filter(e => 
    !flagged.find(f => f.id === e.id) && 
    e.event_type !== "not_for_kids" && 
    e.event_type !== "hours"
  );
  console.log(`\n=== ${allClean.length} CLEAN EVENTS (sample of first 20) ===`);
  for (const e of allClean.slice(0, 20)) {
    console.log(`  ✅ "${e.name}" @ ${(e.venue as any)?.name}`);
  }
}

audit();
