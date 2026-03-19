/**
 * Shared parsing utilities for all scraper strategies.
 * Extracted from apify-scraper.ts so HTML, RSS, and Apify strategies can reuse them.
 */

import type { ScrapedEvent } from "./base-scraper";

// -----------------------------------------------
// Event heading filter
// -----------------------------------------------

/** Check if a heading is NOT an event (e.g., "Become a Member", "Get Tickets") */
export function isNonEventHeading(name: string): boolean {
  const skipPatterns = [
    /become a member/i,
    /get your tickets/i,
    /buy tickets/i,
    /e-news/i,
    /sign up/i,
    /newsletter/i,
    /contact/i,
    /about/i,
    /hours/i,
    /directions/i,
    /events$/i,
  ];
  return skipPatterns.some((p) => p.test(name));
}

// -----------------------------------------------
// Date extraction
// -----------------------------------------------

/** Extract a date from a text section */
export function extractDate(
  text: string,
  currentYear: number
): { start_date: string; end_date: string | null } | null {
  // Pattern: "Monday, March 21, 2026"
  const fullDateRegex =
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi;

  const matches = [...text.matchAll(fullDateRegex)];

  if (matches.length > 0) {
    const first = matches[0];
    const startDate = formatDateStr(first[1], parseInt(first[2]), parseInt(first[3]));

    let endDate: string | null = null;
    const throughMatch = text.match(
      /through\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
    );
    if (throughMatch) {
      endDate = formatDateStr(throughMatch[1], parseInt(throughMatch[2]), parseInt(throughMatch[3]));
    } else if (matches.length > 1) {
      endDate = formatDateStr(matches[1][1], parseInt(matches[1][2]), parseInt(matches[1][3]));
    }

    return { start_date: startDate, end_date: endDate };
  }

  // Pattern: "March 21, 2026" (no day-of-week prefix)
  const monthDayYear =
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i;
  const mdyMatch = text.match(monthDayYear);
  if (mdyMatch) {
    return {
      start_date: formatDateStr(mdyMatch[1], parseInt(mdyMatch[2]), parseInt(mdyMatch[3])),
      end_date: null,
    };
  }

  // Pattern: "21 Mar" or "Mar 21"
  const shortDateRegex =
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  const shortMatch = text.match(shortDateRegex);
  if (shortMatch) {
    const monthNames: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const month = monthNames[shortMatch[2].toLowerCase()];
    const day = parseInt(shortMatch[1]);
    if (month !== undefined && day >= 1 && day <= 31) {
      const date = new Date(currentYear, month, day);
      return { start_date: date.toISOString().split("T")[0], end_date: null };
    }
  }

  // Pattern: ISO date "2026-03-21" or "2026-03-21T10:00:00"
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2})/);
  if (isoMatch) {
    return { start_date: isoMatch[1], end_date: null };
  }

  return null;
}

// -----------------------------------------------
// Time extraction
// -----------------------------------------------

/** Extract time from text */
export function extractTime(
  text: string
): { start_time: string; end_time: string | null } | null {
  // "10 AM – 5 PM"
  const fullRangeRegex =
    /(\d{1,2}(?::\d{2})?)\s*(AM|PM)\s*[–\-—]+\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)/i;
  const fullMatch = text.match(fullRangeRegex);
  if (fullMatch) {
    return {
      start_time: `${fullMatch[1]} ${fullMatch[2].toUpperCase()}`,
      end_time: `${fullMatch[3]} ${fullMatch[4].toUpperCase()}`,
    };
  }

  // "12 – 4 PM"
  const sharedRangeRegex =
    /(\d{1,2}(?::\d{2})?)\s*[–\-—]+\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)/i;
  const sharedMatch = text.match(sharedRangeRegex);
  if (sharedMatch) {
    const period = sharedMatch[3].toUpperCase();
    return {
      start_time: `${sharedMatch[1]} ${period}`,
      end_time: `${sharedMatch[2]} ${period}`,
    };
  }

  // "9:30 AM"
  const singleTimeRegex = /(\d{1,2}(?::\d{2})?)\s*(AM|PM)/i;
  const singleMatch = text.match(singleTimeRegex);
  if (singleMatch) {
    return {
      start_time: `${singleMatch[1]} ${singleMatch[2].toUpperCase()}`,
      end_time: null,
    };
  }

  return null;
}

