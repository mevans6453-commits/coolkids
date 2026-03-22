-- =============================================
-- Venue URL Updates + Elm Street Inactive
-- Run this in Supabase SQL Editor BEFORE scraping
-- =============================================

-- 1. Canton Theatre → explorecantonga.com events page (has 30+ events!)
UPDATE venues
SET scrape_url = 'https://explorecantonga.com/things-to-do/arts-culture/canton-theatre/',
    preferred_strategy = NULL
WHERE name = 'Canton Theatre';

-- 2. North Georgia Zoo → seasonal events calendar page
UPDATE venues
SET scrape_url = 'https://www.northgeorgiazoo.com/seasonal-events-and-calender.html',
    preferred_strategy = NULL
WHERE name = 'North Georgia Zoo';

-- 3. Scottsdale Farms → keep URL, reset strategy to force re-detection
UPDATE venues
SET preferred_strategy = NULL
WHERE name = 'Scottsdale Farms';

-- 4. Mercier Orchards → things-to-do page (has seasonal events)
UPDATE venues
SET scrape_url = 'https://mercier-orchards.com/things-to-do/',
    preferred_strategy = NULL
WHERE name = 'Mercier Orchards';

-- 5. The Holler → entertainment page
UPDATE venues
SET scrape_url = 'https://thehollercanton.com/entertainment',
    preferred_strategy = NULL
WHERE name = 'The Holler';

-- 6. Canton Farmers Market → explorecantonga.com events (old cantonga.gov URL is 404)
UPDATE venues
SET scrape_url = 'https://explorecantonga.com/events/',
    preferred_strategy = NULL
WHERE name = 'Canton Farmers Market';

-- 7. Cherokee County Aquatic Center → playcherokee.org events (old cherokeega.com URL is dead)
UPDATE venues
SET scrape_url = 'https://playcherokee.org/upcoming-events/',
    preferred_strategy = NULL
WHERE name = 'Cherokee County Aquatic Center';

-- 8. Sequoyah Regional Library → keep URL (JS-rendered, needs Apify)
UPDATE venues
SET preferred_strategy = NULL
WHERE name = 'Sequoyah Regional Library System';

-- 9. Elm Street Cultural Arts Village → mark as inactive (site is down)
UPDATE venues
SET is_active = false
WHERE name = 'Elm Street Cultural Arts Village';
