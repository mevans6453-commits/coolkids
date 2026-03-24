/**
 * Firecrawl Strategy — uses Firecrawl API to scrape JS-rendered pages
 * and return clean markdown. Requires FIRECRAWL_API_KEY.
 *
 * Firecrawl renders JavaScript (like a real browser), handles SPAs,
 * and returns clean markdown. Faster than Apify (~5-10s vs 15-45s).
 * Slots in between free HTML strategy and Apify as a fallback.
 */

import type { VenueConfig } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import { parseEventsFromMarkdown } from "../parse-utils";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

export const firecrawlStrategy: ScrapeStrategy = {
  name: "firecrawl",

  canAttempt(): boolean {
    const key = process.env.FIRECRAWL_API_KEY;
    return !!key && key.length > 0;
  },

  async scrape(config: VenueConfig): Promise<StrategyResult> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return { events: [], error: "FIRECRAWL_API_KEY not set" };
    }

    try {
      console.log(`[Firecrawl] Scraping: ${config.venue_name} (${config.scrape_url})`);

      // Firecrawl /scrape endpoint — renders JS and returns markdown
      const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: config.scrape_url,
          formats: ["markdown"],
          waitFor: 3000, // Wait 3s for JS to render
          timeout: 15000, // 15s total timeout
        }),
        signal: AbortSignal.timeout(20000), // Abort after 20s
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return { events: [], error: `Firecrawl API error: ${response.status} ${errorText.slice(0, 100)}` };
      }

      const result = await response.json();
      
      // Firecrawl v1 returns { success: true, data: { markdown: "...", ... } }
      const markdown = result?.data?.markdown || "";
      if (!markdown.trim()) {
        return { events: [], error: "Empty content from Firecrawl" };
      }

      console.log(`[Firecrawl] Got ${markdown.length} chars of content`);

      // Parse events from markdown using existing parser
      let events;
      if (config.parseEvents) {
        events = config.parseEvents(markdown);
      } else {
        events = parseEventsFromMarkdown(markdown, config.default_categories);
      }

      console.log(`[Firecrawl] Found ${events.length} events for ${config.venue_name}`);
      return { events, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Clean up timeout errors
      if (message.includes("abort") || message.includes("timeout")) {
        return { events: [], error: "Firecrawl request timed out" };
      }
      return { events: [], error: message };
    }
  },
};
