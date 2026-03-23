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
- `venues` — 66 active venues (70 total, 4 deactivated) with scrape_urls auto-discovered by the multi-strategy engine
- `events` — 201 clean events across 27 venues (smart validation filters junk, past events, closures, daily attractions; event_type classification + age_range fields)
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
- 10 new venues seeded (21 total — Scottsdale Farms, Pettit Creek, Mercier Orchards, Sequoyah Library, Chattahoochee Nature Center, Canton Theatre, Elm Street Arts, The Holler, Woodstock Arts + Cherokee Parks URL update)
- Pricing backfill — all events have cost, cost_min, cost_max, and pricing_notes
- Multi-day event deduplication (consecutive-day duplicates merged, e.g. "Apr 4–5")
- Expandable date ranges on multi-day events (chevron dropdown shows individual dates with per-date "Add to Calendar" buttons; weekends only for long spans)
- Multi-strategy scraper system (5 strategies: jsonld, ical, rss, html, apify — auto-detection, fallback, scrape_runs logging, preferred_strategy stored per venue)
- Mobile optimization (hamburger menu, stacked card layout, 44px touch targets, calendar fallback to list on small screens, 16px base font, iOS zoom prevention)
- Scrape monitoring dashboard at /admin/scraping (strategy scoreboard, venue table with color-coded status, per-venue scrape buttons, inline event editing for event_type and age ranges)
- Event classification: event_type column ('event' vs 'hours') with smart keyword-based classification + backfill of all existing events (17 classified as hours)
- Age range extraction: auto-parses age info from event text (named groups like "toddler", numeric ranges like "ages 3-5", "all ages" → 0-99)
- Age filter dropdown on Events page (Toddler, Preschool, Elementary, Tween/Teen) + "Include hours" toggle
- Share button on all event cards (native share sheet on mobile via navigator.share, clipboard copy on desktop)
- My Events un-star and un-attend toggles (star + going buttons on list rows; tap-to-select detail panel in calendar view)
- My Events calendar multi-day fix (long-span events show weekends only instead of every day)
- Date column width fix (widened to fit date ranges like "Mar 30 – Apr 14" on one line)

## What's NOT Built Yet
- Newsletter (email service, template, personalization, cron)
- Ratings ("How was it?" after events)
- Friends/neighbors feature ("Mike's family is going")
- Dad joke share button
- PWA (Progressive Web App)
- Deploy custom domain
- Expand beyond kids to adult event channels
- Private Events & Party Invites (see growth engine section below)
- Scraper configs for remaining zero-event venues (seasonal, JS-rendered, or blocked — see venue list)

## Venues Currently in Database (70 total, 66 active)
### Top Venues by Event Count
1. Fulton County Library System (18 events — strategy: html)
2. Zoo Atlanta (19 events — strategy: html)
3. North Georgia Zoo (15 events — strategy: html)
4. Stone Mountain Park (15 events — strategy: jsonld)
5. Fernbank Museum of Natural History (14 events — strategy: apify)
6. Cumming City Center (12 events — strategy: jsonld)
7. Tellus Science Museum (12 events — strategy: html)
8. Southeastern Railway Museum (10 events — strategy: jsonld)
9. Avalon (10 events — strategy: html)
10. Ponce City Market (10 events — strategy: jsonld)
11. City of Alpharetta Events (8 events — strategy: jsonld)
12. Amicalola Falls State Park (7 events — strategy: jsonld)
13. Scottsdale Farms (7 events — strategy: html)
14. Cobb Energy Performing Arts Centre (7 events — strategy: html)
15. Callanwolde Fine Arts Center (6 events — strategy: html)
16. Atlanta Botanical Garden (3 events — strategy: html)
17. Reinhardt University (5 events — strategy: jsonld)
18. Booth Western Art Museum (4 events — strategy: jsonld)
19. Pettit Creek Farms (4 events — strategy: html)
20. Southern Museum of Civil War and Locomotive History (3 events — strategy: jsonld)
21. Visit Roswell (3 events — strategy: html)
22. Chattahoochee Nature Center (2 events — strategy: jsonld)
23. Cherokee County Parks & Recreation (2 events — strategy: jsonld)
24. Mercier Orchards (2 events — strategy: html)
25. Aurora Theatre (2 events — strategy: html)
26. Margaritaville at Lanier Islands (2 events — strategy: html)
27. Atlanta Botanical Garden Gainesville (1 event — strategy: html)

### Venues with 0 Events (39 venues — seasonal, JS-rendered, or blocked)
- Libraries: Sequoyah Regional Library, Forsyth County Public Library (JS-rendered)
- Farms: Berry Patch, Burt's Pumpkin, Copper Creek, Uncle Shuck's, Cagle's, Jaemor (seasonal/blocked)
- JS-rendered: Atlanta History Center, High Museum, City of Woodstock, Canton Theatre, Center for Puppetry Arts
- Blocked: INK Children's Museum, Sandy Springs Performing Arts, City of Canton Events
- Other: Hot Wheels (image-only), The Holler (Facebook only), Play Street Museum, Dad's Garage, Alliance Theatre, and more

### Deactivated Venues
- Elm Street Cultural Arts Village (site down)
- Explore Canton Events (duplicate of Canton Farmers Market)
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
- APIFY_API_TOKEN set in .env.local (for Apify scraping strategy)
- Multi-strategy scraper auto-discovers venues from DB (any venue with scrape_url gets scraped)
- scrape_runs table logs every attempt; venues.preferred_strategy stores the winning strategy

## Pricing Data Status ✅ COMPLETE
- All events have pricing data (cost, cost_min, cost_max, pricing_notes)
- FREE events properly flagged with is_free = true
- Cost filters (Free, Under $10, Under $25) are functional

## Event Classification & Age Data ✅ COMPLETE
- event_type column: 'event' (default) or 'hours' — classifies venue hours vs real events
- Backfill complete: 17 events classified as 'hours', hidden by default on Events page
- Age range extraction: auto-parses from event text (4 events got age ranges populated)
- Age filter on Events page: Toddler (0-2), Preschool (3-5), Elementary (6-10), Tween/Teen (11+)
- Overlap logic: events with null ages shown for all age filters (assume for everyone)
- Admin dashboard at /admin/scraping: inline editing of event_type + age_range_min/max per event

## Scraping Philosophy
- Zero results from a venue does NOT mean they have no events
- It means the scraper probably needs adjustment for that venue's website format
- Never auto-remove or deprioritize a venue because the scraper returned nothing
- Flag zero-result venues for human review with a "needs_review" status
- Small local vendors (farms, markets, family businesses) often have non-standard websites — Facebook pages, PDFs, image-only calendars, no calendar at all
- The goal is to build scraping tools that work for EVERYBODY, not just venues with perfect websites
- If a venue can't be scraped automatically, flag it for manual entry
- Scrape monitoring logs every attempt to scrape_runs table: venue_id, strategy, events_found, status (success/empty/error), error_message, duration_ms
- Every venue deserves a fair chance to have their events discovered
- Multi-strategy approach: try jsonld → ical → rss → html → apify in priority order; first strategy that returns events wins

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
