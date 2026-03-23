-- STOP: Run this SQL in Supabase before testing
-- Adds attended_date column to track which specific date a user plans to attend for multi-day events

ALTER TABLE user_event_interactions
ADD COLUMN IF NOT EXISTS attended_date DATE;

-- Backfill: for existing "attending" interactions, set attended_date to the event's start_date
UPDATE user_event_interactions uei
SET attended_date = e.start_date::date
FROM events e
WHERE uei.event_id = e.id
  AND uei.interaction_type = 'attending'
  AND uei.attended_date IS NULL;
