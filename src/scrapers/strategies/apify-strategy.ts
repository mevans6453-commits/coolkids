/**
 * Apify Strategy — uses Apify's RAG Web Browser to fetch venue pages
 * as markdown, then parses with regex. Requires APIFY_API_TOKEN.
 *
 * This is the most capable strategy (handles JS-rendered pages) but
 * costs money and requires an API token. Used as a fallback when
 * free strategies return zero results.
 */

import type { VenueConfig } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import { parseEventsFromMarkdown } from "../parse-utils";

const APIFY_BASE_URL = "https://api.apify.com/v2";

export const apifyStrategy: ScrapeStrategy = {
  name: "apify",

  canAttempt(): boolean {
    const token = process.env.APIFY_API_TOKEN;
    return !!token && token.length > 0;
  },

  async scrape(config: VenueConfig): Promise<StrategyResult> {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return { events: [], error: "APIFY_API_TOKEN not set" };
    }

    try {
      console.log(`[Apify] Scraping: ${config.venue_name} (${config.scrape_url})`);

      // Step 1: Start the Apify RAG Web Browser actor
      const runUrl = `${APIFY_BASE_URL}/acts/apify~rag-web-browser/runs?token=${token}`;
      const response = await fetch(runUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: config.scrape_url,
          maxResults: 1,
          outputFormats: ["markdown"],
        }),
      });

      if (!response.ok) {
        return { events: [], error: `Apify API error: ${response.status} ${response.statusText}` };
      }

      const runData = await response.json();
      const datasetId = runData?.data?.defaultDatasetId;
      if (!datasetId) {
        return { events: [], error: "No dataset ID returned from Apify" };
      }

      // Step 2: Wait for the actor to finish
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Step 3: Fetch the markdown from the dataset
      const datasetUrl = `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`;
      const datasetResponse = await fetch(datasetUrl);
      if (!datasetResponse.ok) {
        return { events: [], error: `Failed to fetch dataset: ${datasetResponse.status}` };
      }

      const items = await datasetResponse.json();
      if (!items || items.length === 0) {
        return { events: [], error: "No items in dataset" };
      }

      const markdown = items[0].markdown || items[0].text || "";
      if (!markdown.trim()) {
        return { events: [], error: "Empty markdown from Apify" };
      }

      // Step 4: Parse events from markdown
      let events;
      if (config.parseEvents) {
        events = config.parseEvents(markdown);
      } else {
        events = parseEventsFromMarkdown(markdown, config.default_categories);
      }

      console.log(`[Apify] Found ${events.length} events for ${config.venue_name}`);
      return { events, error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : String(err) };
    }
  },
};
