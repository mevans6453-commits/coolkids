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
  // If heading looks like a date (e.g. "April 1st", "March 20th"), it IS event-related
  if (/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?$/i.test(name.trim())) {
    return false;
  }

  // If heading looks like a time range (e.g. "10 AM – 12 PM", "9:30 AM"), skip it
  if (/^\d{1,2}(:\d{2})?\s*(am|pm)/i.test(name.trim())) {
    return true;
  }

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

  // Pattern: "March 21" or "April 1st" (full month + day, optional ordinal, no year)
  // Negative lookahead ensures we don't steal "March 21, 2026" from pattern 2
  const monthDayNoYear =
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?!\s*,?\s*\d{4})/i;
  const mdnyMatch = text.match(monthDayNoYear);
  if (mdnyMatch) {
    return {
      start_date: formatDateStr(mdnyMatch[1], parseInt(mdnyMatch[2]), currentYear),
      end_date: null,
    };
  }

  // Pattern: "Mar 21" or "Apr 1st" (short month first, then day — reverse of "21 Mar")
  const revShortDateRegex =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?/i;
  const revShortMatch = text.match(revShortDateRegex);
  if (revShortMatch) {
    const monthNames: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const month = monthNames[revShortMatch[1].toLowerCase()];
    const day = parseInt(revShortMatch[2]);
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

/** Strip HTML tags from text, preserving decoded entities */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// -----------------------------------------------
// Event type classification
// -----------------------------------------------

/** Classify an event as 'event' (real event) or 'hours' (venue availability/seasons) */
export function classifyEventType(
  name: string,
  description: string | null,
  startDate: string,
  endDate: string | null,
  isRecurring?: boolean
): "event" | "hours" {
  const text = `${name} ${description || ""}`.toLowerCase();
  const titleLower = name.toLowerCase();

  const eventPatterns = /\b(festival|workshop|camp|class|show|concert|special|holiday|celebration|fundraiser|tournament|storytime|story\s*time|craft|demo|demonstration|lecture|performance|exhibit\s*opening|parade|egg\s*hunt|trick.or.treat|field\s*trip|gala|auction|run|race|hike)\b/i;
  const hoursPatterns = /\b(open|hours|admission|general\s*admission|daily|regular\s*hours|season$)\b/i;

  // Event keywords always win
  if (eventPatterns.test(text)) return "event";

  // Hours keywords in title
  if (hoursPatterns.test(titleLower)) return "hours";

  // Spans 28+ days with no event keywords → likely hours/seasonal
  if (startDate && endDate) {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    const daySpan = (end.getTime() - start.getTime()) / 86400000;
    if (daySpan >= 28) return "hours";
  }

  // Weekly recurring with no end date → likely hours
  if (isRecurring && !endDate) return "hours";

  return "event";
}

// -----------------------------------------------
// Age range extraction
// -----------------------------------------------

/** Extract age range from text. Returns null fields if can't determine — don't guess. */
export function extractAge(
  text: string
): { age_range_min: number | null; age_range_max: number | null } {
  const lower = text.toLowerCase();

  // "all ages"
  if (/\ball\s*ages\b/.test(lower)) {
    return { age_range_min: 0, age_range_max: 99 };
  }

  // Named age groups
  const namedGroups: [RegExp, number, number][] = [
    [/\b(infant|infants|baby|babies)\b/, 0, 1],
    [/\b(toddler|toddlers)\b/, 0, 2],
    [/\b(preschool|pre-school|pre\s*k|prek)\b/, 3, 5],
    [/\b(kindergarten|kinder)\b/, 5, 6],
    [/\b(elementary)\b/, 6, 10],
    [/\b(tween|tweens)\b/, 9, 12],
    [/\b(teen|teens|teenager|teenagers)\b/, 13, 17],
    [/\b(middle\s*school)\b/, 11, 14],
    [/\b(high\s*school)\b/, 14, 18],
  ];

  for (const [pattern, min, max] of namedGroups) {
    if (pattern.test(lower)) {
      return { age_range_min: min, age_range_max: max };
    }
  }

  // "ages 3-5", "age 3 to 5", "ages 3 – 5"
  const rangeMatch = lower.match(/ages?\s*:?\s*(\d{1,2})\s*[-–—to]+\s*(\d{1,2})/);
  if (rangeMatch) {
    return { age_range_min: parseInt(rangeMatch[1]), age_range_max: parseInt(rangeMatch[2]) };
  }

  // "must be 8+", "ages 5+", "age 3 and up"
  const minOnlyMatch = lower.match(/(?:ages?\s*:?\s*|must\s+be\s+)(\d{1,2})\s*(?:\+|and\s+(?:up|older|above))/);
  if (minOnlyMatch) {
    return { age_range_min: parseInt(minOnlyMatch[1]), age_range_max: null };
  }

  // "under 3", "5 and under"
  const maxOnlyMatch = lower.match(/(?:under\s+|(\d{1,2})\s+and\s+(?:under|younger))(\d{1,2})?/);
  if (maxOnlyMatch) {
    const val = parseInt(maxOnlyMatch[2] || maxOnlyMatch[1]);
    if (!isNaN(val)) return { age_range_min: 0, age_range_max: val };
  }

  // "grades K-5" → approximate as age 5+grade
  const gradeMatch = lower.match(/grades?\s*(\d{1,2})\s*[-–—to]+\s*(\d{1,2})/);
  if (gradeMatch) {
    return { age_range_min: parseInt(gradeMatch[1]) + 5, age_range_max: parseInt(gradeMatch[2]) + 5 };
  }

  return { age_range_min: null, age_range_max: null };
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

    let eventName = headingMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*/g, "")
      .replace(/\\n/g, " ")
      .trim();

    if (isNonEventHeading(eventName)) continue;

    const dateInfo = extractDate(section, currentYear);
    if (!dateInfo) continue;

    // If heading is a date+time string (e.g. "Saturday, March 28, 2026 7:00 AM — 9:00 AM"),
    // extract the real event name from the first non-empty line after the heading
    if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s/i.test(eventName) ||
        /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d/i.test(eventName)) {
      const bodyLines = section.split("\n").slice(1)
        .map((l) => l.replace(/[#*_\[\]()]/g, "").trim())
        .filter((l) => l.length > 3 && !/^\d/.test(l) && !/^http/i.test(l) && !/^!\[/.test(l));
      if (bodyLines.length > 0) {
        eventName = bodyLines[0].slice(0, 120);
      } else {
        continue; // No real name found, skip this entry
      }
    }

    const timeInfo = extractTime(section);
    const costInfo = extractCost(section);

    const urlMatch = section.match(/\[Learn More\]\(([^)]+)\)/i) ||
                     section.match(/\[(?:More Info|Details|Register)\]\(([^)]+)\)/i);
    const imageMatch = section.match(/!\[[^\]]*\]\(([^)]+)\)/);

    const desc = extractDescription(section);
    const ageInfo = extractAge(`${eventName} ${desc || ""} ${section}`);
    const eventType = classifyEventType(eventName, desc, dateInfo.start_date, dateInfo.end_date);

    events.push({
      name: eventName,
      description: desc,
      start_date: dateInfo.start_date,
      end_date: dateInfo.end_date,
      start_time: timeInfo?.start_time || null,
      end_time: timeInfo?.end_time || null,
      cost: costInfo?.cost || null,
      cost_min: costInfo?.cost_min ?? null,
      cost_max: costInfo?.cost_max ?? null,
      is_free: costInfo?.is_free || false,
      pricing_notes: costInfo?.pricing_notes ?? null,
      age_range_min: ageInfo.age_range_min,
      age_range_max: ageInfo.age_range_max,
      event_type: eventType,
      categories: [...defaultCategories],
      source_url: urlMatch ? urlMatch[1] : null,
      image_url: imageMatch ? imageMatch[1] : null,
    });
  }

  // Fallback: WordPress calendar links [Event Name](url?occurrence=YYYY-MM-DD)
  if (events.length === 0) {
    const wpEvents = parseWordPressCalendarLinks(markdown, defaultCategories, currentYear);
    if (wpEvents.length > 0) {
      return wpEvents;
    }
  }

  return events;
}

