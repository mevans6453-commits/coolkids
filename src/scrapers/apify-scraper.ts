/**
 * Apify Scraper — uses Apify's RAG Web Browser to fetch venue pages
 * and extract event information from the markdown content.
 * 
 * How it works:
 * 1. Sends the venue URL to Apify's web browser actor
 * 2. Gets back the page content as markdown
 * 3. Parses the markdown to find events (dates, times, descriptions)
 * 4. Returns structured event data ready for the database
 */

import type { ScrapedEvent, ScrapeResult, VenueConfig } from "./base-scraper";

// Apify API configuration
const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || "";

/**
 * Scrape a venue's events page using Apify RAG Web Browser
 */
export async function scrapeWithApify(config: VenueConfig): Promise<ScrapeResult> {
  const startTime = new Date().toISOString();

  try {
    console.log(`[Apify] Scraping: ${config.venue_name} (${config.scrape_url})`);

    // Step 1: Call Apify RAG Web Browser to fetch the page
    const markdown = await fetchPageMarkdown(config.scrape_url);

    if (!markdown || markdown.trim().length === 0) {
      return {
        venue_id: config.venue_id,
        venue_name: config.venue_name,
        events: [],
        error: "No content returned from page",
        scraped_at: startTime,
      };
    }

    // Step 2: Parse events from the markdown
    let events: ScrapedEvent[];
    if (config.parseEvents) {
      // Use custom parser if the venue has one
      events = config.parseEvents(markdown);
    } else {
      // Use the generic markdown parser
      events = parseEventsFromMarkdown(markdown, config.default_categories);
    }

    console.log(`[Apify] Found ${events.length} events for ${config.venue_name}`);

    return {
      venue_id: config.venue_id,
      venue_name: config.venue_name,
      events,
      error: null,
      scraped_at: startTime,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Apify] Error scraping ${config.venue_name}: ${message}`);
    return {
      venue_id: config.venue_id,
      venue_name: config.venue_name,
      events: [],
      error: message,
      scraped_at: startTime,
    };
  }
}

/**
 * Fetch a page's content as markdown using Apify RAG Web Browser
 */
async function fetchPageMarkdown(url: string): Promise<string> {
  // Call the Apify actor to scrape the URL
  const runUrl = `${APIFY_BASE_URL}/acts/apify~rag-web-browser/runs?token=${APIFY_TOKEN}`;

  const response = await fetch(runUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: url,
      maxResults: 1,
      outputFormats: ["markdown"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
  }

  const runData = await response.json();
  const datasetId = runData?.data?.defaultDatasetId;

  if (!datasetId) {
    throw new Error("No dataset ID returned from Apify");
  }

  // Wait a moment for the actor to finish, then fetch results
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Fetch the dataset items
  const datasetUrl = `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
  const datasetResponse = await fetch(datasetUrl);

  if (!datasetResponse.ok) {
    throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
  }

  const items = await datasetResponse.json();

  if (!items || items.length === 0) {
    throw new Error("No items in dataset");
  }

  return items[0].markdown || items[0].text || "";
}

/**
 * Parse events from markdown content.
 * 
 * This is a generic parser that looks for common event patterns:
 * - Headings followed by dates
 * - Date patterns like "March 21, 2026" or "Saturday, March 21, 2026"
 * - Time patterns like "10 AM - 5 PM" or "8 – 11 PM"
 */
export function parseEventsFromMarkdown(
  markdown: string,
  defaultCategories: string[]
): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const currentYear = new Date().getFullYear();

  // Split markdown into sections by headings (### or ##)
  const sections = markdown.split(/(?=###?\s)/);

  for (const section of sections) {
    // Look for a heading (event name)
    const headingMatch = section.match(/^###?\s*\[?([^\]\n]+)\]?/);
    if (!headingMatch) continue;

    const eventName = headingMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links
      .replace(/\*\*/g, "")                      // Remove bold
      .replace(/\\n/g, " ")                      // Remove escaped newlines
      .trim();

    // Skip non-event headings
    if (isNonEventHeading(eventName)) continue;

    // Look for date patterns in the section
    const dateInfo = extractDate(section, currentYear);
    if (!dateInfo) continue; // Skip sections without dates

    // Look for time patterns
    const timeInfo = extractTime(section);

    // Look for cost/price info
    const costInfo = extractCost(section);

    // Look for event URL
    const urlMatch = section.match(/\[Learn More\]\(([^)]+)\)/i) ||
                     section.match(/\[(?:More Info|Details|Register)\]\(([^)]+)\)/i);

    // Look for image URL
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
// Helper functions for parsing
// -----------------------------------------------

/** Check if a heading is NOT an event (e.g., "Become a Member", "Get Tickets") */
function isNonEventHeading(name: string): boolean {
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
    /events$/i, // Just the word "Events" as a page title
  ];
  return skipPatterns.some((p) => p.test(name));
}

/** Extract a date from a text section */
function extractDate(
  text: string,
  currentYear: number
): { start_date: string; end_date: string | null } | null {
  // Pattern: "Monday, March 21, 2026"
  const fullDateRegex =
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi;

  const matches = [...text.matchAll(fullDateRegex)];

  if (matches.length > 0) {
    const first = matches[0];
    const startDate = formatDate(first[1], parseInt(first[2]), parseInt(first[3]));

    let endDate: string | null = null;
    // Check for "through Friday, June 5, 2026" pattern
    const throughMatch = text.match(
      /through\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
    );
    if (throughMatch) {
      endDate = formatDate(throughMatch[1], parseInt(throughMatch[2]), parseInt(throughMatch[3]));
    } else if (matches.length > 1) {
      endDate = formatDate(matches[1][1], parseInt(matches[1][2]), parseInt(matches[1][3]));
    }

    return { start_date: startDate, end_date: endDate };
  }

  // Pattern: "Mar 21" or "21 Mar"
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
      return {
        start_date: date.toISOString().split("T")[0],
        end_date: null,
      };
    }
  }

  return null;
}

