-- =============================================
-- Smart Sort Migration
-- Adds expected_attendance to events
-- Backfills venue coordinates
-- =============================================

-- 1. Add expected_attendance column
ALTER TABLE events ADD COLUMN IF NOT EXISTS expected_attendance INTEGER;

-- 2. Backfill venue coordinates by city
-- Cherokee County (local)
UPDATE venues SET latitude = 34.2368, longitude = -84.4908 WHERE city = 'Canton' AND latitude IS NULL;
UPDATE venues SET latitude = 34.3595, longitude = -84.3752 WHERE city = 'Ball Ground' AND latitude IS NULL;
UPDATE venues SET latitude = 34.1165, longitude = -84.5197 WHERE city = 'Woodstock' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2346, longitude = -84.8499 WHERE city = 'Cartersville' AND latitude IS NULL;

-- Forsyth County
UPDATE venues SET latitude = 34.2073, longitude = -84.1402 WHERE city = 'Cumming' AND latitude IS NULL;

-- Fulton County
UPDATE venues SET latitude = 34.0754, longitude = -84.2941 WHERE city = 'Alpharetta' AND latitude IS NULL;
UPDATE venues SET latitude = 34.0232, longitude = -84.3616 WHERE city = 'Roswell' AND latitude IS NULL;

-- Atlanta metro
UPDATE venues SET latitude = 33.7490, longitude = -84.3880 WHERE city = 'Atlanta' AND latitude IS NULL;
UPDATE venues SET latitude = 33.7756, longitude = -84.2963 WHERE city = 'Decatur' AND latitude IS NULL;
UPDATE venues SET latitude = 33.8651, longitude = -84.0090 WHERE city = 'Lawrenceville' AND latitude IS NULL;

-- North Georgia
UPDATE venues SET latitude = 34.3668, longitude = -84.7446 WHERE city = 'Jasper' AND latitude IS NULL;
UPDATE venues SET latitude = 34.8623, longitude = -84.3224 WHERE city = 'Blue Ridge' AND latitude IS NULL;
UPDATE venues SET latitude = 34.5242, longitude = -83.9877 WHERE city = 'Dahlonega' AND latitude IS NULL;
UPDATE venues SET latitude = 34.5176, longitude = -84.9473 WHERE city = 'Ellijay' AND latitude IS NULL;
UPDATE venues SET latitude = 34.3301, longitude = -83.8232 WHERE city = 'Gainesville' AND latitude IS NULL;
UPDATE venues SET latitude = 34.6840, longitude = -83.5382 WHERE city = 'Alto' AND latitude IS NULL;

-- Hall/Gwinnett
UPDATE venues SET latitude = 34.1551, longitude = -84.0067 WHERE city = 'Buford' AND latitude IS NULL;

-- Bartow County  
UPDATE venues SET latitude = 34.1632, longitude = -84.7996 WHERE city = 'Taylorsville' AND latitude IS NULL;

-- DeKalb
UPDATE venues SET latitude = 33.8128, longitude = -84.3264 WHERE city = 'Brookhaven' AND latitude IS NULL;

-- Cobb
UPDATE venues SET latitude = 33.9519, longitude = -84.5472 WHERE city = 'Marietta' AND latitude IS NULL;
UPDATE venues SET latitude = 33.9137, longitude = -84.5553 WHERE city = 'Smyrna' AND latitude IS NULL;

-- Gwinnett
UPDATE venues SET latitude = 33.9608, longitude = -84.0133 WHERE city = 'Duluth' AND latitude IS NULL;

-- Specific venue overrides (known exact locations)
UPDATE venues SET latitude = 33.7326, longitude = -84.3655 WHERE name LIKE '%Zoo Atlanta%' AND latitude IS NULL;
UPDATE venues SET latitude = 33.7896, longitude = -84.3263 WHERE name LIKE '%Fernbank%' AND latitude IS NULL;
UPDATE venues SET latitude = 33.7900, longitude = -84.3734 WHERE name LIKE '%Atlanta Botanical Garden%' AND city = 'Atlanta' AND latitude IS NULL;
UPDATE venues SET latitude = 33.8108, longitude = -84.3669 WHERE name LIKE '%Ponce City Market%' AND latitude IS NULL;
UPDATE venues SET latitude = 33.8083, longitude = -84.1456 WHERE name LIKE '%Stone Mountain%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.3856, longitude = -84.5684 WHERE name LIKE '%Tellus%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.7459, longitude = -84.1894 WHERE name LIKE '%Amicalola%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.6338, longitude = -84.3139 WHERE name LIKE '%North Georgia Zoo%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.4012, longitude = -83.7740 WHERE name LIKE '%Mercier%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.0782, longitude = -84.2898 WHERE name LIKE '%Avalon%' AND latitude IS NULL;
UPDATE venues SET latitude = 33.7911, longitude = -84.4018 WHERE name LIKE '%Atlantic Station%' AND latitude IS NULL;
UPDATE venues SET latitude = 33.7725, longitude = -84.3649 WHERE name LIKE '%Center for Puppetry%' AND latitude IS NULL;
UPDATE venues SET latitude = 33.7576, longitude = -84.3963 WHERE name LIKE '%Callanwolde%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.0043, longitude = -84.1446 WHERE name LIKE '%Southeastern Railway%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.0275, longitude = -84.3519 WHERE name LIKE '%Chattahoochee Nature%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.0683, longitude = -84.2783 WHERE name LIKE '%Reinhardt%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.1914, longitude = -84.8361 WHERE name LIKE '%Booth Western%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2505, longitude = -84.4670 WHERE name LIKE '%Pettit Creek%' AND latitude IS NULL;
UPDATE venues SET latitude = 33.9461, longitude = -84.5131 WHERE name LIKE '%Cobb Energy%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2240, longitude = -84.4891 WHERE name LIKE '%Southern Museum%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2428, longitude = -84.4700 WHERE name LIKE '%Scottsdale Farms%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2236, longitude = -84.4965 WHERE name LIKE '%Sequoyah%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2263, longitude = -84.4900 WHERE name LIKE '%Canton Theatre%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2252, longitude = -84.4878 WHERE name LIKE '%Mill on Etowah%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.1074, longitude = -84.5197 WHERE name LIKE '%Cherokee County Parks%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.1688, longitude = -84.0019 WHERE name LIKE '%INK Children%' AND latitude IS NULL;
UPDATE venues SET latitude = 34.2424, longitude = -84.2903 WHERE name LIKE '%Wings Over%' AND latitude IS NULL;
