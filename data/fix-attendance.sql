-- =============================================
-- Reset and properly set attendance
-- The previous backfill set EVERYTHING to 10000 due to a SQL bug
-- =============================================

-- Step 1: Reset all attendance to NULL
UPDATE events SET expected_attendance = NULL;

-- Step 2: Wings Over GA (known major air show — 100K+)
UPDATE events SET expected_attendance = 100000 WHERE name ILIKE '%wings over%';

-- Step 3: Drone shows, Dino Fest (5,000+)
UPDATE events SET expected_attendance = 5000 WHERE name ILIKE '%drone%show%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 5000 WHERE name ILIKE '%dino fest%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 5000 WHERE name ILIKE '%run like wild 5k%' AND expected_attendance IS NULL;

-- Step 4: Easter hunts, Easter events (2,000)
UPDATE events SET expected_attendance = 2000 WHERE name ILIKE '%egg hunt%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 2000 WHERE name ILIKE '%easter bunny%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 2000 WHERE name ILIKE '%easter fun%' AND expected_attendance IS NULL;

-- Step 5: Splash pads, spring break, cruise-ins (1,000-2,000)
UPDATE events SET expected_attendance = 1500 WHERE name ILIKE '%splash pad%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 1500 WHERE name ILIKE '%spring break%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 1000 WHERE name ILIKE '%cruise-in%' AND expected_attendance IS NULL;

-- Step 6: Markets, orchid shows, festivals (1,000)
UPDATE events SET expected_attendance = 1000 WHERE name ILIKE '%market%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 1000 WHERE name ILIKE '%orchid%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 1000 WHERE name ILIKE '%blooms%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 1000 WHERE name ILIKE '%purple madness%' AND expected_attendance IS NULL;

-- Step 7: Museum specials, Members events (500)
UPDATE events SET expected_attendance = 500 WHERE name ILIKE '%museums on us%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 500 WHERE name ILIKE '%members only%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 500 WHERE name ILIKE '%members night%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 500 WHERE name ILIKE '%track speeder%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 500 WHERE name ILIKE '%second thursday%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 500 WHERE name ILIKE '%haiku%' AND expected_attendance IS NULL;

-- Step 8: Small venue events, bands, tastings (200)
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%ensemble%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%band%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%winery%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%tasting%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%sidewalk sale%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%nana%papa%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%kiddie commuter%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%timba%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%birds of prey%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%camouflage%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%bouncing babies%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%little hopes%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%kin.%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 200 WHERE name ILIKE '%friday-sunday%' AND expected_attendance IS NULL;

-- Step 9: Classes, workshops, storytimes (50-100)
UPDATE events SET expected_attendance = 100 WHERE name ILIKE '%class%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 100 WHERE name ILIKE '%portrait%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 100 WHERE name ILIKE '%cornhole%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 100 WHERE name ILIKE '%dinner%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 100 WHERE name ILIKE '%sound bath%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 50 WHERE name ILIKE '%story time%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 50 WHERE name ILIKE '%storytime%' AND expected_attendance IS NULL;
UPDATE events SET expected_attendance = 50 WHERE name ILIKE '%sky watch%' AND expected_attendance IS NULL;

-- Step 10: Catch-all — anything still NULL gets 200
UPDATE events SET expected_attendance = 200 WHERE expected_attendance IS NULL;

-- Verify April events
SELECT name, expected_attendance FROM events 
WHERE start_date >= '2026-04-01' AND start_date <= '2026-04-30' AND event_type NOT IN ('not_for_kids', 'hours')
ORDER BY expected_attendance DESC;
