/**
 * Apify Chromium Strategy — uses Apify's Website Content Crawler
 * with a REAL headless browser (Playwright/Chromium) to render
 * JS-heavy event calendars.
 *
 * This is more expensive than the RAG Web Browser ($0.05-0.10 per run)
 * but can handle React/Angular/Vue calendars that load events via AJAX.
 *
 * Only used as the LAST fallback when all other strategies fail.
 */

import type { VenueConfig } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import { parseEventsFromMarkdown } from "../parse-utils";

const APIFY_BASE_URL = "https://api.apify.com/v2";

// Venues that are known to be JS-rendered and need Chromium
const JS_HEAVY_VENUES = [
  "puppet.org",
  "high.org",
  "georgiaaquarium.org",
  "childrensmuseumatlanta.org",
  "seqlib.libcal.com",
  "forsythpl.org",
  "atlantahistorycenter.com",
  "visitwoodstockga.com",
  "sandyspringsperformingarts.org",
  "playcherokee.org",
  "cummingfairgrounds.net",
  "forsythco.com",
  "cantonga.gov",
  "cityofballground.com",
  "explorecantonga.com",
  "thehollercanton.com",
  "themillonetowah.com",
];

export const apifyChromiumStrategy: ScrapeStrategy = {
  name: "apify-chromium",

  canAttempt(url: string): boolean {
    const token = process.env.APIFY_API_TOKEN;
    if (!token || token.length === 0) return false;
    // Only try Chromium on known JS-heavy venues to save credits
    return JS_HEAVY_VENUES.some(domain => url.includes(domain));
  },

  async scrape(config: VenueConfig): Promise<StrategyResult> {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return { events: [], error: "APIFY_API_TOKEN not set" };
    }

    try {
      console.log(`[Apify-Chromium] Scraping: ${config.venue_name} (${config.scrape_url})`);

      // Use Website Content Crawler — headless browser that renders JS
      const runUrl = `${APIFY_BASE_URL}/acts/apify~website-content-crawler/runs?token=${token}`;
      const response = await fetch(runUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: config.scrape_url }],
          maxCrawlPages: 1,
          crawlerType: "playwright:adaptive",
          outputFormats: ["markdown"],
          // Don't follow links — just scrape the events page
          maxCrawlDepth: 0,
          // Remove cookie/chat popups
          removeCookieWarnings: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { events: [], error: `Apify Chromium API error: ${response.status} ${response.statusText} — ${errText.slice(0, 200)}` };
      }

      const runData = await response.json();
      const datasetId = runData?.data?.defaultDatasetId;
      const runId = runData?.data?.id;

      if (!datasetId) {
        return { events: [], error: "No dataset ID returned from Apify Chromium" };
      }

      // Wait for actor to finish (poll status — Chromium is slower)
      let attempts = 0;
      while (attempts < 24) { // Max 120 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;

        const statusRes = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const status = statusData?.data?.status;
          if (status === "SUCCEEDED") {
            console.log(`[Apify-Chromium] Actor finished (${attempts * 5}s)`);
            break;
          }
          if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
            return { events: [], error: `Apify Chromium actor ${status}` };
          }
          // Log progress
          if (attempts % 4 === 0) {
            console.log(`[Apify-Chromium] Waiting... (${attempts * 5}s, status: ${status})`);
          }
        }
      }

      // Fetch the markdown from the dataset
      const datasetUrl = `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`;
      const datasetResponse = await fetch(datasetUrl);
      if (!datasetResponse.ok) {
        return { events: [], error: `Failed to fetch Chromium dataset: ${datasetResponse.status}` };
      }

      const items = await datasetResponse.json();
      if (!items || items.length === 0) {
        return { events: [], error: "No items in Chromium dataset" };
      }

      const markdown = items[0].markdown || items[0].text || "";
      if (!markdown.trim()) {
        return { events: [], error: "Empty markdown from Apify Chromium" };
      }

      console.log(`[Apify-Chromium] Got ${markdown.length} chars of rendered content`);

      // Parse events from the rendered markdown
      let events;
      if (config.parseEvents) {
        events = config.parseEvents(markdown);
      } else {
        events = parseEventsFromMarkdown(markdown, config.default_categories);
      }

      // If heading-based parsing found nothing, try line-by-line date extraction
      if (events.length === 0) {
        console.log(`[Apify-Chromium] Heading parse found 0 — trying line-by-line extraction...`);
        events = parseEventsLineByLine(markdown, config.default_categories);
      }

      console.log(`[Apify-Chromium] Found ${events.length} events for ${config.venue_name}`);
      return { events, error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/**
 * Fallback parser: scan line-by-line for event patterns.
 * Many JS-rendered sites produce markdown like:
 *   March 28, 2026
 *   Puppet Show Name
 *   10:00 AM - 11:30 AM
 *   $12 per person
 *
 * This parser groups consecutive lines that form an event.
 */
import { extractDate, extractTime, extractCost, extractAge, classifyEventType } from "../parse-utils";
import type { ScrapedEvent } from "../base-scraper";

function parseEventsLineByLine(markdown: string, defaultCategories: string[]): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const currentYear = new Date().getFullYear();
  const lines = markdown.split("\n").map(l => l.replace(/[#*_]/g, "").trim()).filter(l => l.length > 0);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for a date in this line
    const dateInfo = extractDate(line, currentYear);
    if (!dateInfo) {
      i++;
      continue;
    }

    // We found a date! Now look ahead for event name, time, cost
    // The event name is usually the line before or after the date
    let eventName: string | null = null;
    let eventDescription: string | null = null;
    let timeInfo: { start_time: string; end_time: string | null } | null = null;
    let costInfo: ReturnType<typeof extractCost> = null;

    // Check if the date line itself contains a name (e.g. "March 28 - Puppet Show")
    const nameAfterDate = line.match(/\d{1,2}(?:st|nd|rd|th)?\s*[-–—:]\s*(.+)/);
    if (nameAfterDate && nameAfterDate[1].length > 5) {
      eventName = nameAfterDate[1].trim();
    }

    // Look at surrounding lines (up to 5 lines ahead)
    for (let j = 1; j <= 5 && i + j < lines.length; j++) {
      const nextLine = lines[i + j];

      // Skip empty or very short lines
      if (nextLine.length < 3) continue;

      // Another date means we've passed this event
      const nextDate = extractDate(nextLine, currentYear);
      if (nextDate && j > 1) break;

      // Extract time
      if (!timeInfo) {
        timeInfo = extractTime(nextLine);
      }

      // Extract cost
      if (!costInfo) {
        costInfo = extractCost(nextLine);
      }

      // Extract name (first substantial non-date, non-time, non-cost line)
      if (!eventName && nextLine.length > 5 && nextLine.length < 150) {
        // Skip lines that are just times or prices
        if (!/^\d{1,2}(:\d{2})?\s*(am|pm)/i.test(nextLine) &&
            !/^\$\d+/.test(nextLine) &&
            !/^free$/i.test(nextLine)) {
          eventName = nextLine;
        }
      } else if (eventName && !eventDescription && nextLine.length > 20) {
        // Second substantial line after name = description
        eventDescription = nextLine.slice(0, 300);
      }
    }

    // Also check the line BEFORE the date for the name
    if (!eventName && i > 0) {
      const prevLine = lines[i - 1];
      if (prevLine.length > 5 && prevLine.length < 150 &&
          !/^\d{1,2}(:\d{2})?\s*(am|pm)/i.test(prevLine) &&
          !extractDate(prevLine, currentYear)) {
        eventName = prevLine;
      }
    }

    if (eventName && eventName.length >= 5) {
      const ageInfo = extractAge(`${eventName} ${eventDescription || ""}`);
      const eventType = classifyEventType(eventName, eventDescription, dateInfo.start_date, dateInfo.end_date);

      events.push({
        name: eventName,
        description: eventDescription,
        start_date: dateInfo.start_date,
        end_date: dateInfo.end_date,
        start_time: timeInfo?.start_time || null,
        end_time: timeInfo?.end_time || null,
        cost: costInfo?.cost || null,
        cost_min: costInfo?.cost_min ?? null,
        cost_max: costInfo?.cost_max ?? null,
        is_free: costInfo?.is_free || false,
        pricing_notes: costInfo?.pricing_notes ?? null,
        age_range_min: ageInfo.age_range_min,
        age_range_max: ageInfo.age_range_max,
        event_type: eventType,
        categories: [...defaultCategories],
        source_url: null,
        image_url: null,
      });
    }

    i++;
  }

  return events;
}
