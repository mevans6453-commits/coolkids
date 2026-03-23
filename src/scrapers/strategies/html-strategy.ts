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

      const events = await parseHtmlForEvents(html, config.default_categories, config.scrape_url);
      return { events, error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/** Parse HTML for events using a two-pass approach */
async function parseHtmlForEvents(html: string, defaultCategories: string[], scrapeUrl?: string): Promise<ScrapedEvent[]> {
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
    const sourceUrl = linkMatch ? resolveUrl(linkMatch[1], scrapeUrl) : null;

    // Look for an image
    const imgMatch = section.html.match(/<img[^>]*src=["']([^"']+)["']/i);
    const imageUrl = imgMatch ? resolveUrl(imgMatch[1], scrapeUrl) : null;

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

  // Pass 4: If still no events, look for event links and follow sub-pages
  // Handles sites like etowahmill.com where /events is just navigation
  // and real data lives on /event/denimfest, /event/wildlife-expo, etc.
  if (events.length === 0 && scrapeUrl) {
    const subPageEvents = await followEventLinks(html, scrapeUrl, defaultCategories);
    events.push(...subPageEvents);
  }

  return events;
}

/** Discover event sub-page links and scrape each one */
async function followEventLinks(
  indexHtml: string,
  scrapeUrl: string,
  defaultCategories: string[]
): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    const baseUrl = new URL(scrapeUrl);
    const baseDomain = baseUrl.origin;

    // Find all internal links that look like event pages
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
    const eventUrlPatterns = [
      /\/events?\//i,      // /event/something or /events/something
      /\/calendar\//i,     // /calendar/event-name
      /\/program\//i,      // /program/something
      /\/activity\//i,     // /activity/something
      /\/show\//i,         // /show/something
    ];

    const seenUrls = new Set<string>();
    const eventUrls: string[] = [];

    let linkMatch;
    while ((linkMatch = linkRegex.exec(indexHtml)) !== null) {
      let href = linkMatch[1];

      // Skip anchors, javascript, mailto, tel
      if (href.startsWith("#") || href.startsWith("javascript:") ||
          href.startsWith("mailto:") || href.startsWith("tel:")) continue;

      // Resolve relative URLs
      if (href.startsWith("/")) href = baseDomain + href;
      else if (!href.startsWith("http")) continue;

      // Must be same domain
      try {
        const url = new URL(href);
        if (url.origin !== baseDomain) continue;

        // Must match event URL pattern
        if (!eventUrlPatterns.some(p => p.test(url.pathname))) continue;

        // Skip the index page itself
        if (url.pathname === baseUrl.pathname) continue;

        // Dedupe
        const key = url.pathname;
        if (seenUrls.has(key)) continue;
        seenUrls.add(key);

        eventUrls.push(href);
      } catch { continue; }
    }

    if (eventUrls.length === 0) return events;

    console.log(`  [HTML] Found ${eventUrls.length} event sub-page links, fetching up to 10...`);

    // Fetch up to 10 sub-pages
    const toFetch = eventUrls.slice(0, 10);
    for (const url of toFetch) {
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) continue;

        const subHtml = await resp.text();
        const currentYear = new Date().getFullYear();

        // Extract event data from the sub-page
        // Try JSON-LD first (many CMS embed structured data on event pages)
        const jsonLdEvent = extractJsonLdEvent(subHtml);
        if (jsonLdEvent) {
          events.push({ ...jsonLdEvent, categories: [...defaultCategories] });
          console.log(`  [HTML] Sub-page JSON-LD: "${jsonLdEvent.name}" (${url})`);
          continue;
        }

        // Fall back to heading-based extraction
        const subEvents = await parseHtmlForEvents(subHtml, defaultCategories);
        if (subEvents.length > 0) {
          for (const e of subEvents) {
            e.source_url = url;
          }
          events.push(...subEvents);
          console.log(`  [HTML] Sub-page headings: found ${subEvents.length} events (${url})`);
          continue;
        }

        // Last resort: try OG/meta tags for event info
        const metaEvent = extractFromMetaTags(subHtml, url, currentYear, defaultCategories);
        if (metaEvent) {
          events.push(metaEvent);
          console.log(`  [HTML] Sub-page meta: "${metaEvent.name}" (${url})`);
        }

        // Polite delay
        await new Promise(r => setTimeout(r, 500));
      } catch { continue; }
    }

    console.log(`  [HTML] Link-following found ${events.length} total events from ${toFetch.length} sub-pages`);
  } catch { /* URL parsing error */ }

  return events;
}

