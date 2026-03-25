/**
 * Geo Utilities
 * 
 * Haversine distance calculation and ZIP code → coordinates lookup
 * for proximity-based event sorting.
 */

// Georgia ZIP → lat/lng lookup table (Cherokee County + surrounding areas)
// This covers the primary service area for CoolKids
const GA_ZIP_COORDS: Record<string, { lat: number; lng: number }> = {
  // Cherokee County
  "30114": { lat: 34.2368, lng: -84.4908 },  // Canton
  "30115": { lat: 34.2619, lng: -84.5613 },  // Canton (west)
  "30183": { lat: 34.3550, lng: -84.5600 },  // Waleska
  "30107": { lat: 34.3595, lng: -84.3752 },  // Ball Ground
  "30188": { lat: 34.1165, lng: -84.5197 },  // Woodstock
  "30189": { lat: 34.1350, lng: -84.4800 },  // Woodstock
  "30102": { lat: 34.0800, lng: -84.5900 },  // Acworth
  "30101": { lat: 34.0500, lng: -84.6700 },  // Acworth

  // Forsyth County
  "30028": { lat: 34.2073, lng: -84.1402 },  // Cumming
  "30040": { lat: 34.2073, lng: -84.1402 },  // Cumming
  "30041": { lat: 34.1500, lng: -84.1200 },  // Cumming (south)

  // Fulton County (north)
  "30004": { lat: 34.1197, lng: -84.2663 },  // Alpharetta
  "30005": { lat: 34.0878, lng: -84.2180 },  // Alpharetta
  "30009": { lat: 34.0600, lng: -84.3000 },  // Alpharetta
  "30022": { lat: 34.0232, lng: -84.3616 },  // Roswell
  "30075": { lat: 34.0300, lng: -84.3500 },  // Roswell
  "30076": { lat: 34.0100, lng: -84.3200 },  // Roswell
  "30077": { lat: 34.0232, lng: -84.3616 },  // Roswell

  // Cobb County
  "30060": { lat: 33.9519, lng: -84.5472 },  // Marietta
  "30062": { lat: 33.9700, lng: -84.5300 },  // Marietta (east)
  "30064": { lat: 33.9300, lng: -84.5800 },  // Marietta (west)
  "30066": { lat: 33.9800, lng: -84.4600 },  // Marietta (north)
  "30067": { lat: 33.9400, lng: -84.4800 },  // Marietta
  "30068": { lat: 33.9700, lng: -84.4400 },  // Marietta
  "30080": { lat: 33.8837, lng: -84.5143 },  // Smyrna
  "30126": { lat: 33.8600, lng: -84.5800 },  // Mableton
  "30008": { lat: 33.8700, lng: -84.5600 },  // Mableton

  // Gwinnett County
  "30024": { lat: 34.0400, lng: -84.0500 },  // Suwanee
  "30043": { lat: 33.9608, lng: -84.0133 },  // Duluth
  "30044": { lat: 33.9300, lng: -84.0700 },  // Lawrenceville
  "30045": { lat: 33.9600, lng: -83.9800 },  // Lawrenceville
  "30046": { lat: 33.9500, lng: -83.9400 },  // Lawrenceville
  "30047": { lat: 33.8800, lng: -84.0300 },  // Lilburn
  "30019": { lat: 33.9500, lng: -83.8700 },  // Dacula
  "30518": { lat: 34.1200, lng: -84.0100 },  // Buford
  "30519": { lat: 34.1100, lng: -83.9800 },  // Buford

  // Atlanta metro
  "30301": { lat: 33.7490, lng: -84.3880 },  // Atlanta
  "30303": { lat: 33.7550, lng: -84.3900 },  // Atlanta
  "30305": { lat: 33.8300, lng: -84.3800 },  // Atlanta (Buckhead)
  "30306": { lat: 33.7900, lng: -84.3500 },  // Atlanta (Virginia Highland)
  "30307": { lat: 33.7700, lng: -84.3400 },  // Atlanta (Decatur area)
  "30308": { lat: 33.7700, lng: -84.3800 },  // Atlanta (Midtown)
  "30309": { lat: 33.8100, lng: -84.3900 },  // Atlanta (Midtown/Ansley)
  "30310": { lat: 33.7300, lng: -84.4200 },  // Atlanta (West End)
  "30311": { lat: 33.7200, lng: -84.4700 },  // Atlanta (Cascade)
  "30312": { lat: 33.7400, lng: -84.3700 },  // Atlanta (Grant Park)
  "30313": { lat: 33.7600, lng: -84.4000 },  // Atlanta (Downtown)
  "30316": { lat: 33.7200, lng: -84.3300 },  // Atlanta (East Atlanta)
  "30318": { lat: 33.7900, lng: -84.4300 },  // Atlanta (West Midtown)
  "30319": { lat: 33.8700, lng: -84.3200 },  // Atlanta (Brookhaven)
  "30324": { lat: 33.8200, lng: -84.3600 },  // Atlanta
  "30326": { lat: 33.8500, lng: -84.3600 },  // Atlanta (Buckhead)
  "30327": { lat: 33.8600, lng: -84.4200 },  // Atlanta
  "30328": { lat: 33.9300, lng: -84.3600 },  // Sandy Springs
  "30338": { lat: 33.9400, lng: -84.3200 },  // Dunwoody
  "30339": { lat: 33.8800, lng: -84.4600 },  // Atlanta (Vinings)
  "30342": { lat: 33.8800, lng: -84.3800 },  // Atlanta

  // Bartow County
  "30120": { lat: 34.2346, lng: -84.8499 },  // Cartersville
  "30121": { lat: 34.1700, lng: -84.8200 },  // Cartersville

  // Pickens County
  "30143": { lat: 34.3668, lng: -84.7446 },  // Jasper

  // Dawson County
  "30534": { lat: 34.4200, lng: -84.0700 },  // Dawsonville

  // Lumpkin County
  "30533": { lat: 34.5242, lng: -83.9877 },  // Dahlonega

  // Gilmer County
  "30540": { lat: 34.5176, lng: -84.9473 },  // Ellijay

  // Fannin County
  "30513": { lat: 34.8623, lng: -84.3224 },  // Blue Ridge

  // Hall County
  "30501": { lat: 34.3301, lng: -83.8232 },  // Gainesville
  "30504": { lat: 34.2800, lng: -83.8700 },  // Gainesville

  // North DeKalb
  "30030": { lat: 33.7756, lng: -84.2963 },  // Decatur
  "30033": { lat: 33.8100, lng: -84.2800 },  // Decatur

  // Sandy Springs / Dunwoody
  "30350": { lat: 33.9700, lng: -84.3400 },  // Sandy Springs
};

