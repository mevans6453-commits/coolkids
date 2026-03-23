-- =============================================
-- Backfill expected_attendance for existing events
-- Mirrors the keyword logic from estimateAttendance() in scrape-engine.ts
-- =============================================

-- Major events (10,000+ expected): festivals, fairs, expos, air shows, marathons, fireworks
UPDATE events SET expected_attendance = 10000
WHERE expected_attendance IS NULL
  AND (
    LOWER(name) LIKE '%festival%' OR LOWER(name) LIKE '%fair %' OR LOWER(name) LIKE '% fair' OR LOWER(name) LIKE '%expo%'
    OR LOWER(name) LIKE '%air show%' OR LOWER(name) LIKE '%airshow%' OR LOWER(name) LIKE '%marathon%' 
    OR LOWER(name) LIKE '%fireworks%'
    OR LOWER(description) LIKE '%festival%' OR LOWER(description) LIKE '%air show%' OR LOWER(description) LIKE '%airshow%'
    OR LOWER(description) LIKE '%fireworks%' OR LOWER(description) LIKE '%marathon%'
  );

-- Medium events (5,000+ expected): concerts, parades, 5Ks, holiday lights, tree lighting
UPDATE events SET expected_attendance = 5000
WHERE expected_attendance IS NULL
  AND (
    LOWER(name) LIKE '%concert%' OR LOWER(name) LIKE '%parade%'
    OR LOWER(name) LIKE '%5k%' OR LOWER(name) LIKE '%10k%'
    OR LOWER(name) LIKE '%holiday lights%' OR LOWER(name) LIKE '%light show%' OR LOWER(name) LIKE '%tree lighting%'
    OR LOWER(description) LIKE '%concert%' OR LOWER(description) LIKE '%parade%'
  );

-- Medium events: multi-day (7+ days)
UPDATE events SET expected_attendance = 5000
WHERE expected_attendance IS NULL
  AND end_date IS NOT NULL 
  AND (end_date::date - start_date::date) >= 7;

-- Moderate events (2,000+ expected): seasonal category or 3+ day events
UPDATE events SET expected_attendance = 2000
WHERE expected_attendance IS NULL
  AND ('seasonal' = ANY(categories) OR ('festival' = ANY(categories)));

UPDATE events SET expected_attendance = 2000
WHERE expected_attendance IS NULL
  AND end_date IS NOT NULL 
  AND (end_date::date - start_date::date) >= 3;

-- Moderate events (1,000+ expected): markets, craft fairs, car shows
UPDATE events SET expected_attendance = 1000
WHERE expected_attendance IS NULL
  AND (
    LOWER(name) LIKE '%market%' OR LOWER(name) LIKE '%craft fair%' OR LOWER(name) LIKE '%car show%'
    OR LOWER(description) LIKE '%market%' OR LOWER(description) LIKE '%craft fair%'
  );

-- Small/local events (50): storytimes, classes, workshops
UPDATE events SET expected_attendance = 50
WHERE expected_attendance IS NULL
  AND (
    LOWER(name) LIKE '%storytime%' OR LOWER(name) LIKE '%story time%'
    OR LOWER(name) LIKE '%class%' OR LOWER(name) LIKE '%workshop%'
    OR LOWER(name) LIKE '%playdate%' OR LOWER(name) LIKE '%toddler%'
  );

-- Everything else: default to 100 (small local event)
UPDATE events SET expected_attendance = 100
WHERE expected_attendance IS NULL;

-- Verify Wings Over GA got the right score
SELECT name, expected_attendance FROM events WHERE LOWER(name) LIKE '%wings%';
