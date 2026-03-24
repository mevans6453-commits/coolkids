/**
 * Firecrawl JSON Strategy — the "ultimate backup" (Strategy #8)
 *
 * Uses Firecrawl's AI-powered structured JSON extraction to pull event data
 * directly from the page. Instead of getting markdown and parsing with regex,
 * this tells Firecrawl exactly what fields to extract — name, date, time,
 * price, kids pricing, age range, description, and image URL.
 *
 * Costs 5 credits per page (vs 1 for markdown) but handles tricky JS-heavy
 * sites that defeat all other strategies.
 *
 * Placed LAST in the cascade — only used if all other strategies fail.
 */

import type { ScrapedEvent } from "../base-scraper";
import type { VenueConfig } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import { extractDate, extractTime, extractCost, extractAge, classifyEventType } from "../parse-utils";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

/** Schema sent to Firecrawl for structured extraction */
const EVENT_SCHEMA = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Event name/title" },
          date: { type: "string", description: "Event date or date range (e.g. 'April 18, 2026' or 'March 28-29, 2026')" },
          time: { type: "string", description: "Event time if listed (e.g. '10 AM - 2 PM', '7:30 PM')" },
          price: { type: "string", description: "Ticket price or cost (e.g. '$20', 'Free', '$15-$25 adults, $10 children')" },
          kids_pricing: { type: "string", description: "Special pricing for children if mentioned (e.g. 'Children 2 and under free', 'Kids $5')" },
          age_range: { type: "string", description: "Target age range if mentioned (e.g. 'All ages', 'Ages 3-12', 'Adults 21+')" },
          description: { type: "string", description: "Brief event description (1-2 sentences max)" },
          image_url: { type: "string", description: "URL of event image/poster if present on the page" },
        },
        required: ["name", "date"],
      },
    },
  },
  required: ["events"],
};

export const firecrawlJsonStrategy: ScrapeStrategy = {
  name: "firecrawl-json",

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
      console.log(`[Firecrawl-JSON] Scraping: ${config.venue_name} (${config.scrape_url})`);

      const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: config.scrape_url,
          formats: ["json"],
          jsonOptions: {
            schema: EVENT_SCHEMA,
            prompt: "Extract all upcoming events from this page. Include the event name, date, time, price, any special kids pricing, target age range, a brief description, and the event image URL if available.",
          },
          waitFor: 5000,   // Extra wait for JS-heavy pages
          timeout: 30000,  // 30s timeout for AI extraction
        }),
        signal: AbortSignal.timeout(45000), // Abort after 45s
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return { events: [], error: `Firecrawl-JSON API error: ${response.status} ${errorText.slice(0, 100)}` };
      }

      const result = await response.json();
      const rawEvents = result?.data?.json?.events || [];

      if (rawEvents.length === 0) {
        return { events: [], error: "No events extracted by Firecrawl JSON" };
      }

      console.log(`[Firecrawl-JSON] AI extracted ${rawEvents.length} raw events`);

      // Convert Firecrawl's JSON events to our ScrapedEvent format
      const currentYear = new Date().getFullYear();
      const events: ScrapedEvent[] = [];

      for (const raw of rawEvents) {
        // Skip entries without a name
        if (!raw.name || raw.name.length < 3) continue;

        // Parse the date string using our existing date extractor
        const dateInfo = extractDate(raw.date || "", currentYear);
        if (!dateInfo) continue; // Skip events with no parseable date

        // Parse time using our existing time extractor
        const timeInfo = extractTime(raw.time || "");

        // Parse cost — first try the raw price field, then fallback to our extractor
        const priceText = [raw.price, raw.kids_pricing].filter(Boolean).join(" ");
        const costInfo = extractCost(priceText || "");

        // Add kids pricing as a note if present
        let pricingNotes = costInfo?.pricing_notes || null;
        if (raw.kids_pricing && !pricingNotes) {
          pricingNotes = raw.kids_pricing;
        }

        // Parse age range
        const ageText = raw.age_range || raw.description || "";
        const ageInfo = extractAge(ageText);

        // Classify event type
        const eventType = classifyEventType(
          raw.name,
          raw.description || null,
          dateInfo.start_date,
          dateInfo.end_date
        );

        events.push({
          name: raw.name.slice(0, 150), // Cap at 150 chars
          description: raw.description?.slice(0, 500) || null,
          start_date: dateInfo.start_date,
          end_date: dateInfo.end_date,
          start_time: timeInfo?.start_time || null,
          end_time: timeInfo?.end_time || null,
          cost: costInfo?.cost || (raw.price ? raw.price.slice(0, 100) : null),
          cost_min: costInfo?.cost_min ?? null,
          cost_max: costInfo?.cost_max ?? null,
          is_free: costInfo?.is_free || /free/i.test(raw.price || ""),
          pricing_notes: pricingNotes,
          age_range_min: ageInfo.age_range_min,
          age_range_max: ageInfo.age_range_max,
          event_type: eventType,
          categories: [...config.default_categories],
          source_url: null,
          image_url: raw.image_url || null,
        });
      }

      console.log(`[Firecrawl-JSON] Converted ${events.length} valid events for ${config.venue_name}`);
      return { events, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("abort") || message.includes("timeout")) {
        return { events: [], error: "Firecrawl-JSON request timed out" };
      }
      return { events: [], error: message };
    }
  },
};
