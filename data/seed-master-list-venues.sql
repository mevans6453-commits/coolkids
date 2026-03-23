-- =============================================
-- Seed new venues from master list
-- Skip: stadiums, arenas, aggregators, venues already in DB
-- Skip duplicates with different name variants
-- =============================================

-- Libraries
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Forsyth County Public Library', 'Cumming', 'Forsyth', 'GA', 'https://events.forsythpl.org/events', '{education}', true, '5 branches - excellent kids programs');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Fulton County Library System', 'Alpharetta', 'Fulton', 'GA', 'https://fulcolibrary.bibliocommons.com/v2/events', '{education}', true, 'Milton, Alpharetta, Roswell, Crabapple branches');

-- Farms
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Jaemor Farms', 'Alto', 'Habersham', 'GA', 'https://www.jaemorfarms.com/events', '{farm}', true, 'U-pick, farm activities, seasonal events');

-- Performing Arts
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Cobb Energy Performing Arts Centre', 'Atlanta', 'Cobb', 'GA', 'https://www.cobbenergycentre.com/events', '{arts}', true, 'Atlanta Ballet Nutcracker, opera, symphony');

-- Gardens
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Atlanta Botanical Garden Gainesville', 'Gainesville', 'Hall', 'GA', 'https://atlantabg.org/gainesville-garden/', '{garden,outdoor}', true, 'Holiday lights, classes');

-- Resorts
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Margaritaville at Lanier Islands', 'Buford', 'Hall', 'GA', 'https://www.margaritavilleresorts.com/margaritaville-at-lanier-islands/events', '{outdoor,seasonal}', true, 'Water park, Snow Island winter, Magical Nights of Lights');

-- City Events (only truly new ones — not name variants of existing)
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('City of Canton Events', 'Canton', 'Cherokee', 'GA', 'https://www.cantonga.gov/visitors/special-events', '{festival}', true, 'Parades, markets, downtown events');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('City of Ball Ground Events', 'Ball Ground', 'Cherokee', 'GA', 'https://www.cityofballground.com/events', '{festival}', true, 'March of the Toys parade, Christmas in Ball Ground');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('City of Cumming Events', 'Cumming', 'Forsyth', 'GA', 'https://www.cityofcumming.net/', '{festival}', true, 'Snow Day, Christmas parade');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Cumming City Center', 'Cumming', 'Forsyth', 'GA', 'https://cummingcitycenter.com/events/', '{festival}', true, 'Jingle Jog, markets, community events');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Visit Roswell', 'Roswell', 'Fulton', 'GA', 'https://www.visitroswellga.com/events/', '{festival}', true, 'Major festivals and events');

-- Arts Centers
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Alpharetta Arts Center', 'Alpharetta', 'Fulton', 'GA', 'https://alpharettaartsstreetfest.com/', '{arts}', true, 'Art classes, markets, street fest');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('The Mill on Etowah', 'Canton', 'Cherokee', 'GA', 'https://themillonetowah.com/happenings/', '{arts,market}', true, 'Markets, live music, Christmas Crawl');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Callanwolde Fine Arts Center', 'Atlanta', 'DeKalb', 'GA', 'https://callanwolde.org/events/', '{arts}', true, 'Winter House, art classes, events');

-- Blue Ridge area
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Blue Ridge Scenic Railway', 'Blue Ridge', 'Fannin', 'GA', 'https://brscenic.com/', '{outdoor,seasonal}', true, 'Holiday Express, regular train rides');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Blue Ridge Community Theater', 'Blue Ridge', 'Fannin', 'GA', 'https://blueridgetheater.net/', '{arts}', true, 'Local theater productions');

-- Theaters
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Alliance Theatre', 'Atlanta', 'Fulton', 'GA', 'https://alliancetheatre.org/', '{arts}', true, 'A Christmas Carol, family shows');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Aurora Theatre', 'Lawrenceville', 'Gwinnett', 'GA', 'https://auroratheatre.com/', '{arts}', true, 'Family shows, camps');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Dad''s Garage Theatre', 'Atlanta', 'Fulton', 'GA', 'https://dadsgarage.com/', '{arts}', true, 'Improv, family shows');

-- Event Venues
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Cumming Fairgrounds', 'Cumming', 'Forsyth', 'GA', 'https://www.cummingfairgrounds.net/events/', '{festival,seasonal}', true, 'Fair, rodeos, special events');

-- Recreation/Children
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Play Street Museum', 'Alpharetta', 'Fulton', 'GA', 'https://www.alpharetta.playstreetmuseum.com/', '{museum}', true, 'Interactive play sessions for toddlers');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Forsyth County Parks', 'Cumming', 'Forsyth', 'GA', 'https://www.forsythco.com/Departments-Offices/Parks-Recreation/Events', '{outdoor,sports}', true, 'Park events, programs');

-- Shopping/Events
INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Avalon', 'Alpharetta', 'Fulton', 'GA', 'https://experienceavalon.com/events/', '{market,seasonal}', true, 'Ice skating, tree lighting, concerts');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Atlantic Station', 'Atlanta', 'Fulton', 'GA', 'https://atlanticstation.com/events/', '{market,seasonal}', true, 'Holiday events, movies in the park');

INSERT INTO venues (name, city, county, state, scrape_url, categories, is_active, description)
VALUES ('Ponce City Market', 'Atlanta', 'Fulton', 'GA', 'https://poncecitymarket.com/events/', '{market}', true, 'Rooftop, seasonal events');