// -----------------------------------------------
// Cost extraction
// -----------------------------------------------

/** Extract cost information from text */
export function extractCost(
  text: string
): { cost: string; cost_min: number; cost_max: number; is_free: boolean; pricing_notes: string | null } | null {
  const result = { cost: "", cost_min: 0, cost_max: 0, is_free: false, pricing_notes: null as string | null };

  const notesPatterns = [
    /(?:kids|children)\s+(?:under|ages?\s+\d+(?:\s*[-–]\s*\d+)?)\s+free/i,
    /(?:members?|military|seniors?|students?)\s+(?:free|discount|\d+%\s+off)/i,
    /family\s+(?:\d+-?pack|rate|discount)/i,
    /group\s+(?:rate|discount)/i,
    /free\s+(?:for|with)\s+\w+/i,
    /\d+%\s+off/i,
  ];
  const noteMatches: string[] = [];
  for (const p of notesPatterns) {
    const m = text.match(p);
    if (m) noteMatches.push(m[0].trim());
  }
  if (noteMatches.length > 0) result.pricing_notes = noteMatches.join("; ");

  if (/\bfree\s*(?:admission|entry|event)?\b/i.test(text) && !/free\s+for\b/i.test(text)) {
    result.cost = "Free";
    result.is_free = true;
    return result;
  }

  const rangeMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*[-–—]\s*\$?(\d+(?:\.\d{2})?)/);
  if (rangeMatch) {
    result.cost_min = parseFloat(rangeMatch[1]);
    result.cost_max = parseFloat(rangeMatch[2]);
    result.cost = `$${rangeMatch[1]}-$${rangeMatch[2]}`;
    return result;
  }

  const priceContextMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*(per\s+\w+|\/\w+|each|adults?|kids?|children)?/i);
  if (priceContextMatch) {
    const val = parseFloat(priceContextMatch[1]);
    result.cost_min = val;
    result.cost_max = val;
    result.cost = priceContextMatch[2] ? `$${priceContextMatch[1]} ${priceContextMatch[2].trim()}` : `$${priceContextMatch[1]}`;
    result.is_free = val === 0;
    return result;
  }

  return noteMatches.length > 0 ? result : null;
}

// -----------------------------------------------
// Description extraction
// -----------------------------------------------

/** Extract a short description from a text section */
export function extractDescription(section: string): string | null {
  const lines = section.split("\n").slice(1);
  const textLines = lines
    .map((line) =>
      line
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[#*_]/g, "")
        .trim()
    )
    .filter((line) => line.length > 10 && !line.match(/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i));

  return textLines.length > 0 ? textLines[0].slice(0, 300) : null;
}

/** Strip HTML tags from text */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// -----------------------------------------------
// Markdown event parser (used by Apify strategy)
// -----------------------------------------------

/** Parse events from markdown content */
export function parseEventsFromMarkdown(
  markdown: string,
  defaultCategories: string[]
): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const currentYear = new Date().getFullYear();

  const sections = markdown.split(/(?=###?\s)/);

  for (const section of sections) {
    const headingMatch = section.match(/^###?\s*\[?([^\]\n]+)\]?/);
    if (!headingMatch) continue;

    const eventName = headingMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*/g, "")
      .replace(/\\n/g, " ")
      .trim();

    if (isNonEventHeading(eventName)) continue;

    const dateInfo = extractDate(section, currentYear);
    if (!dateInfo) continue;

    const timeInfo = extractTime(section);
    const costInfo = extractCost(section);

    const urlMatch = section.match(/\[Learn More\]\(([^)]+)\)/i) ||
                     section.match(/\[(?:More Info|Details|Register)\]\(([^)]+)\)/i);
    const imageMatch = section.match(/!\[[^\]]*\]\(([^)]+)\)/);

    events.push({
      name: eventName,
      description: extractDescription(section),
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
      source_url: urlMatch ? urlMatch[1] : null,
      image_url: imageMatch ? imageMatch[1] : null,
    });
  }

  return events;
}

// -----------------------------------------------
// Date formatting helper
// -----------------------------------------------

/** Format a date as YYYY-MM-DD */
export function formatDateStr(monthName: string, day: number, year: number): string {
  const monthNames: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const month = monthNames[monthName.toLowerCase()];
  const date = new Date(year, month, day);
  return date.toISOString().split("T")[0];
}
