# CLAUDE.md — CoolKids Project Context

## What Is This
CoolKids is a local family events aggregator and community platform for parents in Canton, GA / Cherokee County / North Georgia. It scrapes local venue websites for upcoming events, lets parents browse, star, and mark "I'm going," and will eventually send personalized monthly newsletters. Built by Mike Evans (BlueWave HR owner) as an open-source passion project.

## Important Rules
- I am NOT a developer. Explain everything in plain English.
- When creating SQL migrations, ALWAYS say "STOP: Run this SQL in Supabase before testing" and show the exact SQL.
- Never assume I've run a migration. Always check.
- After completing any feature, ask "Want me to push to GitHub?"
- Before merging branches, verify no features are lost. Audit the code.
- Don't overwrite or remove existing features when adding new ones.
- Ask before making major structural changes.

## Live Site
- **URL:** https://coolkids-three.vercel.app
- **GitHub:** https://github.com/mevans6453-commits/coolkids
- **Database:** Supabase (project: kgeqtdodpaceugzrxhsh)
- **Hosting:** Vercel (auto-deploys from main branch on GitHub)

## Tech Stack
- Next.js 15 (App Router)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS (shadcn/ui-inspired patterns, but shadcn is NOT installed)
- TypeScript
- Vercel hosting

## Database Tables
- `venues` — 78 active venues (82 total, 4 deactivated) with scrape_urls auto-discovered by the multi-strategy engine
- `events` — ~190 clean events across 31 venues (smart validation filters junk, past events, closures, daily attractions; event_type classification + age_range fields)
- `profiles` — User profiles (ZIP, kids ages, interests, distance)
- `user_event_interactions` — Stars, attending, hidden, reported records
- `venue_suggestions` — User-submitted venue suggestions (table verified in Supabase)
- `dad_jokes` — 30 dad jokes for daily rotation on homepage
- `scrape_runs` — Logs every scrape attempt (venue_id, strategy, events_found, status, duration_ms)

## What's Been Built (Completed Phases)

### Phase 1: Foundation ✅
- Next.js project scaffolded
- Supabase database with venues/events tables
- 12 venues seeded, 45 events scraped
- Scraper framework (Apify-based)
- Homepage, Events, Venues pages
- Git repo on GitHub

### Phase 2A: Authentication ✅
- Magic link login (no passwords, uses Supabase Auth)
- User profile page (ZIP, kids ages, interests, distance, newsletter preference)
- Login/logout in header
- Profiles table with RLS + auto-create trigger

### Phase 2B: Event Interactions ✅
- Star button (toggle, shows count)
- "I'm Going" button (toggle, shows count)
- My Events page (/my-events) with list/calendar toggle
- user_event_interactions table with RLS

### Phase 3: Event Page Improvements ✅
- Sort dropdown: Date, Venue, Trending, Recently Added
- When dropdown: All, This Week, This Weekend, This Month, Next Month
- Cost dropdown: All, Free, Under $10, Under $25
- Category dropdown with multi-select
- List/grid/calendar view toggle
- Add to Calendar button (Google Calendar)
- Hide/Report (Not Interested + Report) via flag icon
- Pricing display: FREE badge, cost text, pricing_notes field

### Phase 4: Data Polish + Features ✅
- Dad Joke of the Day on homepage (daily rotation, click-to-reveal punchline, 30 jokes seeded)
- Suggest a Venue form (/suggest — venue name, URL, what makes it great, age range)
- Calendar view of events (monthly grid, attending events pinned to top, prev/next month navigation)
- My Events calendar/agenda view (attending events blue, starred events amber)
- Pricing backfill — all events have cost, cost_min, cost_max, and pricing_notes
- Multi-day event deduplication (consecutive-day duplicates merged, e.g. "Apr 4–5")
- Expandable date ranges on multi-day events (chevron dropdown shows individual dates with per-date "Add to Calendar" buttons; weekends only for long spans)
- Mobile optimization (hamburger menu, stacked card layout, 44px touch targets, calendar fallback to list on small screens, 16px base font, iOS zoom prevention)
- Scrape monitoring dashboard at /admin/scraping (strategy scoreboard, venue table with color-coded status, per-venue scrape buttons, inline event editing for event_type and age ranges)
- Event classification: event_type column ('event' vs 'hours' vs 'not_for_kids') with smart keyword-based classification
- Age range extraction: auto-parses age info from event text (named groups like "toddler", numeric ranges like "ages 3-5", "all ages" → 0-99)
- Age filter dropdown on Events page (Toddler, Preschool, Elementary, Tween/Teen) + "Include hours" toggle
- Share button on all event cards (native share sheet on mobile via navigator.share, clipboard copy on desktop)
- My Events un-star and un-attend toggles
- "This Weekend" page with happening-today section
- Event-specific share links (/events?highlight=uuid)

