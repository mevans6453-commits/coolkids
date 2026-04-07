import { describe, it, expect } from "vitest";
import {
  isNonEventHeading,
  extractAge,
  classifyEventType,
  extractDate,
  formatDateStr,
} from "@/scrapers/parse-utils";

// -----------------------------------------------
// isNonEventHeading
// -----------------------------------------------
describe("isNonEventHeading", () => {
  it("flags common navigation/UI headings as non-events", () => {
    expect(isNonEventHeading("Become a Member")).toBe(true);
    expect(isNonEventHeading("Buy Tickets")).toBe(true);
    expect(isNonEventHeading("Newsletter")).toBe(true);
    expect(isNonEventHeading("Contact")).toBe(true);
    expect(isNonEventHeading("Calendar")).toBe(true);
    expect(isNonEventHeading("Today")).toBe(true);
    expect(isNonEventHeading("Footer")).toBe(true);
  });

  it("flags time-of-day headings as non-events", () => {
    expect(isNonEventHeading("10 AM – 12 PM")).toBe(true);
    expect(isNonEventHeading("9:30 AM")).toBe(true);
  });

  it("flags raw URLs and pure numbers", () => {
    expect(isNonEventHeading("https://example.com/event")).toBe(true);
    expect(isNonEventHeading("12345")).toBe(true);
  });

  it("does NOT flag date-like headings (those are events)", () => {
    expect(isNonEventHeading("April 1st")).toBe(false);
    expect(isNonEventHeading("March 20th")).toBe(false);
  });

  it("does NOT flag real event names", () => {
    expect(isNonEventHeading("Spring Egg Hunt")).toBe(false);
    expect(isNonEventHeading("Summer Concert Series")).toBe(false);
    expect(isNonEventHeading("Storytime with Miss Jenny")).toBe(false);
  });
});

// -----------------------------------------------
// extractAge
// -----------------------------------------------
describe("extractAge", () => {
  it('handles "all ages"', () => {
    expect(extractAge("Open to all ages")).toEqual({
      age_range_min: 0,
      age_range_max: 99,
    });
  });

  it("handles named age groups", () => {
    expect(extractAge("Toddler storytime")).toEqual({
      age_range_min: 0,
      age_range_max: 2,
    });
    expect(extractAge("Preschool art class")).toEqual({
      age_range_min: 3,
      age_range_max: 5,
    });
    expect(extractAge("Teen book club")).toEqual({
      age_range_min: 13,
      age_range_max: 17,
    });
  });

  it("handles numeric ranges", () => {
    expect(extractAge("Ages 3-5 welcome")).toEqual({
      age_range_min: 3,
      age_range_max: 5,
    });
    expect(extractAge("ages 6 to 10")).toEqual({
      age_range_min: 6,
      age_range_max: 10,
    });
  });

  it("handles minimum-only patterns", () => {
    expect(extractAge("Ages 8+")).toEqual({
      age_range_min: 8,
      age_range_max: null,
    });
    expect(extractAge("must be 12 and older")).toEqual({
      age_range_min: 12,
      age_range_max: null,
    });
  });

  it("handles grade ranges (offset by 5 to age)", () => {
    expect(extractAge("Grades 1-5")).toEqual({
      age_range_min: 6,
      age_range_max: 10,
    });
  });

  it("returns nulls when no age info present (does not guess)", () => {
    expect(extractAge("Family-friendly event with food trucks")).toEqual({
      age_range_min: null,
      age_range_max: null,
    });
  });
});

// -----------------------------------------------
// classifyEventType
// -----------------------------------------------
describe("classifyEventType", () => {
  it("classifies event keywords as event", () => {
    expect(
      classifyEventType("Spring Festival", null, "2026-04-15", "2026-04-15")
    ).toBe("event");
    expect(
      classifyEventType("Pottery Workshop", null, "2026-04-10", null)
    ).toBe("event");
    expect(
      classifyEventType("Summer Camp", "Week-long camp", "2026-06-01", "2026-06-05")
    ).toBe("event");
  });

  it("classifies hours/admission language as hours", () => {
    expect(
      classifyEventType("Regular Hours", null, "2026-04-01", "2026-04-30")
    ).toBe("hours");
    expect(
      classifyEventType("General Admission", null, "2026-04-01", null)
    ).toBe("hours");
  });

  it("classifies long spans (28+ days) without event keywords as hours", () => {
    expect(
      classifyEventType("Garden Open", null, "2026-04-01", "2026-05-15")
    ).toBe("hours");
  });

  it("event keywords beat long-span heuristic", () => {
    expect(
      classifyEventType("Spring Festival", null, "2026-04-01", "2026-05-15")
    ).toBe("event");
  });

  it("recurring with no end date is treated as hours", () => {
    expect(
      classifyEventType("Open to public", null, "2026-04-01", null, true)
    ).toBe("hours");
  });
});

// -----------------------------------------------
// formatDateStr
// -----------------------------------------------
describe("formatDateStr", () => {
  it("formats month name + day + year as ISO YYYY-MM-DD", () => {
    expect(formatDateStr("March", 21, 2026)).toBe("2026-03-21");
    expect(formatDateStr("January", 1, 2026)).toBe("2026-01-01");
    expect(formatDateStr("December", 31, 2026)).toBe("2026-12-31");
  });

  it("zero-pads single-digit days and months", () => {
    expect(formatDateStr("April", 5, 2026)).toBe("2026-04-05");
    expect(formatDateStr("July", 9, 2026)).toBe("2026-07-09");
  });
});

// -----------------------------------------------
// extractDate
// -----------------------------------------------
describe("extractDate", () => {
  it('parses "Saturday, March 21, 2026"', () => {
    const result = extractDate("Join us Saturday, March 21, 2026 for fun!", 2026);
    expect(result?.start_date).toBe("2026-03-21");
  });

  it('parses date ranges with "through"', () => {
    const result = extractDate(
      "Runs Monday, April 1, 2026 through Friday, April 5, 2026",
      2026
    );
    expect(result?.start_date).toBe("2026-04-01");
    expect(result?.end_date).toBe("2026-04-05");
  });

  it("returns null when no date is found", () => {
    expect(extractDate("Just some random text without a date", 2026)).toBeNull();
  });
});
