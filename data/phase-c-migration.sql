-- ===========================================
-- CoolKids - Phase C Migration
-- Run this in the Supabase SQL Editor
-- ===========================================

-- 1. Extend interaction types to support "hidden" and "reported"
ALTER TABLE user_event_interactions
  DROP CONSTRAINT IF EXISTS user_event_interactions_interaction_type_check;

ALTER TABLE user_event_interactions
  ADD CONSTRAINT user_event_interactions_interaction_type_check
  CHECK (interaction_type IN ('star', 'attending', 'hidden', 'reported'));

-- 2. Add report_reason column for reported events
ALTER TABLE user_event_interactions
  ADD COLUMN IF NOT EXISTS report_reason text;

-- 3. Index for efficient hidden-event lookups per user
CREATE INDEX IF NOT EXISTS idx_interactions_hidden
  ON user_event_interactions(user_id, interaction_type)
  WHERE interaction_type = 'hidden';

-- 4. Add pricing_notes field to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS pricing_notes text;
