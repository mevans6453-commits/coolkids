/**
 * Strategy interface — each scraping strategy implements this shape.
 */

import type { ScrapedEvent, VenueConfig } from "../base-scraper";

export type StrategyResult = {
  events: ScrapedEvent[];
  error: string | null;
};

export type ScrapeStrategy = {
  /** Unique name stored in the DB (e.g. "html", "jsonld", "ical") */
  name: string;
  /** Quick check: is this strategy worth trying for this URL? */
  canAttempt: (url: string) => boolean;
  /** Execute the scrape — return events or an error */
  scrape: (config: VenueConfig) => Promise<StrategyResult>;
};
