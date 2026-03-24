// Insert curated family-friendly events from all 5 cities
import { readFileSync } from "fs";
import { resolve } from "path";
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface CuratedEvent {
  name: string;
  start_date: string;
  end_date?: string;
  description: string;
  source_url: string;
  cost?: string;
  is_free?: boolean;
  categories: string[];
  venue_search: string; // used to find the venue
}

async function main() {
  // Get venue IDs
  const { data: allVenues } = await supabase.from("venues").select("id, name");
  const findVenue = (search: string) => (allVenues || []).find(v => v.name.toLowerCase().includes(search.toLowerCase()));

  const cantonVenueId = findVenue("Explore Canton")?.id || findVenue("Canton First Friday")?.id;
  const millId = findVenue("Mill on Etowah")?.id;
  const woodstockId = findVenue("City of Woodstock")?.id;
  const alpharettaId = findVenue("City of Alpharetta")?.id;
  const roswellId = findVenue("Visit Roswell")?.id;
  const miltonId = findVenue("City of Milton")?.id;
  const etowahParkId = findVenue("Etowah River Park")?.id;

  console.log("Venue IDs:");
  console.log(`  Canton: ${cantonVenueId}`);
  console.log(`  Mill: ${millId}`);
  console.log(`  Woodstock: ${woodstockId}`);
  console.log(`  Alpharetta: ${alpharettaId}`);
  console.log(`  Roswell: ${roswellId}`);
  console.log(`  Milton: ${miltonId}`);
  console.log(`  Etowah Park: ${etowahParkId}`);

  // Re-activate Etowah River Park
  if (etowahParkId) {
    await supabase.from("venues").update({ is_active: true }).eq("id", etowahParkId);
    console.log("Re-activated Etowah River Park");
  }

  // ============ CURATED EVENTS ============
  const events: Array<CuratedEvent & { venue_id: string }> = [
    // --- CANTON (via Explore Canton) ---
    { venue_id: etowahParkId!, name: "Southern Tradition Car & Truck Show", start_date: "2026-03-28", end_date: "2026-03-29", description: "The Southeast's biggest car and truck show at Etowah River Park. Hundreds of classic and custom vehicles on display. Great for families — kids love the trucks!", source_url: "https://explorecantonga.com/events/southern-tradition-car-truck-show-2026/", is_free: true, categories: ["family-fun", "festivals-fairs"] },
    { venue_id: millId!, name: "Easter Egg Crawl", start_date: "2026-04-03", description: "Hop through The Mill on Etowah for a fun Easter Egg Crawl! Collect eggs from participating shops and enjoy family fun at this walkable venue.", source_url: "https://explorecantonga.com/events/easter-egg-crawl/", is_free: true, categories: ["seasonal-holidays", "family-fun"] },
    { venue_id: millId!, name: "Spring Plant Festival", start_date: "2026-04-04", description: "Celebrate spring with plants, flowers, and gardening vendors at The Mill on Etowah. Great family outing with beautiful grounds to explore.", source_url: "https://explorecantonga.com/events/spring-plant-festival/", is_free: true, categories: ["animals-nature", "markets-shopping"] },
    { venue_id: millId!, name: "Goat Yoga", start_date: "2026-04-18", description: "Yes, it's real! Practice yoga while adorable baby goats roam around. Fun for the whole family at The Mill on Etowah.", source_url: "https://explorecantonga.com/events/goat-yoga-2/", cost: "Check website for pricing", categories: ["animals-nature", "active-sports", "family-fun"] },
    { venue_id: millId!, name: "Makers Market", start_date: "2026-04-11", description: "Shop handmade goods from local artisans and makers at The Mill on Etowah. Art, crafts, food, and fun for the whole family.", source_url: "https://explorecantonga.com/events/makers-market/", is_free: true, categories: ["markets-shopping", "hands-on-art"] },
    { venue_id: etowahParkId!, name: "Cherokee Chase 5K & Fun Run", start_date: "2026-05-02", description: "4th Annual Cherokee Chase 5K and Fun Run at Etowah River Park. Fun run option for kids, 5K for adults. Great community fitness event.", source_url: "https://explorecantonga.com/events/4th-annual-cherokee-chase-5k-and-fun-run/", cost: "Registration required", categories: ["active-sports", "family-fun"] },
    { venue_id: cantonVenueId!, name: "Canton Farmers Market", start_date: "2026-05-30", end_date: "2026-08-02", description: "Fresh produce, baked goods, and local vendors every Saturday morning at Brown Park in downtown Canton. A classic family weekend activity.", source_url: "https://explorecantonga.com/events/2026-canton-farmers-market/", is_free: true, categories: ["markets-shopping", "family-fun"] },
    { venue_id: etowahParkId!, name: "Riverfest Arts & Crafts Festival", start_date: "2026-09-26", end_date: "2026-09-27", description: "Canton's biggest annual festival! Hundreds of arts & crafts vendors, food, live music, and family activities at Etowah River Park. Thousands attend every year.", source_url: "https://explorecantonga.com/events/riverfest-arts-crafts-festival-2026/", is_free: true, categories: ["festivals-fairs", "hands-on-art", "family-fun"] },
    { venue_id: millId!, name: "Free Outdoor Yoga", start_date: "2026-03-25", end_date: "2026-10-07", description: "Free outdoor yoga every Tuesday at The Mill on Etowah. All levels welcome — bring the whole family for a relaxing workout in the open air.", source_url: "https://explorecantonga.com/events/free-outdoor-yoga/", is_free: true, cost: "Free", categories: ["active-sports", "family-fun"] },

    // --- WOODSTOCK ---
    { venue_id: woodstockId!, name: "Woodstock Summer Concert Series", start_date: "2026-05-09", end_date: "2026-08-08", description: "FREE outdoor concerts featuring nationally recognized artists at the Amphitheater. May 9: Black Jacket Symphony, Jun 13: Carly Pearce, Jul 11: Midnight Star, Aug 8: Pop 2000 Tour.", source_url: "https://woodstockconcertseries.com", is_free: true, cost: "Free", categories: ["shows-performances", "family-fun"] },
    { venue_id: woodstockId!, name: "Woodstock July 4th Spectacular", start_date: "2026-07-04", description: "Parade, festival at Park at City Center with food, DJ, carnival games, foam party, inflatables, arts and crafts, and fireworks at dusk. The ultimate family celebration!", source_url: "https://woodstockga.gov/parks-recreation/special-events/", is_free: true, cost: "Free", categories: ["festivals-fairs", "seasonal-holidays", "family-fun"] },
    { venue_id: woodstockId!, name: "Taste of Woodstock", start_date: "2026-09-10", description: "Sample food from dozens of local restaurants in Downtown Woodstock. Live music, local vendors, and family fun.", source_url: "https://visitwoodstockga.com/events/", categories: ["festivals-fairs", "family-fun"] },
    { venue_id: woodstockId!, name: "Woodstock Fall Festival", start_date: "2026-10-17", description: "An afternoon of fellowship, music, and food for the community at the Woodstock Community Center.", source_url: "https://visitwoodstockga.com/events/", is_free: true, categories: ["festivals-fairs", "family-fun"] },

    // --- ALPHARETTA ---
    { venue_id: alpharettaId!, name: "Alpharetta Farmers Market", start_date: "2026-04-04", end_date: "2026-11-14", description: "Every Saturday morning in downtown Alpharetta on the Town Green. Local farmers, bakers, and artisans selling fresh produce, baked goods, and handcrafted items.", source_url: "https://alpharettafarmersmarket.com", is_free: true, cost: "Free", categories: ["markets-shopping", "family-fun"] },
    { venue_id: alpharettaId!, name: "25th Annual Garden Faire", start_date: "2026-04-11", description: "Plants, gardening vendors, and a dedicated Children's Gardening Corner at The Grove at Wills Park. Fun and educational for the whole family.", source_url: "https://www.awesomealpharetta.com/events/", is_free: true, categories: ["animals-nature", "storytime-learning", "family-fun"] },
    { venue_id: alpharettaId!, name: "Celebrate Freedom Rodeo", start_date: "2026-05-01", end_date: "2026-05-02", description: "Giddy up! Real rodeo action plus family-friendly activities at the Wills Park Equestrian Center. A unique experience for kids.", source_url: "https://www.awesomealpharetta.com/events/", categories: ["family-fun", "active-sports"] },
    { venue_id: alpharettaId!, name: "Taste of Alpharetta", start_date: "2026-05-14", description: "Downtown Alpharetta becomes a culinary playground! Samples from 60+ local restaurants, live entertainment, chef demos, and activities for all ages.", source_url: "https://www.awesomealpharetta.com/events/", categories: ["festivals-fairs", "family-fun"] },
    { venue_id: alpharettaId!, name: "Alpharetta Arts Streetfest", start_date: "2026-05-23", end_date: "2026-05-24", description: "Over 100 artists display their work at The Grove at Wills Park. Kidz Zone with face painting, sand art, and treasure mining. Fun for all ages.", source_url: "https://www.awesomealpharetta.com/events/", is_free: true, categories: ["hands-on-art", "festivals-fairs", "family-fun"] },
    { venue_id: alpharettaId!, name: "Food Truck Alley", start_date: "2026-06-25", description: "Dozens of food trucks line up in Downtown Alpharetta for a delicious evening out. Family-friendly atmosphere with something for every taste.", source_url: "https://www.awesomealpharetta.com/events/", categories: ["family-fun", "festivals-fairs"] },

    // --- ROSWELL ---
    { venue_id: roswellId!, name: "River Roots Science Stations", start_date: "2026-03-24", end_date: "2026-06-30", description: "Explore STEAM exhibits at Chattahoochee Nature Center! Kids 8 and up travel from station to station to discover how science connects to the river.", source_url: "https://www.visitroswellga.com/events/river-roots-science-stations/", is_free: true, categories: ["science-stem", "animals-nature", "storytime-learning"] },
    { venue_id: roswellId!, name: "Spring Native Plant Sale", start_date: "2026-03-27", end_date: "2026-04-04", description: "Add native plants to your garden! Great educational activity for kids to learn about wildlife-friendly plants at the Chattahoochee Nature Center.", source_url: "https://www.visitroswellga.com/events/native-plant-sale/", categories: ["animals-nature", "storytime-learning"] },
    { venue_id: roswellId!, name: "Roswell Youth Day Celebration", start_date: "2026-10-03", description: "76th Annual Youth Day on Historic Canton Street! Parade, Art Block, Fall Farm Days, Touch-A-Truck, and Food Truck Alley. THE kid event of the year in Roswell.", source_url: "https://roswell365.com", is_free: true, cost: "Free", categories: ["festivals-fairs", "family-fun"] },

    // --- MILTON / CRABAPPLE ---
    { venue_id: miltonId!, name: "Milton Toddler Tuesdays", start_date: "2026-03-24", end_date: "2026-05-05", description: "Monthly play sessions for kids ages 1-4 at the Community Center at Milton City Park. Free indoor and outdoor activities.", source_url: "https://www.miltonga.gov/community/events", is_free: true, cost: "Free", categories: ["family-fun", "storytime-learning"] },
    { venue_id: miltonId!, name: "Milton Meet the Neighbors", start_date: "2026-04-18", description: "Community gathering to meet your neighbors in Milton. Family-friendly event with activities for all ages.", source_url: "https://www.miltonga.gov/community/events", is_free: true, cost: "Free", categories: ["family-fun"] },
    { venue_id: miltonId!, name: "Red, White & YOU Parade", start_date: "2026-07-03", description: "Milton's patriotic parade through downtown. Decorate your bike, wagon, or stroller and join the fun! A family tradition.", source_url: "https://www.miltonga.gov/community/events", is_free: true, cost: "Free", categories: ["festivals-fairs", "seasonal-holidays", "family-fun"] },
    { venue_id: miltonId!, name: "Touch a Truck", start_date: "2026-09-12", description: "Fire trucks, police cars, construction vehicles, and more — kids can climb in, honk horns, and explore. One of the most popular kids events in the area!", source_url: "https://www.miltonga.gov/community/events", is_free: true, cost: "Free", categories: ["family-fun"] },
    { venue_id: miltonId!, name: "Crabapple Fest", start_date: "2026-10-03", description: "Milton's signature fall festival in historic Crabapple! 100+ local antique, craft, and art vendors, delicious food, live music, and family activities.", source_url: "https://www.miltonga.gov/community/events", is_free: true, cost: "Free", categories: ["festivals-fairs", "markets-shopping", "family-fun"] },
    { venue_id: miltonId!, name: "Carvin' in Crabapple", start_date: "2026-10-24", description: "Pumpkin carving event in historic Crabapple! Bring the kids to carve, paint, and decorate pumpkins. A fall family tradition.", source_url: "https://www.miltonga.gov/community/events", is_free: true, cost: "Free", categories: ["seasonal-holidays", "hands-on-art", "family-fun"] },
    { venue_id: miltonId!, name: "Christmas in Crabapple", start_date: "2026-12-05", description: "Holiday celebration in historic Crabapple with festive lights, music, food, and Santa! A magical evening for families.", source_url: "https://www.miltonga.gov/community/events", is_free: true, cost: "Free", categories: ["seasonal-holidays", "family-fun"] },
    { venue_id: miltonId!, name: "Pancakes with Santa", start_date: "2026-12-12", description: "Start the holiday season with pancakes and a visit from Santa Claus! Kids can take photos and share their wish lists.", source_url: "https://www.miltonga.gov/community/events", is_free: false, cost: "Check website for pricing", categories: ["seasonal-holidays", "family-fun"] },
  ];

  // Insert events, skipping duplicates
  let inserted = 0;
  let skipped = 0;

  for (const e of events) {
    if (!e.venue_id) {
      console.log(`SKIP (no venue): "${e.name}"`);
      skipped++;
      continue;
    }

    // Check for duplicates
    const { data: existing } = await supabase.from("events")
      .select("id")
      .eq("venue_id", e.venue_id)
      .eq("start_date", e.start_date)
      .ilike("name", `%${e.name.slice(0, 20)}%`);

    if (existing && existing.length > 0) {
      console.log(`DUPE: "${e.name}" (${e.start_date})`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("events").insert({
      venue_id: e.venue_id,
      name: e.name,
      description: e.description,
      start_date: e.start_date,
      end_date: e.end_date || null,
      source_url: e.source_url,
      cost: e.cost || null,
      is_free: e.is_free ?? false,
      categories: e.categories,
      status: "published",
      event_type: "event",
    });

    if (error) {
      console.log(`ERROR: "${e.name}": ${error.message}`);
    } else {
      inserted++;
      console.log(`ADDED: "${e.name}" (${e.start_date})`);
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);

  // Final event count
  const { count } = await supabase.from("events").select("id", { count: "exact" }).eq("status", "published");
  console.log(`Total published events: ${count}`);
}

main().catch(console.error);