/** Try to extract a single event from JSON-LD on a page */
function extractJsonLdEvent(html: string): ScrapedEvent | null {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Event" && item.name && item.startDate) {
          const startDate = item.startDate.split("T")[0];
          const endDate = item.endDate ? item.endDate.split("T")[0] : null;

          // Extract time
          let startTime: string | null = null;
          let endTime: string | null = null;
          if (item.startDate.includes("T")) {
            const t = item.startDate.split("T")[1];
            if (t) {
              const [h, m] = t.split(":");
              const hr = parseInt(h);
              const period = hr >= 12 ? "PM" : "AM";
              const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
              startTime = `${h12}:${m.slice(0, 2)} ${period}`;
            }
          }

          // Extract cost from offers
          let cost: string | null = null;
          let costMin: number | null = null;
          let isFree = false;
          if (item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            const prices = offers.map((o: any) => parseFloat(o.price)).filter((p: number) => !isNaN(p));
            if (prices.length > 0) {
              costMin = Math.min(...prices);
              cost = costMin === 0 ? "Free" : `$${costMin}`;
              isFree = costMin === 0;
            }
          }

          return {
            name: item.name,
            description: item.description?.slice(0, 500) || null,
            start_date: startDate,
            end_date: endDate,
            start_time: startTime,
            end_time: endTime,
            cost,
            cost_min: costMin,
            cost_max: null,
            is_free: isFree,
            pricing_notes: null,
            age_range_min: null,
            age_range_max: null,
            event_type: classifyEventType(item.name, item.description || "", startDate, endDate),
            categories: [],
            source_url: item.url || null,
            image_url: typeof item.image === "string" ? item.image : item.image?.url || null,
          };
        }
      }
    } catch { continue; }
  }
  return null;
}

/** Extract event info from OG/meta tags as last resort */
function extractFromMetaTags(
  html: string, url: string, currentYear: number, defaultCategories: string[]
): ScrapedEvent | null {
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];

  if (!ogTitle || ogTitle.length < 5) return null;

  // Try to extract a date from the description
  const dateInfo = extractDate(ogDesc || "", currentYear);
  if (!dateInfo) return null;

  const costInfo = extractCost(ogDesc || "");

  return {
    name: ogTitle.slice(0, 200),
    description: ogDesc?.slice(0, 500) || null,
    start_date: dateInfo.start_date,
    end_date: dateInfo.end_date,
    start_time: null,
    end_time: null,
    cost: costInfo?.cost || null,
    cost_min: costInfo?.cost_min ?? null,
    cost_max: costInfo?.cost_max ?? null,
    is_free: costInfo?.is_free || false,
    pricing_notes: costInfo?.pricing_notes ?? null,
    age_range_min: null,
    age_range_max: null,
    event_type: classifyEventType(ogTitle, ogDesc || "", dateInfo.start_date, dateInfo.end_date),
    categories: [...defaultCategories],
    source_url: url,
    image_url: ogImage || null,
  };
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

/** Resolve URLs — handle relative paths, skip data/javascript URLs */
function resolveUrl(url: string, baseUrl?: string): string | null {
  if (url.startsWith("data:") || url.startsWith("javascript:") || url.startsWith("#")) {
    return null;
  }
  // Relative URL — prepend base domain
  if (url.startsWith("/") && baseUrl) {
    try {
      const base = new URL(baseUrl);
      return `${base.origin}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}