### Phase 5: Scraper Overhaul (March 23, 2026) ✅
- **Firecrawl integration** — added as Strategy #5 (between html and apify) for JS-rendered sites
- **7-strategy scraper cascade:** jsonld → ical → rss → html → firecrawl → apify → apify-chromium
- **7 venues switched from Apify to Firecrawl** (separate credit pool, faster, reaches more sites):
  - Sequoyah Library: 4 → 39 events (10x improvement!)
  - City of Woodstock: 15 events (same, now free of Apify credits)
  - Fernbank Museum: 12 → 14 events
  - High Museum: 7 events (same, free of Apify)
  - Atlanta Botanical Garden Gainesville: 0 → 1 event (NEW)
  - Canton First Friday: 0 → 1 event (NEW)
  - Explore Canton Events: 0 → 1 event (NEW)
- **Venue+date dedup** — prevents same-venue same-date events with different names
- **Parser improvements** — 25+ new junk name filters, expanded cost extraction (donation-based, "included with admission", "children X and under free", "no cost/charge", "complimentary")
- **Status badge fix** — admin dashboard shows 🟢 success if venue has events, regardless of latest scrape run

## Scraping Architecture (Current as of March 23, 2026)

### Strategy Cascade (priority order)
| # | Strategy | Cost | Speed | JS Support | File |
|---|----------|------|-------|-----------|------|
| 1 | jsonld | Free | Instant | No | jsonld-strategy.ts |
| 2 | ical | Free | Instant | No | ical-strategy.ts |
| 3 | rss | Free | Instant | No | rss-strategy.ts |
| 4 | html | Free | Instant | No | html-strategy.ts (with link-following) |
| 5 | firecrawl | Credits | ~5s | Yes | firecrawl-strategy.ts |
| 6 | apify | Credits | ~15s | Partial | apify-strategy.ts |
| 7 | apify-chromium | Credits | ~30-45s | Full | apify-chromium-strategy.ts |

### Current Venue Strategy Breakdown (31 venues with events)
- **jsonld** — 10 venues, 75 events (FREE)
- **html** — 13 venues, 61 events (FREE)
- **firecrawl** — 7 venues, ~80 events (Firecrawl credits)
- **apify** — 1 venue (Woodstock Arts) (Apify credits)
- **apify-chromium** — 1 venue (Atlanta History Center) (Apify credits)

### Deduplication (2 layers)
1. **Within batch:** fuzzy name matching on same date (parse-utils.ts)
2. **Against DB:** venue+date check prevents inserting a second event for the same venue on the same date (scrape-engine.ts)

### Parser Pipeline (parse-utils.ts)
1. `parseEventsFromMarkdown()` — splits by headings, extracts name + date + time + cost + description
2. `validateScrapedEvents()` — 13+ validation passes (junk names, dates-as-names, closures, daily attractions, not-for-kids, time validation)
3. Event type classification: event / hours / not_for_kids
4. Age range extraction: named groups, numeric ranges, grades
5. Cost extraction: $ranges, free patterns, donation-based, included-with-admission, kids-free notes

### Key Files
- `src/scrapers/scrape-engine.ts` — orchestrates scraping, saves to DB
- `src/scrapers/parse-utils.ts` — shared parsing (700+ lines)
- `src/scrapers/strategies/` — all strategy implementations
- `src/scrapers/base-scraper.ts` — types (ScrapedEvent, VenueConfig)
- `src/app/api/scrape/route.ts` — API endpoint for admin "Scrape" button

## Firecrawl API (FIRECRAWL_API_KEY in .env.local)

### What It Does
Firecrawl is a web scraping API that renders JavaScript, handles SPAs, and returns clean content. It's our primary tool for JS-rendered venue sites (calendars, interactive widgets, etc.).

### Key Capabilities for CoolKids
| Feature | How It Helps | Cost |
|---------|-------------|------|
| **Scrape → Markdown** | Get clean text from any page | 1 credit/page |
| **Scrape → JSON (with schema)** | AI-powered structured extraction — tell it exactly what fields you want | 5 credits/page |
| **Scrape → Images** | Extract all image URLs from a page (event posters, venue photos) | 1 credit/page |
| **Scrape → Links** | Get all links on a page (find event detail pages) | 1 credit/page |
| **Crawl** | Recursively scrape multiple pages on a site | 1 credit/page crawled |
| **Batch Scrape** | Scrape multiple URLs in one API call | 1 credit/URL |
| **Actions** | Click buttons, scroll, interact with page before scraping | Same as scrape |
| **Interact** | AI-driven browser interaction — tell it what to do in plain English | Per interaction |

