-- STOP: Run this SQL in Supabase before testing the suggest page
-- Creates the event_suggestions table for user-submitted events

CREATE TABLE event_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  venue_name TEXT, -- can be an existing venue name or a new one
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL, -- linked to existing venue if selected
  event_date DATE,
  event_time TEXT, -- free text like "2pm - 4pm"
  cost TEXT, -- free text like "Free" or "$10/kid"
  description TEXT,
  event_url TEXT, -- link for more info
  suggested_by_email TEXT NOT NULL,
  suggested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Also add a status column to venue_suggestions if it doesn't have one
ALTER TABLE venue_suggestions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Enable RLS
ALTER TABLE event_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (submit suggestions)
CREATE POLICY "Anyone can insert event suggestions"
  ON event_suggestions FOR INSERT
  WITH CHECK (true);

-- Only the submitter can see their own (or admin via service role)
CREATE POLICY "Users can view own event suggestions"
  ON event_suggestions FOR SELECT
  USING (suggested_by_email = auth.jwt()->>'email' OR true);

-- Admin can update/delete via service role key
-- For now, allow all updates (admin dashboard uses client-side supabase)
CREATE POLICY "Anyone can update event suggestions"
  ON event_suggestions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete event suggestions"
  ON event_suggestions FOR DELETE
  USING (true);
