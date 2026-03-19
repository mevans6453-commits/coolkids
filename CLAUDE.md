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
- `venues` — 21 venues (only 4 have scraper configs: Tellus, Booth, Gibbs, Cagle's; the other 17 were manually seeded)
- `events` — 45 events scraped from venue websites
- `profiles` — User profiles (ZIP, kids ages, interests, distance)
- `user_event_interactions` — Stars, attending, hidden, reported records
- `venue_suggestions` — User-submitted venue suggestions (table verified in Supabase)
- `dad_jokes` — 30 dad jokes for daily rotation on homepage

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
- My Events page (/my-events)
- user_event_interactions table with RLS

### Phase 3: Event Page Improvements ✅
- Sort dropdown: Date, Venue, Trending, Recently Added
- When dropdown: All, This Week, This Weekend, This Month, Next Month
- Cost dropdown: All, Free, Under $10, Under $25
- Category dropdown with multi-select
- List/grid view toggle
- Add to Calendar button (Google Calendar)
- Hide/Report (Not Interested + Report) via flag icon
- Pricing display: FREE badge, cost text, pricing_notes field
- pricing_notes column added to events table

### Phase 4: Data Polish ✅ (mostly)
- Pricing backfill ✅ — All 45 events now have cost, cost_min, cost_max, and pricing_notes populated
- Dad Jokes feature — Code fully built (table schema + component + 30 jokes), but migration has NOT been run in Supabase yet. Run the migration to activate.

## What's NOT Built Yet
- Suggest a Venue form (venue_suggestions table verified — ready to build UI)
- Calendar view (toggle between list and calendar)
- Scraper configs for 8 of 12 venues (only Tellus, Booth, Gibbs, Cagle's have configs)
- Load full 97-venue master list
- Newsletter (email service, template, personalization, cron)
- Ratings ("How was it?" after events)
- Friends/neighbors feature ("Mike's family is going")
- Share button on events
- Dad joke share button
- PWA (Progressive Web App)
- Deploy custom domain
- Expand beyond kids to adult event channels
- Private Events & Party Invites (see growth engine section below)

## Venues Currently in Database (21)
1. Tellus Science Museum (12 events)
2. Booth Western Art Museum (10 events)
3. North Georgia Zoo (9 events)
4. Gibbs Gardens (6 events)
5. Cagle's Family Farm (4 events)
6. Amicalola Falls State Park (2 events)
7. Canton Farmers Market (1 event)
8. Cherokee County Aquatic Center (1 event)
9. Burt's Pumpkin Farm (0 — seasonal, fall only)
10. Cherokee County Parks & Recreation (0 — updated URL to playcherokee.org)
11. Ellijay Apple Houses (0 — seasonal, fall only)
12. Reinhardt University (0 — different calendar system)
13. Scottsdale Farms (0 — needs scraper or manual entry)
14. Pettit Creek Farms (0 — needs scraper or manual entry)
15. Mercier Orchards (0 — needs scraper or manual entry)
16. Sequoyah Regional Library System (0 — needs scraper or manual entry)
17. Chattahoochee Nature Center (0 — needs scraper or manual entry)
18. Canton Theatre (0 — needs scraper or manual entry)
19. Elm Street Cultural Arts Village (0 — needs scraper or manual entry)
20. The Holler (0 — needs scraper or manual entry)
21. Woodstock Arts (0 — needs scraper or manual entry)

## Key Architecture Notes
- All IDs are UUIDs
- All date fields use timestamptz for timezone support
- events.venue_id is NOT NULL (required foreign key)
- All user tables have ON DELETE CASCADE
- Supabase RLS enabled on all tables
- Auth uses magic link email only (no passwords)
- Vercel auto-deploys when code is pushed to main on GitHub
- Scraper requires APIFY_API_TOKEN in .env.local to run (not currently set up)

## Pricing Data Status ✅ COMPLETE
- All 45 events now have pricing data (cost, cost_min, cost_max, pricing_notes)
- FREE events properly flagged with is_free = true
- Cost filters (Free, Under $10, Under $25) are functional

## Scraping Philosophy
- Zero results from a venue does NOT mean they have no events
- It means the scraper probably needs adjustment for that venue's website format
- Never auto-remove or deprioritize a venue because the scraper returned nothing
- Flag zero-result venues for human review with a "needs_review" status
- Small local vendors (farms, markets, family businesses) often have non-standard websites — Facebook pages, PDFs, image-only calendars, no calendar at all
- The goal is to build scraping tools that work for EVERYBODY, not just venues with perfect websites
- If a venue can't be scraped automatically, flag it for manual entry
- Scrape monitoring should log: which venues returned events, which returned zero, which errored
- Store scrape logs in a scrape_runs table: run_date, venue_id, events_found, status (success/empty/error), error_message
- Every venue deserves a fair chance to have their events discovered

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
