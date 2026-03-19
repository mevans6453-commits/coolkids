/**
 * Strategy Registry — all scraping strategies in priority order.
 * Cheapest/most reliable strategies first, expensive ones last.
 */

import { jsonldStrategy } from "./jsonld-strategy";
import { icalStrategy } from "./ical-strategy";
import { rssStrategy } from "./rss-strategy";
import { htmlStrategy } from "./html-strategy";
import { apifyStrategy } from "./apify-strategy";
import type { ScrapeStrategy } from "./types";

// Order matters: try free/reliable strategies before paid ones
export const ALL_STRATEGIES: ScrapeStrategy[] = [
  jsonldStrategy,  // Most structured, most reliable when present
  icalStrategy,    // Standard calendar format, very reliable
  rssStrategy,     // Standard feed format
  htmlStrategy,    // Free, no API needed, works on many sites
  apifyStrategy,   // Fallback: requires API token, costs money
];

export function getStrategy(name: string): ScrapeStrategy | undefined {
  return ALL_STRATEGIES.find((s) => s.name === name);
}

export type { ScrapeStrategy, StrategyResult } from "./types";
