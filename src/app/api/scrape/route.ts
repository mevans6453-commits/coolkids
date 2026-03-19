/**
 * API Route: /api/scrape
 *
 * Multi-strategy scraper endpoint. Tries multiple scraping strategies
 * per venue and uses whichever returns the best results.
 *
 * Usage:
 *   POST /api/scrape              — scrape ALL venues with scrape_url
 *   POST /api/scrape?venue=ID     — scrape a specific venue by ID
 *   POST /api/scrape?detect=true  — force auto-detection (ignore preferred_strategy)
 *
 * Response includes per-venue strategy attempts so you can see what was tried.
 */

import { NextRequest, NextResponse } from "next/server";
import { runScrapeAll } from "@/scrapers/scrape-engine";

// Allow up to 60 seconds for scraping (requires Vercel Pro for >10s)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venue");
    const forceDetect = searchParams.get("detect") === "true";

    const venueIds = venueId ? [venueId] : undefined;
    const summary = await runScrapeAll(venueIds, forceDetect);

    return NextResponse.json({
      success: true,
      summary: {
        total_venues: summary.total_venues,
        successful: summary.successful,
        failed: summary.failed,
        events_found: summary.events_found,
        events_saved: summary.events_saved,
        duration_ms:
          new Date(summary.finished_at).getTime() -
          new Date(summary.started_at).getTime(),
      },
      results: summary.results.map((r) => ({
        venue: r.venue_name,
        strategy_used: r.strategy_used,
        events_found: r.events_found,
        events_saved: r.events_saved,
        error: r.error,
        attempts: r.attempts,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /scrape] Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
