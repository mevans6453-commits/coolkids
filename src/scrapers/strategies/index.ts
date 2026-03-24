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
import { firecrawlJsonStrategy } from "./firecrawl-json-strategy";
import type { ScrapeStrategy } from "./types";

// Order matters: try free/reliable strategies before paid ones
export const ALL_STRATEGIES: ScrapeStrategy[] = [
  jsonldStrategy,           // #1 Most structured, most reliable when present
  icalStrategy,             // #2 Standard calendar format, very reliable
  rssStrategy,              // #3 Standard feed format
  htmlStrategy,             // #4 Free, no API needed, works on many sites
  firecrawlStrategy,        // #5 JS-rendering via Firecrawl → markdown (1 credit)
  apifyStrategy,            // #6 Fallback: RAG browser, cheaper but no JS
  apifyChromiumStrategy,    // #7 Headless Chromium, handles JS calendars
  firecrawlJsonStrategy,    // #8 Ultimate backup: AI-powered JSON extraction (5 credits)
];

export function getStrategy(name: string): ScrapeStrategy | undefined {
  return ALL_STRATEGIES.find((s) => s.name === name);
}

export type { ScrapeStrategy, StrategyResult } from "./types";