/**
 * Calculate distance between two points using the Haversine formula.
 * Returns distance in miles.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Look up coordinates for a ZIP code.
 * Returns null if ZIP is not in our lookup table.
 */
export function zipToCoords(zip: string): { lat: number; lng: number } | null {
  return GA_ZIP_COORDS[zip] || null;
}

/**
 * Proximity tier based on distance in miles.
 */
export type ProximityTier = "near" | "short-drive" | "worth-the-trip";

export function getProximityTier(
  distanceMiles: number,
  expectedAttendance?: number | null
): ProximityTier {
  // Big events (5000+ expected) always go to "Worth the Trip"
  if (expectedAttendance && expectedAttendance >= 5000) {
    return "worth-the-trip";
  }
  // Tighter thresholds — North GA has mountain roads where crow-fly
  // distances underestimate driving time (e.g., Blue Ridge is 44mi
  // crow-fly but 1hr 20min driving).
  if (distanceMiles <= 15) return "near";            // ~20 min drive
  if (distanceMiles <= 35) return "short-drive";     // ~20-45 min drive
  return "worth-the-trip";                           // 45+ min drive
}

export const TIER_LABELS: Record<ProximityTier, { emoji: string; title: string; subtitle: string }> = {
  near: { emoji: "📍", title: "Near You", subtitle: "Under 20 minutes" },
  "short-drive": { emoji: "🚗", title: "A Short Drive", subtitle: "20–45 minutes away" },
  "worth-the-trip": { emoji: "🎪", title: "Worth the Trip", subtitle: "45+ minutes or big event" },
};