/**
 * Parse events from WordPress calendar-style markdown links.
 * Pattern: [Event Name](https://site.com/events/slug/?occurrence=2026-03-21)
 * These repeat for every day the event runs. We deduplicate by name,
 * keeping only the earliest future occurrence.
 */
function parseWordPressCalendarLinks(
  markdown: string,
  defaultCategories: string[],
  currentYear: number
): ScrapedEvent[] {
  const today = new Date().toISOString().split("T")[0];
  // Match: [Event Name](url?occurrence=YYYY-MM-DD)
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]*[?&]occurrence=(\d{4}-\d{2}-\d{2})[^)]*)\)/g;
  
  // Collect all events, tracking first future occurrence per name
  const eventMap = new Map<string, { name: string; url: string; firstDate: string; allDates: string[] }>();
  
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    const name = match[1].trim();
    const url = match[2];
    const date = match[3];
    
    // Skip past dates
    if (date < today) continue;
    
    const existing = eventMap.get(name);
    if (existing) {
      existing.allDates.push(date);
      if (date < existing.firstDate) {
        existing.firstDate = date;
        existing.url = url;
      }
    } else {
      eventMap.set(name, { name, url, firstDate: date, allDates: [date] });
    }
  }

  const events: ScrapedEvent[] = [];
  for (const [, entry] of eventMap) {
    if (isNonEventHeading(entry.name)) continue;

    const sortedDates = [...entry.allDates].sort();
    const endDate = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : null;
    
    const ageInfo = extractAge(entry.name);
    const eventType = classifyEventType(entry.name, null, entry.firstDate, endDate);

    events.push({
      name: entry.name,
      description: null,
      start_date: entry.firstDate,
      end_date: endDate,
      start_time: null,
      end_time: null,
      cost: null,
      cost_min: null,
      cost_max: null,
      is_free: false,
      pricing_notes: null,
      age_range_min: ageInfo.age_range_min,
      age_range_max: ageInfo.age_range_max,
      event_type: eventType,
      categories: [...defaultCategories],
      source_url: entry.url,
      image_url: null,
    });
  }

  if (events.length > 0) {
    console.log(`[Parse] WordPress calendar detected: ${eventMap.size} unique events from ${Array.from(eventMap.values()).reduce((sum, e) => sum + e.allDates.length, 0)} total links`);
  }

  return events;
}