/** Extract time from text */
function extractTime(
  text: string
): { start_time: string; end_time: string | null } | null {
  // Pattern 1: "10 AM – 5 PM" (both have AM/PM)
  const fullRangeRegex =
    /(\d{1,2}(?::\d{2})?)\s*(AM|PM)\s*[–\-—]+\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)/i;
  const fullMatch = text.match(fullRangeRegex);
  if (fullMatch) {
    return {
      start_time: `${fullMatch[1]} ${fullMatch[2].toUpperCase()}`,
      end_time: `${fullMatch[3]} ${fullMatch[4].toUpperCase()}`,
    };
  }

  // Pattern 2: "12 – 4 PM" (only end time has AM/PM — assume same period)
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

  // Pattern 3: single time "9:30 AM"
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

/** Extract cost information from text */
function extractCost(
  text: string
): { cost: string; cost_min: number; cost_max: number; is_free: boolean; pricing_notes: string | null } | null {
  const result = { cost: "", cost_min: 0, cost_max: 0, is_free: false, pricing_notes: null as string | null };

  // Look for pricing notes: discount/free mentions for specific groups
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

  // Check for free (but not "free for X" which is conditional)
  if (/\bfree\s*(?:admission|entry|event)?\b/i.test(text) && !/free\s+for\b/i.test(text)) {
    result.cost = "Free";
    result.is_free = true;
    return result;
  }

  // Range: "$8-$12", "$8 - $12", "$8–$12"
  const rangeMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*[-–—]\s*\$?(\d+(?:\.\d{2})?)/);
  if (rangeMatch) {
    result.cost_min = parseFloat(rangeMatch[1]);
    result.cost_max = parseFloat(rangeMatch[2]);
    result.cost = `$${rangeMatch[1]}-$${rangeMatch[2]}`;
    return result;
  }

  // Single price with context: "$30 per person", "$10/child"
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

/** Extract a short description from the section */
function extractDescription(section: string): string | null {
  // Get text after the heading, remove markdown formatting
  const lines = section.split("\n").slice(1);
  const textLines = lines
    .map((line) =>
      line
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // Remove images
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
        .replace(/[#*_]/g, "") // Remove markdown formatting
        .trim()
    )
    .filter((line) => line.length > 10 && !line.match(/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i));

  return textLines.length > 0 ? textLines[0].slice(0, 300) : null;
}

/** Format a date as YYYY-MM-DD */
function formatDate(monthName: string, day: number, year: number): string {
  const monthNames: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const month = monthNames[monthName.toLowerCase()];
  const date = new Date(year, month, day);
  return date.toISOString().split("T")[0];
}
