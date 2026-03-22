-- =============================================
-- Create user_venue_preferences table
-- STOP: Run this SQL in Supabase SQL Editor before testing
-- =============================================

CREATE TABLE user_venue_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, venue_id)
);

ALTER TABLE user_venue_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_venue_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences"
  ON user_venue_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences"
  ON user_venue_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences"
  ON user_venue_preferences FOR DELETE USING (auth.uid() = user_id);
