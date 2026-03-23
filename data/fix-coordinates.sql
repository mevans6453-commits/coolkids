-- =============================================
-- Fix venue coordinates and attendance
-- =============================================

-- 1. Fix Wings Over North Georgia — actual location is Russell Regional Airport, Rome GA
UPDATE venues SET latitude = 34.3507, longitude = -85.1647, city = 'Rome'
WHERE name LIKE '%Wings Over%';

-- 2. Set Wings Over GA expected attendance (major air show, 100K+ attendees)
UPDATE events SET expected_attendance = 100000
WHERE name ILIKE '%wings over%';

-- 3. Fix specific Atlanta venue coordinates (they were all using generic 33.749, -84.388)
UPDATE venues SET latitude = 33.7900, longitude = -84.3734 WHERE name = 'Atlanta Botanical Garden' AND city = 'Atlanta';
UPDATE venues SET latitude = 33.7896, longitude = -84.3263 WHERE name LIKE '%Fernbank%';
UPDATE venues SET latitude = 33.7326, longitude = -84.3655 WHERE name LIKE '%Zoo Atlanta%';
UPDATE venues SET latitude = 33.8108, longitude = -84.3669 WHERE name LIKE '%Ponce City Market%';
UPDATE venues SET latitude = 33.7911, longitude = -84.4018 WHERE name LIKE '%Atlantic Station%';
UPDATE venues SET latitude = 33.7725, longitude = -84.3649 WHERE name LIKE '%Center for Puppetry%';
UPDATE venues SET latitude = 33.8428, longitude = -84.3856 WHERE name LIKE '%Atlanta History Center%';
UPDATE venues SET latitude = 33.7900, longitude = -84.3850 WHERE name LIKE '%High Museum%';
UPDATE venues SET latitude = 33.7634, longitude = -84.3952 WHERE name LIKE '%Georgia Aquarium%';
UPDATE venues SET latitude = 33.7576, longitude = -84.3963 WHERE name LIKE '%Callanwolde%';
UPDATE venues SET latitude = 33.7490, longitude = -84.3935 WHERE name LIKE '%Alliance Theatre%';
UPDATE venues SET latitude = 33.7586, longitude = -84.3578 WHERE name LIKE '%Dad''s Garage%';
UPDATE venues SET latitude = 33.7576, longitude = -84.3880 WHERE name LIKE '%Children''s Museum of Atlanta%';
UPDATE venues SET latitude = 33.9461, longitude = -84.5131 WHERE name LIKE '%Cobb Energy%';

-- 4. Fix other specific venue coordinates
UPDATE venues SET latitude = 34.0782, longitude = -84.2898 WHERE name LIKE '%Avalon%';
UPDATE venues SET latitude = 33.9608, longitude = -84.0133 WHERE name LIKE '%Southeastern Railway%';
UPDATE venues SET latitude = 34.0275, longitude = -84.3519 WHERE name LIKE '%Chattahoochee Nature%';
UPDATE venues SET latitude = 34.3850, longitude = -84.2870 WHERE name LIKE '%Gibbs Gardens%';
UPDATE venues SET latitude = 34.4012, longitude = -83.7740 WHERE name LIKE '%Mercier%';
UPDATE venues SET latitude = 33.8083, longitude = -84.1456 WHERE name LIKE '%Stone Mountain%';
UPDATE venues SET latitude = 34.0043, longitude = -84.1446 WHERE name LIKE '%Southeastern Railway%';
UPDATE venues SET latitude = 34.1551, longitude = -83.9900 WHERE name LIKE '%Lake Lanier%';
UPDATE venues SET latitude = 34.0683, longitude = -84.2783 WHERE name LIKE '%Reinhardt%';

-- Fix Reinhardt — it's in Waleska, not Roswell area
UPDATE venues SET latitude = 34.3333, longitude = -84.5833 WHERE name LIKE '%Reinhardt%';

-- 5. Verify Wings Over GA fix
SELECT v.name, v.city, v.latitude, v.longitude, e.name as event_name, e.expected_attendance
FROM venues v 
LEFT JOIN events e ON e.venue_id = v.id
WHERE v.name LIKE '%Wings%';