### Caching (saves credits!)
- Firecrawl caches pages for **48 hours** by default
- Re-scraping the same URL within 48h uses cached data and doesn't cost credits
- Set `maxAge: 0` to force a fresh scrape (costs credits)
- This means daily cron scraping → every other day is effectively free

### JSON Extraction (game-changer for pricing/age data)
Instead of parsing messy markdown with regex, tell Firecrawl exactly what to extract:
```json
{
  "url": "https://venue.com/events",
  "formats": [{ "type": "json", "schema": {
    "events": [{ "name": "string", "date": "string", "price": "string", "kids_pricing": "string", "age_range": "string" }]
  }}]
}
```
Returns clean structured data — no regex needed. Costs 5 credits/page vs 1 for markdown.
**Status:** Not yet implemented in our strategy. Currently using markdown (1 credit) + regex parsing.

### Image Extraction
Request `formats: ["images"]` to get all image URLs from a page. Could be used to:
- Grab event poster images for event cards
- Get venue logos/photos
- Pull social media images from event pages

### Actions (for tricky sites)
Can click "Load More" buttons, navigate calendar months, expand accordion sections before scraping:
```json
{
  "url": "https://venue.com/calendar",
  "actions": [
    { "type": "click", "selector": ".load-more-btn" },
    { "type": "wait", "milliseconds": 2000 },
    { "type": "click", "selector": ".next-month" }
  ]
}
```

### Credit Budget
- Free tier: 500 one-time credits (no monthly renewal)
- ~49 credits used so far in testing
- Hobby plan: 3,000 credits/month for $16/month
- At 1 credit/page markdown: 78 venues = 78 credits per full scrape
- At 5 credits/page JSON: 78 venues = 390 credits per full scrape

## Apify API (APIFY_API_TOKEN in .env.local)
- **Status:** Mostly replaced by Firecrawl. Only 2 venues still use Apify.
- **Issue:** Free credits appear exhausted (402 Payment Required errors on 7+ venues)
- **Kept as fallback** strategies #6 and #7 in the cascade

## What's NOT Built Yet
- Newsletter (email service, template, personalization, cron)
- Automated scraping cron (nightly for free strategies, weekly for Firecrawl)
- Firecrawl JSON extraction strategy (structured data instead of markdown parsing)
- Event detail page scraping (follow "Read More" links for pricing/full descriptions)
- Ratings ("How was it?" after events)
- Friends/neighbors feature ("Mike's family is going")
- Dad joke share button
- PWA (Progressive Web App)
- Deploy custom domain
- Expand beyond kids to adult event channels
- Private Events & Party Invites (see growth engine section below)
- Manual entry workflow for blocked venues (~8 venues that block all scrapers)

## Venues Currently in Database (82 total, 78 active)

### Working Venues (31 with events, ~190 total events)
**Free strategies (24 venues, ~136 events):**
Zoo Atlanta (20), City of Woodstock Events via firecrawl (15), Stone Mountain Park (12), Avalon (10), Chattahoochee Nature Center (10), Cumming City Center (10), Southeastern Railway Museum (10), Tellus Science Museum (9), Amicalola Falls (7), Ponce City Market (7), Scottsdale Farms (7), City of Alpharetta (5), North Georgia Zoo (5), Reinhardt University (5), Alliance Theatre (4), Atlanta Botanical Garden (3), Pettit Creek Farms (3), Southern Museum (3), Visit Roswell (3), Aurora Theatre (2), Booth Western Art Museum (2), Cherokee County Parks (2), Margaritaville (2), Mercier Orchards (2)

**Firecrawl (7 venues, ~80 events):**
Sequoyah Regional Library (39!), Fernbank Museum (14), High Museum (7), Woodstock Arts via apify (2), Atlanta Botanical Garden Gainesville (1), Canton First Friday (1), Explore Canton Events (1), Atlanta Regional Airport (1), Wings Over North Georgia (1)

### Zero-Event Venues (43 — seasonal, blocked, or no events page)
- **Seasonal farms:** Berry Patch, Burt's Pumpkin, Copper Creek, Uncle Shuck's, Cagle's, Jaemor
- **Blocked/403:** Sandy Springs Performing Arts, Cumming Fairgrounds, Blue Ridge Theater, Canton Theatre (cantonga.gov)
- **JS-heavy (need Actions):** Center for Puppetry Arts (puppet.org), Alpharetta Arts Center, Children's Museum of Atlanta
- **No events page:** The Holler (Facebook only), Hot Wheels (image-only), INK Children's Museum
- **Other:** Reeves House, Play Street Museum, Main Event, The Mill on Etowah, Swan Drive-In, Tanglewood Farm, Gibbs Gardens

