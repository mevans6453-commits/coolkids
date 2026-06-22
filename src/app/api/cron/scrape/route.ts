/**
 * API Route: /api/cron/scrape
 *
 * Automated scraping endpoint called by Vercel Cron (or external cron service).
 * Authenticates via CRON_SECRET header instead of user session.
 *
 * Strategy:
 * - Rotates through venues in batches of 10 per day
 * - Uses the day-of-year to determine which batch to scrape
 * - Free strategies only (jsonld, html, ical, rss) to stay within timeout
 * - Full scrape with Firecrawl on Sundays (day % 7 === 0)
 *
 * Usage:
 *   GET /api/cron/scrape (triggered by Vercel Cron with Authorization header)
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { runScrapeAll } from "@/scrapers/scrape-engine";

export const maxDuration = 60; // Free tier max

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 10; // Venues per cron run — keeps within 60s timeout

function verifyCronAuth(request: NextRequest): boolean {
  // Vercel Cron sends this automatically
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;

  // Also check Vercel's built-in cron verification
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all active venues with scrape URLs
    const { data: venues } = await supabase
      .from("venues")
      .select("id, name, preferred_strategy")
      .eq("is_active", true)
      .not("scrape_url", "is", null)
      .order("name");

    if (!venues || venues.length === 0) {
      return NextResponse.json({ message: "No venues to scrape", events_found: 0 });
    }

    // Determine today's batch using day-of-year rotation
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1;
    const isSunday = now.getDay() === 0;

    let venuesToScrape: typeof venues;

    if (isSunday) {
      // Sunday: scrape venues that need paid strategies (Firecrawl/Apify)
      // These are typically JS-heavy sites that free strategies can't handle
      venuesToScrape = venues.filter(v =>
        ["firecrawl", "firecrawl-json", "apify", "apify-chromium"].includes(v.preferred_strategy || "")
      ).slice(0, BATCH_SIZE);
    } else {
      // Weekdays: rotate through all venues in batches
      const totalBatches = Math.ceil(venues.length / BATCH_SIZE);
      const batchIndex = dayOfYear % totalBatches;
      const start = batchIndex * BATCH_SIZE;
      venuesToScrape = venues.slice(start, start + BATCH_SIZE);
    }

    if (venuesToScrape.length === 0) {
      return NextResponse.json({ message: "No venues in today's batch", batch: dayOfYear });
    }

    console.log(`[Cron] Scraping batch: ${venuesToScrape.length} venues (day ${dayOfYear}, ${isSunday ? "Sunday full" : "weekday rotation"})`);

    const venueIds = venuesToScrape.map(v => v.id);
    const summary = await runScrapeAll(venueIds, false); // Use preferred strategies

    // Auto-revalidate public pages
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      batch_day: dayOfYear,
      is_sunday: isSunday,
      venues_scraped: summary.total_venues,
      events_found: summary.events_found,
      events_saved: summary.events_saved,
      successful: summary.successful,
      failed: summary.failed,
      results: summary.results.map(r => ({
        venue: r.venue_name,
        strategy: r.strategy_used,
        events: r.events_found,
      })),
    });
  } catch (err) {
    console.error("[Cron Scrape] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
