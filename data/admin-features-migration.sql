-- =============================================
-- Admin Features Migration — Event Classification + Age
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add event_type column (age_range_min/max already exist)
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'event'
  CHECK (event_type IN ('event', 'hours'));

-- 2. Allow updating events (for inline editing on admin dashboard)
CREATE POLICY "Allow updating events"
  ON events FOR UPDATE
  USING (true)
  WITH CHECK (true);
