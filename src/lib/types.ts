// ===========================================
// CoolKids - Database Types
// These match the Supabase table schemas
// ===========================================

export type Venue = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  county: string;
  state: string;
  zip: string | null;
  website: string | null;
  scrape_url: string | null;
  scrape_method: "firecrawl" | "apify" | "manual" | null;
  preferred_strategy: string | null;
  categories: string[];
  phone: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ScrapeRun = {
  id: string;
  venue_id: string;
  strategy: string;
  events_found: number;
  events_saved: number;
  status: "success" | "empty" | "error";
  error_message: string | null;
  duration_ms: number;
  run_date: string;
};

export type Event = {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  cost: string | null;
  cost_min: number | null;
  cost_max: number | null;
  is_free: boolean;
  age_range_min: number | null;
  age_range_max: number | null;
  categories: string[];
  source_url: string | null;
  image_url: string | null;
  pricing_notes: string | null;
  event_type: "event" | "hours" | "not_for_kids";
  not_for_kids_reason: string | null;
  expected_attendance: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  status: "published" | "draft" | "cancelled";
  created_at: string;
  updated_at: string;
  // Joined data (when we fetch events with venue info)
  venue?: Venue;
  // Display-only: populated by mergeConsecutiveEvents for recurring events
  recurring_dates?: { date: string; time: string | null }[];
};

export type AgeFilter = "all" | "toddler" | "preschool" | "elementary" | "tween-teen";

export const AGE_FILTER_RANGES: Record<AgeFilter, { min: number; max: number } | null> = {
  all: null,
  toddler: { min: 0, max: 2 },
  preschool: { min: 3, max: 5 },
  elementary: { min: 6, max: 10 },
  "tween-teen": { min: 11, max: 99 },
};

export type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  zip: string | null;
  max_distance_miles: number | null;
  kids_ages: number[];
  interest_categories: string[];
  is_active: boolean;
  created_at: string;
  unsubscribed_at: string | null;
};

export type VenueSuggestion = {
  id: string;
  suggested_by_email: string;
  venue_name: string;
  venue_url: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  zip: string | null;
  kids_ages: number[];
  interest_categories: string[];
  max_distance_miles: number;
  newsletter_preference: "weekly" | "monthly" | "none";
  created_at: string;
  updated_at: string;
};

export const INTEREST_CATEGORIES = [
  "farms",
  "museums",
  "outdoor",
  "arts",
  "seasonal",
  "sports",
  "free",
] as const;

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

export type DadJoke = {
  id: string;
  setup: string;
  punchline: string;
  created_at: string;
};

export type UserEventInteraction = {
  id: string;
  user_id: string;
  event_id: string;
  interaction_type: "star" | "attending" | "hidden" | "reported";
  report_reason: string | null;
  created_at: string;
};

// Category options for venues and events
export const CATEGORIES = [
  "farm",
  "museum",
  "park",
  "zoo",
  "garden",
  "outdoor",
  "arts",
  "sports",
  "seasonal",
  "market",
  "festival",
  "education",
  "aquatic",
  "free",
] as const;

export type Category = (typeof CATEGORIES)[number];