// -----------------------------------------------
// Event validation & filtering (pre-save gate)
// -----------------------------------------------

export type ValidationResult = {
  valid: ScrapedEvent[];
  rejected: { event: ScrapedEvent; reason: string }[];
  consolidated: ScrapedEvent[]; // daily attractions merged into one "hours" entry
};

/**
 * Validate and filter scraped events before saving to the database.
 * Rejects junk, past events, cancellations. Consolidates daily-repeat
 * attractions into single "hours" entries with date ranges.
 */
export function validateScrapedEvents(
  events: ScrapedEvent[],
  venueName: string
): ValidationResult {
  const today = new Date().toISOString().split("T")[0];
  const valid: ScrapedEvent[] = [];
  const rejected: { event: ScrapedEvent; reason: string }[] = [];

  // ---- Pass 1: Individual event validation ----
  const passedIndividual: ScrapedEvent[] = [];

  for (const e of events) {
    let name = (e.name || "").trim();
    let lower = name.toLowerCase();
    const desc = (e.description || "").toLowerCase();
    const combined = `${lower} ${desc}`;

    // 1. Name too short or empty
    if (name.length < 5) {
      rejected.push({ event: e, reason: `Name too short: "${name}"` });
      continue;
    }

    // 2. Name is really a date ("Saturday, March 14, 2026", "April 1st", "December 2020")
    //    But try to rescue by extracting real name from description first
    const looksLikeDate =
      /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(lower) ||
      /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\s*,?\s*\d{0,4}$/i.test(lower.trim());
    if (looksLikeDate) {
      // Try to extract real name from first line of description
      const descLines = (e.description || "").split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 3 && !/^\d/.test(l));
      if (descLines.length > 0 && descLines[0].length >= 5 && descLines[0].length <= 120) {
        e.name = descLines[0];
        name = e.name;
        lower = name.toLowerCase();
      } else {
        rejected.push({ event: e, reason: `Date scraped as name: "${name}"` });
        continue;
      }
    }

    // 3. Name is really a time ("10:30AM 12PM", "10 AM 12 PM")
    if (/^\d{1,2}(:\d{2})?\s*(am|pm)/i.test(lower)) {
      rejected.push({ event: e, reason: `Time scraped as name: "${name}"` });
      continue;
    }

    // 4. Name is a page title / navigation element / ad / CTA / social post
    const pageTitlePatterns = [
      /^events?\s*calendar$/i, /^upcoming\s*events$/i, /^what.s\s*happening/i,
      /^shows?\s*and\s*screenings$/i, /^calendar\s*of\s*events$/i,
      /^things\s*to\s*do$/i, /^plan\s*your\s*visit$/i, /^visit\s*us$/i,
      /^hours\s*(and|&)\s*(admission|info)/i, /^ticket\s*info/i,
      /^event\s*(filters?|items?|list|results?)$/i, /^filter\s*events$/i,
      /^load\s*more$/i, /^see\s*(all|more)\s*events$/i, /^view\s*(all|more)$/i,
      /^annual\s*report/i, /^about\s*(us)?$/i, /^contact(\s*us)?$/i,
      /^directions$/i, /^faq$/i, /^gift\s*(shop|card)/i, /^membership/i,
      /^privacy/i, /^terms/i, /^menu$/i, /^donate$/i, /^volunteer$/i,
      /^careers$/i, /^jobs$/i, /^newsletter$/i, /^sign\s*up$/i,
      /\border\s*(now|today)/i, /\bbuy\s*(now|today)/i, /\bshop\s*(now|today)/i,
      /^new\s*book\s*order/i, /^opening\s*(november|december|january|february)/i,
    ];
    if (pageTitlePatterns.some((p) => p.test(lower))) {
      rejected.push({ event: e, reason: `Page title/nav/ad: "${name}"` });
      continue;
    }

    // 5. Social media post scraped as event (starts with casual language)
    if (/^(yep|hey|wow|omg|check\s*out|guess\s*what|who\s*else|can\s*you\s*believe)/i.test(lower)) {
      rejected.push({ event: e, reason: `Social media post: "${name}"` });
      continue;
    }

    // 6. Name is a location/city (single word or very short with no event-like words)
    const cityNames = ["atlanta", "gainesville", "roswell", "canton", "woodstock", "alpharetta", "marietta", "kennesaw"];
    if (cityNames.includes(lower.trim())) {
      rejected.push({ event: e, reason: `City name as event: "${name}"` });
      continue;
    }

    // 7. Canceled events
    if (/\b(cancell?ed|postponed indefinitely)\b/i.test(combined)) {
      rejected.push({ event: e, reason: `Canceled: "${name}"` });
      continue;
    }

    // 8. Closures (museum closed, park closed, holiday closure, etc.)
    if (/\b(closed|closure|closing\s*early)\b/i.test(lower)) {
      rejected.push({ event: e, reason: `Closure notice: "${name}"` });
      continue;
    }

    // 9. Past events
    const endCheck = e.end_date || e.start_date;
    if (endCheck && endCheck < today) {
      rejected.push({ event: e, reason: `Past event: ends ${endCheck}` });
      continue;
    }

    // 10. Junk description content (reviews, phone numbers as content)
    if (desc.length > 0 && desc.length < 15 && /^\d{3}[-.]?\d{3}[-.]?\d{4}$/.test(desc.trim())) {
      rejected.push({ event: e, reason: `Phone number as description: "${name}"` });
      continue;
    }

    // 11. Decode HTML entities in name and description
    e.name = decodeHtmlEntities(name);
    e.description = e.description ? decodeHtmlEntities(e.description) : null;

    // 12. Clean up marketing sentence prefixes from event names
    // Only trim if what remains is still a meaningful name (10+ chars)
    const originalName = e.name;
    let trimmedName = e.name
      .replace(/^(join\s+us\s+(for|at)\s+)/i, "")
      .replace(/^(come\s+(out\s+)?(to|for|join)\s+(us\s+(for|at)\s+)?)/i, "")
      .replace(/^(experience\s+the\s+\w+\s+of\s+the\s+\w+\s+at\s+)/i, "")
      .replace(/^(experience\s+the\s+\w+\s+of\s+)/i, "")
      .replace(/^(don'?t\s+miss\s+(our\s+)?)/i, "")
      .replace(/^(we'?re\s+(excited|thrilled|happy)\s+to\s+(announce|present|host)\s+)/i, "")
      .replace(/^(you'?re\s+invited\s+to\s+)/i, "")
      .replace(/^(celebrate\s+with\s+us\s+(at\s+)?)/i, "")
      .trim();
    // Only use the trimmed version if it still looks like a real event name
    if (trimmedName.length >= 10 && trimmedName !== originalName) {
      e.name = trimmedName;
    }
    // Re-capitalize first letter after trimming
    if (e.name.length > 0) {
      e.name = e.name.charAt(0).toUpperCase() + e.name.slice(1);
    }

    // 13. Validate times — reject impossible values
    if (e.start_time) {
      const timeMatch = e.start_time.match(/^(\d{1,2})(:\d{2})?\s*(AM|PM)$/i);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        if (hour > 12 || hour === 0) {
          e.start_time = null; // Invalid hour, clear it
        }
      } else {
        e.start_time = null; // Doesn't match time format at all
      }
    }
    if (e.end_time) {
      const timeMatch = e.end_time.match(/^(\d{1,2})(:\d{2})?\s*(AM|PM)$/i);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        if (hour > 12 || hour === 0) {
          e.end_time = null;
        }
      } else {
        e.end_time = null;
      }
    }

    passedIndividual.push(e);
  }

  // ---- Pass 2: Detect daily-repeat attractions ----
  // Group by name, count how many distinct dates per name
  const nameGroups = new Map<string, ScrapedEvent[]>();
  for (const e of passedIndividual) {
    const key = e.name;
    if (!nameGroups.has(key)) nameGroups.set(key, []);
    nameGroups.get(key)!.push(e);
  }

  // Event keywords that should NEVER be consolidated into hours
  // (festivals, shows, concerts etc. that legitimately run on multiple days)
  const realEventPattern = /\b(festival|fest|show|concert|performance|gala|fundraiser|run|race|5k|parade|egg.hunt|trick.or.treat|fireworks|celebration|fair|expo|tournament|camp|workshop)\b/i;

  const consolidated: ScrapedEvent[] = [];
  for (const [name, group] of nameGroups) {
    // Skip consolidation for names with event keywords — these are real multi-day events
    const hasEventKeywords = realEventPattern.test(name);

    if (group.length >= 3 && !hasEventKeywords) {
      // 3+ instances of the same name WITHOUT event keywords = daily attraction/exhibit
      // Consolidate into one "hours" entry with the full date range
      const sorted = [...group].sort((a, b) => a.start_date.localeCompare(b.start_date));
      const merged: ScrapedEvent = {
        ...sorted[0],
        end_date: sorted[sorted.length - 1].end_date || sorted[sorted.length - 1].start_date,
        event_type: "hours",
      };
      consolidated.push(merged);
      // Add all but the first to rejected
      for (let i = 1; i < sorted.length; i++) {
        rejected.push({ event: sorted[i], reason: `Daily attraction consolidated (${group.length} instances): "${name}"` });
      }
      // The first one goes to valid as the consolidated entry
      valid.push(merged);
    } else {
      // Normal events — pass through
      valid.push(...group);
    }
  }

  // ---- Pass 3: Deduplicate within batch (exact + fuzzy name match on same date) ----
  const deduped: ScrapedEvent[] = [];
  for (const e of valid) {
    // Check for exact or fuzzy match against already-accepted events
    const isDupe = deduped.some((existing) => {
      if (existing.start_date !== e.start_date) return false;
      // Exact match
      if (existing.name === e.name) return true;
      // Fuzzy: normalize both names and compare
      const normA = existing.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normB = e.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      // One name starts with the other (catches "Art For Lunch: Mark Medley" vs "Art For Lunch: Mark Medley: The West...")
      if (normA.startsWith(normB) || normB.startsWith(normA)) return true;
      // Very similar (>80% overlap by length after normalization)
      if (normA.length > 10 && normB.length > 10) {
        const shorter = normA.length < normB.length ? normA : normB;
        const longer = normA.length < normB.length ? normB : normA;
        if (longer.includes(shorter)) return true;
      }
      return false;
    });
    if (isDupe) {
      rejected.push({ event: e, reason: `Fuzzy duplicate: "${e.name}" on ${e.start_date}` });
      continue;
    }
    deduped.push(e);
  }

  return {
    valid: deduped,
    rejected,
    consolidated,
  };
}

/** Decode common HTML entities */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#038;/g, "&").replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "\u2013").replace(/&ndash;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014").replace(/&mdash;/g, "\u2014")
    .replace(/&#8216;/g, "\u2018").replace(/&lsquo;/g, "\u2018")
    .replace(/&#8217;/g, "\u2019").replace(/&rsquo;/g, "\u2019")
    .replace(/&#8220;/g, "\u201C").replace(/&ldquo;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D").replace(/&rdquo;/g, "\u201D")
    .replace(/&#8230;/g, "\u2026").replace(/&hellip;/g, "\u2026")
    .replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