### Deactivated Venues (4)
- Elm Street Cultural Arts Village (site down)
- Explore Canton Events (duplicate of other Canton pages)
- Georgia Aquarium (no events page)
- Children's Museum of Atlanta (calendar password-protected)

## Key Architecture Notes
- All IDs are UUIDs
- All date fields use timestamptz for timezone support
- events.venue_id is NOT NULL (required foreign key)
- All user tables have ON DELETE CASCADE
- Supabase RLS enabled on all tables
- Auth uses magic link email only (no passwords)
- Vercel auto-deploys when code is pushed to main on GitHub
- .env.local contains: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, APIFY_API_TOKEN, FIRECRAWL_API_KEY, NEXT_PUBLIC_ADMIN_EMAIL
- scrape-engine.ts uses `any` type for Supabase client (no generated types; if types are generated later, revert to proper types)
- Multi-strategy scraper auto-discovers venues from DB (any venue with scrape_url gets scraped)
- scrape_runs table logs every attempt; venues.preferred_strategy stores the winning strategy

## Scraping Philosophy
- Zero results from a venue does NOT mean they have no events
- It means the scraper probably needs adjustment for that venue's website format
- Never auto-remove or deprioritize a venue because the scraper returned nothing
- Flag zero-result venues for human review with a "needs_review" status
- Small local vendors (farms, markets, family businesses) often have non-standard websites — Facebook pages, PDFs, image-only calendars, no calendar at all
- The goal is to build scraping tools that work for EVERYBODY, not just venues with perfect websites
- If a venue can't be scraped automatically, flag it for manual entry
- Every venue deserves a fair chance to have their events discovered
- Multi-strategy approach: try 7 strategies in priority order; first one that returns events wins

## Mike's Design Preferences
- Clean, not cluttered — Airbnb-style compact UI
- List view preferred over tile/grid view
- Dropdown filters, not visible pill buttons
- Mobile-first responsive
- Warm, fun personality (dad jokes, friendly tone)
- "Built with ❤️ for local families" branding

## Planned Feature: Private Events & Party Invites (Growth Engine)

This is the viral growth loop. A parent creates a private event (birthday party, playdate, etc.) and CoolKids generates a beautiful shareable invite image + link. When other parents tap the link, they land on CoolKids, sign up to RSVP, and discover all the public events too. One birthday party = 15+ new users.

### Flow:
1. Parent fills out form: kid's name, age, theme, date, time, location, details
2. AI writes invite copy (e.g. "Tommy is turning 5! Join us for a SUPER celebration at Riverside Park, Saturday March 28th at 2pm. Capes encouraged!")
3. System generates a branded share image using theme colors/patterns (NOT licensed characters)
4. Parent gets a unique invite link (coolkidsga.com/event/abc123) + the share image
5. Parent texts image to other parents
6. Other parents tap link → land on CoolKids → sign up to RSVP → now registered users
7. New users discover all public events → viral loop complete

### Theme Library (color palettes + design elements, NO licensed characters):
- **Superhero:** red/blue, starburst, comic font, cape silhouette
- **Princess:** pink/purple/gold, sparkles, crown shapes, elegant script
- **Dinosaur:** green/orange, jungle leaves, dino silhouettes, bold font
- **Under the Sea:** blue/teal/coral, bubbles, wave patterns, fish shapes
- **Space:** dark blue/purple, stars, rocket silhouettes, futuristic font
- **Safari:** tan/green/brown, animal prints, leaf patterns
- **Sports:** team colors, ball shapes, bold block font
- **Unicorn:** pastel rainbow, stars, cloud shapes, whimsical font
- **Construction:** yellow/orange/black, stripes, hard hat shapes
- **Farm:** red/green/brown, barn shapes, animal silhouettes
- **Gaming:** neon green/purple/black, pixel font, controller shapes
- **Art Party:** rainbow splatter, paint brush shapes, playful font

### Why no licensed characters:
AI cannot generate Superman, Bluey, Paw Patrol, etc. — copyright restrictions. But parents don't need the character on the invite. They need it to FEEL like the theme. Bold red/blue with a starburst FEELS like a superhero party. This approach is more reliable, looks more premium, and avoids legal issues.

### Key architecture decisions (for when this gets built):
- Private events need a visibility flag (public/private/invite-only)
- Private events should NOT appear in main event listings or search
- Private events need a nullable venue_id (party might be at someone's house, not a venue)
- Invite links should work without login (show event details) but require signup to RSVP
- Share images generated server-side (canvas API or image generation service)
- Consider Vercel OG image generation for dynamic social preview images
