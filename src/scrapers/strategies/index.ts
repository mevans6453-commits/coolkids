/**
 * Strategy Registry — all scraping strategies in priority order.
 * Cheapest/most reliable strategies first, expensive ones last.
 */

import { jsonldStrategy } from "./jsonld-strategy";
import { icalStrategy } from "./ical-strategy";
import { rssStrategy } from "./rss-strategy";
import { htmlStrategy } from "./html-strategy";
import { firecrawlStrategy } from "./firecrawl-strategy";
import { apifyStrategy } from "./apify-strategy";
import { apifyChromiumStrategy } from "./apify-chromium-strategy";
import type { ScrapeStrategy } from "./types";

// Order matters: try free/reliable strategies before paid ones
export const ALL_STRATEGIES: ScrapeStrategy[] = [
  jsonldStrategy,           // Most structured, most reliable when present
  icalStrategy,             // Standard calendar format, very reliable
  rssStrategy,              // Standard feed format
  htmlStrategy,             // Free, no API needed, works on many sites
  firecrawlStrategy,        // JS-rendering via Firecrawl API (separate credit pool)
  apifyStrategy,            // Fallback: RAG browser, cheaper but no JS
  apifyChromiumStrategy,    // Last resort: headless Chromium, handles JS calendars
];

export function getStrategy(name: string): ScrapeStrategy | undefined {
  return ALL_STRATEGIES.find((s) => s.name === name);
}

export type { ScrapeStrategy, StrategyResult } from "./types";
