/**
 * JSON-LD Strategy — extracts Schema.org Event objects from page HTML.
 * Most reliable when present. Uses plain fetch(), no API key needed.
 */

import type { ScrapedEvent } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import { extractAge, classifyEventType } from "../parse-utils";

const USER_AGENT = "CoolKidsBot/1.0 (family events aggregator)";

export const jsonldStrategy: ScrapeStrategy = {
  name: "jsonld",

  canAttempt: () => true, // Any page might have JSON-LD

  async scrape(config): Promise<StrategyResult> {
    try {
      const response = await fetch(config.scrape_url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return { events: [], error: `HTTP ${response.status}` };
      }

      const html = await response.text();

      // Find all JSON-LD script blocks
      const jsonldBlocks: string[] = [];
      const regex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        jsonldBlocks.push(match[1].trim());
      }

      if (jsonldBlocks.length === 0) {
        return { events: [], error: null }; // No JSON-LD on this page (not an error)
      }

      const events: ScrapedEvent[] = [];

      for (const block of jsonldBlocks) {
        try {
          const data = JSON.parse(block);
          const items = extractEvents(data);
          for (const item of items) {
            const event = mapSchemaOrgEvent(item, config.default_categories);
            if (event) events.push(event);
          }
        } catch {
          // Invalid JSON — skip this block
        }
      }

      return { events, error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/** Recursively find all objects with @type "Event" in a JSON-LD structure */
function extractEvents(data: unknown): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      results.push(...extractEvents(item));
    }
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Check if this object is an Event
    const type = obj["@type"];
    if (type === "Event" || (Array.isArray(type) && type.includes("Event"))) {
      results.push(obj);
    }

    // Check @graph array (common in WordPress sites)
    if (Array.isArray(obj["@graph"])) {
      results.push(...extractEvents(obj["@graph"]));
    }
  }

  return results;
}

/** Map a Schema.org Event object to our ScrapedEvent type */
function mapSchemaOrgEvent(
  item: Record<string, unknown>,
  defaultCategories: string[]
): ScrapedEvent | null {
  const name = String(item.name || "").trim();
  if (!name) return null;

  // Parse dates
  const startDateRaw = String(item.startDate || "");
  const endDateRaw = String(item.endDate || "");

  const startDate = parseIsoDate(startDateRaw);
  if (!startDate) return null; // No valid start date

  const endDate = endDateRaw ? parseIsoDate(endDateRaw) : null;
  const startTime = parseIsoTime(startDateRaw);
  const endTime = endDateRaw ? parseIsoTime(endDateRaw) : null;

  // Parse pricing from offers
  let cost: string | null = null;
  let costMin: number | null = null;
  let costMax: number | null = null;
  let isFree = false;

  if (item.isAccessibleForFree === true) {
    isFree = true;
    cost = "Free";
  }

  const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  if (offers) {
    const offerList = Array.isArray(offers) ? offers : [offers];
    for (const offer of offerList) {
      if (offer.price !== undefined) {
        const price = Number(offer.price);
        if (!isNaN(price)) {
          costMin = costMin === null ? price : Math.min(costMin, price);
          costMax = costMax === null ? price : Math.max(costMax, price);
        }
      }
      if (offer.lowPrice !== undefined) {
        costMin = Number(offer.lowPrice) || costMin;
      }
      if (offer.highPrice !== undefined) {
        costMax = Number(offer.highPrice) || costMax;
      }
    }
    if (costMin !== null && costMax !== null && !isFree) {
      cost = costMin === costMax ? `$${costMin}` : `$${costMin}-$${costMax}`;
      isFree = costMin === 0 && costMax === 0;
    }
  }

  // Description
  const description = item.description
    ? String(item.description).slice(0, 300)
    : null;

  // Image
  const image = item.image;
  const imageUrl = typeof image === "string"
    ? image
    : (image && typeof image === "object" && "url" in (image as Record<string, unknown>))
      ? String((image as Record<string, unknown>).url)
      : null;

  // Source URL
  const sourceUrl = item.url ? String(item.url) : null;

  return {
    name,
    description,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    cost,
    cost_min: costMin,
    cost_max: costMax,
    is_free: isFree,
    pricing_notes: null,
    ...extractAge(`${name} ${description || ""}`),
    event_type: classifyEventType(name, description, startDate, endDate ?? null),
    categories: [...defaultCategories],
    source_url: sourceUrl,
    image_url: imageUrl,
  };
}

/** Extract YYYY-MM-DD from an ISO date string */
function parseIsoDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/** Extract time as "10:00 AM" from an ISO date string */
function parseIsoTime(dateStr: string): string | null {
  const match = dateStr.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1]);
  const m = match[2];
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === "00" ? `${h12} ${period}` : `${h12}:${m} ${period}`;
}
