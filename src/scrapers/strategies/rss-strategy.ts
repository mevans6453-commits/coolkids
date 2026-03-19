/**
 * RSS Strategy — parses RSS/Atom XML feeds for event entries.
 * Plain fetch(), no API needed. Works on venues that publish event feeds.
 */

import type { ScrapedEvent } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import { extractDate, extractTime, extractCost, stripHtml } from "../parse-utils";

const USER_AGENT = "CoolKidsBot/1.0 (family events aggregator)";

export const rssStrategy: ScrapeStrategy = {
  name: "rss",

  canAttempt(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes("rss") || lower.includes("feed") || lower.includes("atom") || lower.endsWith(".xml");
  },

  async scrape(config): Promise<StrategyResult> {
    try {
      const response = await fetch(config.scrape_url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return { events: [], error: `HTTP ${response.status}` };
      }

      const text = await response.text();

      // Quick check: is this actually XML/RSS?
      if (!text.includes("<rss") && !text.includes("<feed") && !text.includes("<channel")) {
        return { events: [], error: null };
      }

      const events = parseRssFeed(text, config.default_categories);
      return { events, error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/** Parse RSS 2.0 or Atom feed items into events */
function parseRssFeed(xml: string, defaultCategories: string[]): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const currentYear = new Date().getFullYear();

  // Try RSS 2.0 <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const event = parseRssItem(item, defaultCategories, currentYear);
    if (event) events.push(event);
  }

  // If no RSS items, try Atom <entry> blocks
  if (events.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const event = parseAtomEntry(entry, defaultCategories, currentYear);
      if (event) events.push(event);
    }
  }

  return events;
}

/** Parse a single RSS <item> into a ScrapedEvent */
function parseRssItem(item: string, defaultCategories: string[], currentYear: number): ScrapedEvent | null {
  const title = getXmlTag(item, "title");
  if (!title) return null;

  const description = getXmlTag(item, "description") || getXmlTag(item, "content:encoded") || "";
  const link = getXmlTag(item, "link");
  const plainText = stripHtml(description);

  // Try to find an event date in the content
  const dateInfo = extractDate(plainText, currentYear) || extractDate(title, currentYear);
  if (!dateInfo) return null; // Can't find a date — skip

  const timeInfo = extractTime(plainText);
  const costInfo = extractCost(plainText);

  return {
    name: stripHtml(title).slice(0, 200),
    description: plainText.slice(0, 300) || null,
    start_date: dateInfo.start_date,
    end_date: dateInfo.end_date,
    start_time: timeInfo?.start_time || null,
    end_time: timeInfo?.end_time || null,
    cost: costInfo?.cost || null,
    cost_min: costInfo?.cost_min ?? null,
    cost_max: costInfo?.cost_max ?? null,
    is_free: costInfo?.is_free || false,
    pricing_notes: costInfo?.pricing_notes ?? null,
    age_range_min: null,
    age_range_max: null,
    categories: [...defaultCategories],
    source_url: link || null,
    image_url: null,
  };
}

/** Parse a single Atom <entry> into a ScrapedEvent */
function parseAtomEntry(entry: string, defaultCategories: string[], currentYear: number): ScrapedEvent | null {
  const title = getXmlTag(entry, "title");
  if (!title) return null;

  const summary = getXmlTag(entry, "summary") || getXmlTag(entry, "content") || "";
  const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["']/);
  const link = linkMatch ? linkMatch[1] : null;
  const plainText = stripHtml(summary);

  const dateInfo = extractDate(plainText, currentYear) || extractDate(title, currentYear);
  if (!dateInfo) return null;

  const timeInfo = extractTime(plainText);
  const costInfo = extractCost(plainText);

  return {
    name: stripHtml(title).slice(0, 200),
    description: plainText.slice(0, 300) || null,
    start_date: dateInfo.start_date,
    end_date: dateInfo.end_date,
    start_time: timeInfo?.start_time || null,
    end_time: timeInfo?.end_time || null,
    cost: costInfo?.cost || null,
    cost_min: costInfo?.cost_min ?? null,
    cost_max: costInfo?.cost_max ?? null,
    is_free: costInfo?.is_free || false,
    pricing_notes: costInfo?.pricing_notes ?? null,
    age_range_min: null,
    age_range_max: null,
    categories: [...defaultCategories],
    source_url: link || null,
    image_url: null,
  };
}

/** Extract text content from an XML tag */
function getXmlTag(xml: string, tag: string): string | null {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Regular tag content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}
