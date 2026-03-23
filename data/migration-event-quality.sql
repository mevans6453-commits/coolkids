-- =============================================
-- Event Quality Filtering Migration
-- 1. Add not_for_kids_reason column
-- 2. Flag existing non-kid-friendly events
-- =============================================

-- 1. Add reason column
ALTER TABLE events ADD COLUMN IF NOT EXISTS not_for_kids_reason TEXT;

-- 2. Flag known non-kid-friendly events with reasons

-- Alcohol-related
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'cocktail class'
WHERE LOWER(name) LIKE '%cocktail%' AND event_type != 'not_for_kids';

UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'bourbon/whiskey event'
WHERE (LOWER(name) LIKE '%bourbon%' OR LOWER(name) LIKE '%whiskey%') AND event_type != 'not_for_kids';

-- 21+ events
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = '21+ event'
WHERE (LOWER(name) LIKE '%21+%' OR LOWER(description) LIKE '%21+%' OR LOWER(description) LIKE '%21 and over%' OR LOWER(description) LIKE '%must be 21%')
AND event_type != 'not_for_kids';

-- Adult/Senior programs
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'AARP / senior program'
WHERE (LOWER(name) LIKE '%aarp%' OR LOWER(name) LIKE '%for adults/seniors%' OR LOWER(name) LIKE '%for seniors%')
AND event_type != 'not_for_kids';

UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult social worker program'
WHERE LOWER(name) LIKE '%ask the social worker%' AND event_type != 'not_for_kids';

-- Adult clubs/groups
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'garden club (adult)'
WHERE LOWER(name) LIKE '%garden club%' AND event_type != 'not_for_kids';

UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult run club'
WHERE LOWER(name) LIKE '%run club%' AND event_type != 'not_for_kids';

-- Adult entertainment
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult comedy show'
WHERE LOWER(name) LIKE '%comedy night%' AND event_type != 'not_for_kids';

-- Adult dining
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult brunch event'
WHERE LOWER(name) LIKE '%brunch%' AND NOT LOWER(name) LIKE '%family%' AND event_type != 'not_for_kids';

-- Adult yoga/meditation
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult yoga/meditation'
WHERE LOWER(name) LIKE '%avalom%' AND event_type != 'not_for_kids';

-- "A night of nostalgia" (Fernbank After Dark style)
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult museum night'
WHERE LOWER(name) LIKE '%night of nostalgia%' AND event_type != 'not_for_kids';

-- Adult lecture
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult lunch lecture'
WHERE LOWER(name) LIKE '%art for lunch%' AND event_type != 'not_for_kids';

-- Adult literary event
UPDATE events SET event_type = 'not_for_kids', not_for_kids_reason = 'adult literary/comedy event'
WHERE LOWER(name) LIKE '%david sedaris%' AND event_type != 'not_for_kids';

-- Verify results
SELECT name, event_type, not_for_kids_reason FROM events WHERE event_type = 'not_for_kids' ORDER BY not_for_kids_reason;
