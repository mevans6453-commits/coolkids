-- =============================================
-- Multi-Strategy Scraper System — Phase 4
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create scrape_runs table to log every scrape attempt
CREATE TABLE IF NOT EXISTS scrape_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  strategy text NOT NULL,
  events_found integer NOT NULL DEFAULT 0,
  events_saved integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'empty', 'error')),
  error_message text,
  duration_ms integer NOT NULL DEFAULT 0,
  run_date timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_venue_id ON scrape_runs(venue_id);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_run_date ON scrape_runs(run_date DESC);

ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scrape runs are publicly readable"
  ON scrape_runs FOR SELECT USING (true);

CREATE POLICY "Scrape runs can be inserted"
  ON scrape_runs FOR INSERT WITH CHECK (true);

-- 2. Add preferred_strategy column to venues
ALTER TABLE venues ADD COLUMN IF NOT EXISTS preferred_strategy text;

-- 3. Allow updating venues (so scraper can set preferred_strategy)
CREATE POLICY "Allow updating venues"
  ON venues FOR UPDATE
  USING (true)
  WITH CHECK (true);
