-- =============================================
-- Seed 10 New Venues — Phase 4
-- Run this in Supabase SQL Editor
-- =============================================
-- 9 new venue INSERTs + 1 UPDATE for Cherokee County Parks & Rec

-- 1. Scottsdale Farms (Milton, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Scottsdale Farms', 'Milton', 'Fulton', 'GA', '30004',
  'https://www.scottsdalefarms.com',
  'https://www.scottsdalefarms.com/events-calendar/',
  NULL, '{farm,outdoor,seasonal}',
  'Event venue and farm with seasonal activities and community events', true
);

-- 2. Pettit Creek Farms (Cartersville, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Pettit Creek Farms', 'Cartersville', 'Bartow', 'GA', '30120',
  'https://pettitcreekfarms.com',
  'https://pettitcreekfarms.com/',
  NULL, '{farm,outdoor,seasonal}',
  'Family farm with seasonal festivals, corn maze, and farm activities', true
);

-- 3. Mercier Orchards (Blue Ridge, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Mercier Orchards', 'Blue Ridge', 'Fannin', 'GA', '30513',
  'https://www.mercier-orchards.com',
  'https://www.mercier-orchards.com/',
  NULL, '{farm,outdoor,seasonal,market}',
  'Family-owned apple orchard with U-pick fruit, farm store, and seasonal events', true
);

-- 4. Sequoyah Regional Library System (Canton, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Sequoyah Regional Library System', 'Canton', 'Cherokee', 'GA', '30114',
  'https://sequoyahregionallibrary.org',
  'https://seqlib.libcal.com/calendar/events',
  NULL, '{education,free,arts}',
  'Public library system with story times, kids programs, and community events', true
);

-- 5. Cherokee County Parks & Recreation — UPDATE existing record
UPDATE venues
SET website = 'https://www.playcherokee.org',
    scrape_url = 'https://www.playcherokee.org/'
WHERE name = 'Cherokee County Parks & Recreation';

-- 6. Chattahoochee Nature Center (Roswell, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Chattahoochee Nature Center', 'Roswell', 'Fulton', 'GA', '30075',
  'https://chattnaturecenter.org',
  'https://chattnaturecenter.org/programs-events/',
  NULL, '{outdoor,education,park}',
  'Nature center with wildlife exhibits, nature trails, and educational programs for kids', true
);

-- 7. Canton Theatre (Canton, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Canton Theatre', 'Canton', 'Cherokee', 'GA', '30114',
  'https://explorecantonga.com/things-to-do/arts-culture/canton-theatre/',
  'https://explorecantonga.com/things-to-do/arts-culture/canton-theatre/',
  NULL, '{arts,education}',
  'Historic community theatre with family-friendly performances and shows', true
);

-- 8. Elm Street Cultural Arts Village (Woodstock, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Elm Street Cultural Arts Village', 'Woodstock', 'Cherokee', 'GA', '30188',
  'https://elmstreetarts.com',
  'https://elmstreetarts.com/',
  NULL, '{arts,education}',
  'Cultural arts village with performances, art classes, and family-friendly shows', true
);

-- 9. The Holler (Canton, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'The Holler', 'Canton', 'Cherokee', 'GA', '30114',
  'https://www.thehollercanton.com',
  'https://www.thehollercanton.com/',
  NULL, '{outdoor,market,seasonal}',
  'Community gathering space with markets, live music, and family events', true
);

-- 10. Woodstock Arts (Woodstock, GA)
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Woodstock Arts', 'Woodstock', 'Cherokee', 'GA', '30188',
  'https://woodstockarts.org',
  'https://woodstockarts.org/',
  NULL, '{arts,education}',
  'Community arts organization with theatre productions, art exhibits, and classes', true
);
