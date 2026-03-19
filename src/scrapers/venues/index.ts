/**
 * Venue Configs Index — exports all venue scrape configurations.
 * 
 * Each venue has a config that tells the scraper:
 * - Where to find events (URL)
 * - Which scraper engine to use (apify, firecrawl, manual)
 * - What default categories to apply
 * - Optional custom parsing logic
 * 
 * To add a new venue, create a config object and add it to the array below.
 */

import type { VenueConfig } from "../base-scraper";

// -----------------------------------------------
// Venue configurations
// Each entry matches a venue in the Supabase database
// -----------------------------------------------

const venueConfigs: VenueConfig[] = [
  {
    venue_id: "9a41f781-3591-4253-8023-d10650fd7dbd",
    venue_name: "Tellus Science Museum",
    scrape_url: "https://tellusmuseum.org/explore/events/",
    scrape_method: "apify",
    default_categories: ["museum", "education"],
  },
  {
    venue_id: "fc72f9b0-0e14-4f8e-a286-ba33f6269309",
    venue_name: "Booth Western Art Museum",
    scrape_url: "https://www.boothmuseum.org/events",
    scrape_method: "apify",
    default_categories: ["museum", "arts", "education"],
  },
  {
    venue_id: "e17eebde-93b3-4b49-81ce-23bb1e6fbe3a",
    venue_name: "Gibbs Gardens",
    scrape_url: "https://www.gibbsgardens.com",
    scrape_method: "apify",
    default_categories: ["garden", "outdoor", "seasonal"],
  },
  {
    venue_id: "311e6655-ee10-49f5-981c-ac7ec436fec8",
    venue_name: "Cagle's Family Farm",
    scrape_url: "https://www.caglesfarm.com",
    scrape_method: "apify",
    default_categories: ["farm", "outdoor", "seasonal"],
  },
];

/**
 * Get all venue configs
 */
export function getAllVenueConfigs(): VenueConfig[] {
  return venueConfigs;
}

/**
 * Get a single venue config by ID
 */
export function getVenueConfig(venueId: string): VenueConfig | undefined {
  return venueConfigs.find((c) => c.venue_id === venueId);
}
