-- =============================================
-- Venue Suggestions RLS — Phase 4
-- Run this in Supabase SQL Editor
-- =============================================

-- Allow anyone (logged in or not) to submit a venue suggestion
CREATE POLICY "Anyone can submit venue suggestions"
  ON venue_suggestions FOR INSERT
  WITH CHECK (true);

-- Only allow reading for authenticated users (optional: or make public)
CREATE POLICY "Venue suggestions are publicly readable"
  ON venue_suggestions FOR SELECT
  USING (true);
