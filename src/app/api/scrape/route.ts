/**
 * API Route: /api/scrape
 * 
 * Triggers the scraper to fetch events from venue websites.
 * 
 * Usage:
 *   POST /api/scrape              — scrape ALL configured venues
 *   POST /api/scrape?venue=ID     — scrape a specific venue by ID
 * 
 * This endpoint is meant to be called by:
 *   - A cron job (monthly automated scraping)
 *   - Manually from the admin panel (future)
 *   - The test script during development
 */

import { NextRequest, NextResponse } from "next/server";
import { runScrapeAll } from "@/scrapers/scrape-engine";

export async function POST(request: NextRequest) {
  try {
    // Check for a specific venue ID in the query string
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venue");

    // Run the scrapers
    const venueIds = venueId ? [venueId] : undefined;
    const summary = await runScrapeAll(venueIds);

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
        events_found: r.events.length,
        error: r.error,
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
