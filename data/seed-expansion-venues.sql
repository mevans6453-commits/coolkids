-- =============================================
-- Seed 24 New Venues — Expansion Phase
-- STOP: Run this SQL in Supabase SQL Editor before testing
-- =============================================
-- Venues grouped by region: Atlanta Metro, North Metro, Local Cherokee, Farms & Seasonal

-- =============================================
-- ATLANTA METRO (museums, zoos, aquariums, gardens)
-- =============================================

-- 1. Children's Museum of Atlanta
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Children''s Museum of Atlanta', 'Atlanta', 'Fulton', 'GA', '30313',
  'https://childrensmuseumatlanta.org',
  'https://childrensmuseumatlanta.org/events/',
  NULL, '{museum,education,free}',
  'Interactive museum designed for children ages 0-8 with hands-on exhibits and programs', true
);

-- 2. Fernbank Museum of Natural History
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Fernbank Museum of Natural History', 'Atlanta', 'DeKalb', 'GA', '30307',
  'https://www.fernbankmuseum.org',
  'https://www.fernbankmuseum.org/calendar/',
  NULL, '{museum,education,outdoor}',
  'Natural history museum with dinosaur exhibits, nature trails, and family programming', true
);

-- 3. Center for Puppetry Arts
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Center for Puppetry Arts', 'Atlanta', 'Fulton', 'GA', '30309',
  'https://puppet.org',
  'https://puppet.org/performances/',
  NULL, '{arts,education,museum}',
  'World-class puppetry center with family performances, workshops, and Jim Henson museum', true
);

-- 4. Zoo Atlanta
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Zoo Atlanta', 'Atlanta', 'Fulton', 'GA', '30315',
  'https://zooatlanta.org',
  'https://zooatlanta.org/events/',
  NULL, '{zoo,outdoor,education}',
  'AZA-accredited zoo with giant pandas, gorillas, and family events in Grant Park', true
);

-- 5. Georgia Aquarium
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Georgia Aquarium', 'Atlanta', 'Fulton', 'GA', '30313',
  'https://www.georgiaaquarium.org',
  'https://www.georgiaaquarium.org/events/',
  NULL, '{aquatic,education,museum}',
  'World''s largest aquarium with whale sharks, beluga whales, and interactive family experiences', true
);

-- 6. Stone Mountain Park
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Stone Mountain Park', 'Stone Mountain', 'DeKalb', 'GA', '30087',
  'https://www.stonemountainpark.com',
  'https://www.stonemountainpark.com/events',
  NULL, '{park,outdoor,seasonal,festival}',
  'Georgia''s most-visited attraction with hiking, seasonal festivals, and family activities', true
);

-- 7. Atlanta Botanical Garden
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Atlanta Botanical Garden', 'Atlanta', 'Fulton', 'GA', '30309',
  'https://atlantabg.org',
  'https://atlantabg.org/events/',
  NULL, '{garden,outdoor,seasonal,education}',
  'Botanical garden with children''s garden, seasonal displays, and family programs', true
);

-- 8. High Museum of Art
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'High Museum of Art', 'Atlanta', 'Fulton', 'GA', '30309',
  'https://high.org',
  'https://high.org/events/',
  NULL, '{museum,arts,education}',
  'Leading art museum with family-friendly exhibitions, workshops, and Second Sunday family days', true
);

-- 9. Atlanta History Center
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Atlanta History Center', 'Atlanta', 'Fulton', 'GA', '30305',
  'https://www.atlantahistorycenter.com',
  'https://www.atlantahistorycenter.com/events/',
  NULL, '{museum,education,outdoor}',
  'History museum and gardens with family programs, historic houses, and nature trails', true
);

-- =============================================
-- NORTH METRO (performing arts, lakes, museums)
-- =============================================

-- 10. Lake Lanier Islands
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Lake Lanier Islands', 'Buford', 'Hall', 'GA', '30518',
  'https://www.lanierislands.com',
  'https://www.lanierislands.com/',
  NULL, '{outdoor,seasonal,aquatic,park}',
  'Lakeside resort with water park, seasonal festivals, and family-friendly outdoor activities', true
);

-- 11. Roswell Cultural Arts Center
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Roswell Cultural Arts Center', 'Roswell', 'Fulton', 'GA', '30075',
  'https://tickets.roswellculturalarts.com',
  'https://tickets.roswellculturalarts.com/events',
  NULL, '{arts,education}',
  'Community performing arts center with family shows, concerts, and cultural events', true
);

-- 12. Sandy Springs Performing Arts
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Sandy Springs Performing Arts', 'Sandy Springs', 'Fulton', 'GA', '30328',
  'https://sandyspringsperformingarts.org',
  'https://sandyspringsperformingarts.org/events/',
  NULL, '{arts,education}',
  'Performing arts center with family-friendly theatre, concerts, and community events', true
);

