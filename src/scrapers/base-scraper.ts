/**
 * Base Scraper — defines the common interface for all venue scrapers.
 * 
 * Every venue scraper must:
 * 1. Fetch raw content from the venue's events page
 * 2. Parse that content into a list of ScrapedEvent objects
 * 3. Return the events so they can be saved to the database
 */

export type ScrapedEvent = {
  name: string;
  description: string | null;
  start_date: string; // YYYY-MM-DD format
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  cost: string | null;
  cost_min: number | null;
  cost_max: number | null;
  is_free: boolean;
  pricing_notes: string | null;
  age_range_min: number | null;
  age_range_max: number | null;
  categories: string[];
  source_url: string | null;
  image_url: string | null;
};

export type ScrapeResult = {
  venue_id: string;
  venue_name: string;
  events: ScrapedEvent[];
  error: string | null;
  scraped_at: string;
};

/**
 * VenueConfig — tells the scraper how to handle a specific venue.
 * Each venue gets one of these in src/scrapers/venues/
 */
export type VenueConfig = {
  /** The venue's UUID from the database */
  venue_id: string;
  /** Human-readable name (for logging) */
  venue_name: string;
  /** URL to scrape for events */
  scrape_url: string;
  /** Which scraper engine to use */
  scrape_method: "apify" | "firecrawl" | "manual";
  /** Default categories to apply to all events from this venue */
  default_categories: string[];
  /** Optional: custom parser function to extract events from raw markdown */
  parseEvents?: (markdown: string) => ScrapedEvent[];
};
