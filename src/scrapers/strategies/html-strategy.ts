/**
 * HTML Strategy — fetches raw HTML with plain fetch(), strips tags,
 * and applies regex-based event extraction. No API key needed.
 *
 * Two-pass approach:
 * 1. Extract structured hints from HTML (<time>, <h1-h4>, links)
 * 2. Fall back to plain text regex parsing
 */

import type { ScrapedEvent } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import {
  extractDate,
  extractTime,
  extractCost,
  extractAge,
  classifyEventType,
  isNonEventHeading,
  stripHtml,
} from "../parse-utils";

const USER_AGENT = "CoolKidsBot/1.0 (family events aggregator)";

export const htmlStrategy: ScrapeStrategy = {
  name: "html",

  canAttempt: () => true, // Any URL serves HTML

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

      // Use custom parser if venue config provides one
      if (config.parseEvents) {
        const events = config.parseEvents(html);
        return { events, error: null };
      }

      const events = parseHtmlForEvents(html, config.default_categories);
      return { events, error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/** Parse HTML for events using a two-pass approach */
function parseHtmlForEvents(html: string, defaultCategories: string[]): ScrapedEvent[] {
  const currentYear = new Date().getFullYear();
  const events: ScrapedEvent[] = [];

  // Pass 1: Extract structured date elements from <time datetime="...">
  const timeElements = extractTimeElements(html);

  // Pass 2: Extract headings and their surrounding content
  const sections = extractHtmlSections(html);

  for (const section of sections) {
    if (isNonEventHeading(section.heading)) continue;

    // Check if the heading IS a date (e.g. "April 1st" on WordPress event pages)
    const headingIsDate = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?$/i.test(section.heading.trim());

    // Try to find a date from <time> elements near this section,
    // or fall back to regex parsing the plain text
    let dateInfo = findNearbyDate(section, timeElements, currentYear);
    if (!dateInfo) {
      // If heading is a date, extract from the heading itself
      dateInfo = headingIsDate
        ? extractDate(section.heading, currentYear)
        : extractDate(section.text, currentYear);
    }
    if (!dateInfo) continue; // No date found — skip

    // If the heading was a date, extract the real event name from bold/strong text
    let eventName = section.heading;
    if (headingIsDate) {
      const boldMatch = section.html.match(/<(?:strong|b)>([^<]{4,120})<\/(?:strong|b)>/i);
      if (boldMatch) {
        eventName = stripHtml(boldMatch[1]).trim();
      } else {
        continue; // Date heading but no bold event name — skip
      }
    }

    const timeInfo = extractTime(section.text);
    const costInfo = extractCost(section.text);

    // Look for a link in the original HTML near this heading
    const linkMatch = section.html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
    const sourceUrl = linkMatch ? resolveUrl(linkMatch[1]) : null;

    // Look for an image
    const imgMatch = section.html.match(/<img[^>]*src=["']([^"']+)["']/i);
    const imageUrl = imgMatch ? resolveUrl(imgMatch[1]) : null;

    events.push({
      name: eventName.slice(0, 200),
      description: section.text.slice(0, 300) || null,
      start_date: dateInfo.start_date,
      end_date: dateInfo.end_date,
      start_time: timeInfo?.start_time || null,
      end_time: timeInfo?.end_time || null,
      cost: costInfo?.cost || null,
      cost_min: costInfo?.cost_min ?? null,
      cost_max: costInfo?.cost_max ?? null,
      is_free: costInfo?.is_free || false,
      pricing_notes: costInfo?.pricing_notes ?? null,
      ...extractAge(`${eventName} ${section.text}`),
      event_type: classifyEventType(eventName, section.text.slice(0, 300), dateInfo.start_date, dateInfo.end_date),
      categories: [...defaultCategories],
      source_url: sourceUrl,
      image_url: imageUrl,
    });
  }

  return events;
}

type TimeElement = { datetime: string; date: string | null; time: string | null };

/** Extract all <time datetime="..."> elements from HTML */
function extractTimeElements(html: string): TimeElement[] {
  const results: TimeElement[] = [];
  const regex = /<time[^>]*datetime=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const dt = match[1];
    const dateMatch = dt.match(/(\d{4}-\d{2}-\d{2})/);
    const timeMatch = dt.match(/T(\d{2}):(\d{2})/);

    let timeStr: string | null = null;
    if (timeMatch) {
      const h = parseInt(timeMatch[1]);
      const m = timeMatch[2];
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      timeStr = m === "00" ? `${h12} ${period}` : `${h12}:${m} ${period}`;
    }

    results.push({
      datetime: dt,
      date: dateMatch ? dateMatch[1] : null,
      time: timeStr,
    });
  }
  return results;
}

type HtmlSection = { heading: string; html: string; text: string; position: number };

/** Split HTML into sections by heading tags (h1-h3 only — h4 is absorbed into sections) */
function extractHtmlSections(html: string): HtmlSection[] {
  const sections: HtmlSection[] = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  const headings: { text: string; index: number }[] = [];

  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({ text: stripHtml(match[1]).trim(), index: match.index });
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : html.length;
    const sectionHtml = html.slice(start, Math.min(end, start + 3000)); // Cap at 3000 chars
    const sectionText = stripHtml(sectionHtml);

    if (headings[i].text.length > 3 && headings[i].text.length < 200) {
      sections.push({
        heading: headings[i].text,
        html: sectionHtml,
        text: sectionText,
        position: start,
      });
    }
  }

  return sections;
}

/** Find a <time> element date near a section heading */
function findNearbyDate(
  section: HtmlSection,
  timeElements: TimeElement[],
  currentYear: number
): { start_date: string; end_date: string | null } | null {
  // Check if any <time> element appears within the section's HTML
  for (const te of timeElements) {
    if (te.date && section.html.includes(te.datetime)) {
      return { start_date: te.date, end_date: null };
    }
  }

  // Fall back to text-based date extraction
  return extractDate(section.text, currentYear);
}

/** Basic URL resolution — skip data: and javascript: URLs */
function resolveUrl(url: string): string | null {
  if (url.startsWith("data:") || url.startsWith("javascript:") || url.startsWith("#")) {
    return null;
  }
  return url;
}
