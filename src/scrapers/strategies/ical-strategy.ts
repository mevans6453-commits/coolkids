/**
 * iCal Strategy — parses .ics (iCalendar) files for VEVENT blocks.
 * Very reliable when the venue exposes a calendar feed. Plain fetch(), no API needed.
 */

import type { ScrapedEvent } from "../base-scraper";
import type { ScrapeStrategy, StrategyResult } from "./types";
import { extractAge, classifyEventType } from "../parse-utils";

const USER_AGENT = "CoolKidsBot/1.0 (family events aggregator)";

export const icalStrategy: ScrapeStrategy = {
  name: "ical",

  canAttempt(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.endsWith(".ics") || lower.endsWith(".ical") || lower.includes("webcal") || lower.includes("/calendar/");
  },

  async scrape(config): Promise<StrategyResult> {
    try {
      const url = config.scrape_url.replace(/^webcal:\/\//, "https://");

      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return { events: [], error: `HTTP ${response.status}` };
      }

      const text = await response.text();

      // Quick check: is this actually an iCal file?
      if (!text.includes("BEGIN:VCALENDAR") && !text.includes("BEGIN:VEVENT")) {
        return { events: [], error: null }; // Not iCal content
      }

      const events = parseIcal(text, config.default_categories);
      return { events, error: null };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/** Parse VEVENT blocks from iCal text */
function parseIcal(text: string, defaultCategories: string[]): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];

  // Unfold lines (iCal line folding: continuation lines start with space/tab)
  const unfolded = text.replace(/\r\n[\t ]/g, "").replace(/\r/g, "");

  // Split into VEVENT blocks
  const vevents = unfolded.split("BEGIN:VEVENT");

  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split("END:VEVENT")[0];

    const name = getIcalProp(block, "SUMMARY");
    if (!name) continue;

    const dtstart = getIcalProp(block, "DTSTART") || getIcalParamProp(block, "DTSTART");
    if (!dtstart) continue;

    const dtend = getIcalProp(block, "DTEND") || getIcalParamProp(block, "DTEND");
    const description = getIcalProp(block, "DESCRIPTION")
      ?.replace(/\\n/g, " ")
      ?.replace(/\\,/g, ",")
      ?.slice(0, 300) || null;
    const url = getIcalProp(block, "URL");
    const location = getIcalProp(block, "LOCATION");

    const startDate = parseIcalDate(dtstart);
    const endDate = dtend ? parseIcalDate(dtend) : null;
    const startTime = parseIcalTime(dtstart);
    const endTime = dtend ? parseIcalTime(dtend) : null;

    if (!startDate) continue;

    events.push({
      name: name.replace(/\\,/g, ",").replace(/\\;/g, ";"),
      description,
      start_date: startDate,
      end_date: endDate !== startDate ? endDate : null,
      start_time: startTime,
      end_time: endTime,
      cost: null,
      cost_min: null,
      cost_max: null,
      is_free: false,
      pricing_notes: null,
      ...extractAge(`${name} ${description || ""}`),
      event_type: classifyEventType(name, description, startDate!, endDate !== startDate ? endDate : null),
      categories: [...defaultCategories],
      source_url: url || null,
      image_url: null,
    });
  }

  return events;
}

/** Get a simple iCal property value (e.g. "SUMMARY:My Event") */
function getIcalProp(block: string, prop: string): string | null {
  const regex = new RegExp(`^${prop}:(.*)$`, "mi");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

/** Get an iCal property with parameters (e.g. "DTSTART;VALUE=DATE:20260321") */
function getIcalParamProp(block: string, prop: string): string | null {
  const regex = new RegExp(`^${prop};[^:]*:(.*)$`, "mi");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

/** Parse iCal date string to YYYY-MM-DD ("20260321" or "20260321T100000Z") */
function parseIcalDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** Parse iCal datetime to time string ("20260321T100000" -> "10 AM") */
function parseIcalTime(dateStr: string): string | null {
  const match = dateStr.match(/T(\d{2})(\d{2})\d{2}/);
  if (!match) return null;
  const h = parseInt(match[1]);
  const m = match[2];
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === "00" ? `${h12} ${period}` : `${h12}:${m} ${period}`;
}
