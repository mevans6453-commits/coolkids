-- Fix venue scrape URLs based on URL audit
-- STOP: Run this SQL in Supabase before testing

-- 1. Woodstock Arts: current URL works, just needs different parsing approach
-- Already has /events/ URL

-- 2. Gibbs Gardens: site has no events page (squarespace, static), keep URL but accept seasonal
-- Already has correct URL

-- 3. Chattahoochee Nature Center: ALREADY FIXED to /all-events/

-- 4. Canton Theatre: explorecantonga is wrong, try their own URL
UPDATE venues 
SET scrape_url = 'https://cantontheatre.com/shows/'
WHERE name = 'Canton Theatre';

-- 5. City of Woodstock: visitwoodstockga.com has an events calendar
UPDATE venues 
SET scrape_url = 'https://visitwoodstockga.com/events/'
WHERE name = 'City of Woodstock Events';

-- 6. Sequoyah Library: Update to use the proper calendar URL with date filter
UPDATE venues 
SET scrape_url = 'https://seqlib.libcal.com/calendar/events?cid=-1&t=d&d=0000-00-00&cal%5B%5D=-1&inc=0'
WHERE name = 'Sequoyah Regional Library System';

-- 7. Forsyth County Public Library: Try their LibCal
UPDATE venues
SET scrape_url = 'https://events.forsythpl.org/events'
WHERE name = 'Forsyth County Public Library';

-- 8. Cumming Fairgrounds: Check for events page
UPDATE venues
SET scrape_url = 'https://www.cummingfairgrounds.net/events/'
WHERE name = 'Cumming Fairgrounds';

-- Verify changes
SELECT name, scrape_url FROM venues 
WHERE name IN (
  'Canton Theatre',
  'City of Woodstock Events',
  'Sequoyah Regional Library System',
  'Forsyth County Public Library',
  'Cumming Fairgrounds'
)
ORDER BY name;