-- 13. Southern Museum of Civil War and Locomotive History
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Southern Museum of Civil War and Locomotive History', 'Kennesaw', 'Cobb', 'GA', '30144',
  'https://southernmuseum.org',
  'https://southernmuseum.org/events/',
  NULL, '{museum,education}',
  'Smithsonian affiliate museum with train exhibits, hands-on activities, and family programs', true
);

-- 14. Southeastern Railway Museum
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Southeastern Railway Museum', 'Duluth', 'Gwinnett', 'GA', '30096',
  'https://www.train-museum.org',
  'https://www.train-museum.org/events',
  NULL, '{museum,education,outdoor}',
  'Official state transportation history museum with vintage train rides and family events', true
);

-- 15. INK Children''s Museum
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'INK Children''s Museum', 'Oakwood', 'Hall', 'GA', '30566',
  'https://www.inkmuseum.com',
  'https://www.inkmuseum.com/',
  NULL, '{museum,education,arts}',
  'Interactive children''s museum focused on creativity, play, and hands-on learning', true
);

-- =============================================
-- LOCAL & NEARBY (Cherokee / Cobb / Woodstock / Alpharetta / Roswell / Canton)
-- =============================================

-- 16. Berry Patch Farms
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Berry Patch Farms', 'Woodstock', 'Cherokee', 'GA', '30188',
  'https://berrypatchfarms.co',
  'https://berrypatchfarms.co/',
  NULL, '{farm,outdoor,seasonal}',
  'Family-owned U-pick farm with seasonal berries, sunflowers, and farm activities', true
);

-- 17. City of Woodstock Events
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'City of Woodstock Events', 'Woodstock', 'Cherokee', 'GA', '30188',
  'https://visitwoodstockga.com',
  'https://visitwoodstockga.com/events/',
  NULL, '{festival,outdoor,free,arts}',
  'City-sponsored community events, festivals, concerts, and seasonal celebrations in downtown Woodstock', true
);

-- 18. Explore Canton Events
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Explore Canton Events', 'Canton', 'Cherokee', 'GA', '30114',
  'https://explorecantonga.com',
  'https://explorecantonga.com/events/',
  NULL, '{festival,outdoor,free,arts}',
  'City of Canton community events, downtown festivals, and family-friendly local happenings', true
);

-- 19. Hot Wheels Skate Center
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Hot Wheels Skate Center', 'Woodstock', 'Cherokee', 'GA', '30188',
  'https://hotwheelsskatecenter.com',
  'https://hotwheelsskatecenter.com/special-events/',
  NULL, '{sports,free}',
  'Family roller skating rink with DJ nights, birthday parties, and special themed events', true
);

-- 20. City of Alpharetta Events
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'City of Alpharetta Events', 'Alpharetta', 'Fulton', 'GA', '30009',
  'https://www.awesomealpharetta.com',
  'https://www.awesomealpharetta.com/events/',
  NULL, '{festival,outdoor,free,arts}',
  'Alpharetta community events, concerts at the amphitheater, markets, and seasonal festivals', true
);

-- 21. City of Roswell Events
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'City of Roswell Events', 'Roswell', 'Fulton', 'GA', '30075',
  'https://www.roswellgov.com',
  'https://www.roswellgov.com/government/departments/recreation-parks-historic-and-cultural-affairs/events',
  NULL, '{festival,outdoor,free,park}',
  'Roswell parks and recreation events, festivals, and family programming', true
);

-- 22. Main Event Alpharetta
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Main Event Alpharetta', 'Alpharetta', 'Fulton', 'GA', '30005',
  'https://www.mainevent.com/locations/georgia/alpharetta/',
  'https://www.mainevent.com/locations/georgia/alpharetta/',
  NULL, '{sports,arts}',
  'Family entertainment center with bowling, laser tag, arcade games, and special events', true
);

-- =============================================
-- FARMS & SEASONAL (day trip / seasonal destinations)
-- =============================================

-- 23. Uncle Shuck's Corn Maze
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Uncle Shuck''s Corn Maze', 'Dawsonville', 'Dawson', 'GA', '30534',
  'https://uncleshucks.com',
  'https://uncleshucks.com/',
  NULL, '{farm,outdoor,seasonal}',
  'North Georgia corn maze and pumpkin patch with hayrides and fall activities', true
);

-- 24. Copper Creek Farm
INSERT INTO venues (id, name, city, county, state, zip, website, scrape_url, scrape_method, categories, description, is_active)
VALUES (
  gen_random_uuid(), 'Copper Creek Farm', 'Calhoun', 'Gordon', 'GA', '30701',
  'https://coppercreekfarm.com',
  'https://coppercreekfarm.com/',
  NULL, '{farm,outdoor,seasonal}',
  'Family farm with seasonal festivals, corn maze, pumpkin patch, and farm activities', true
);
