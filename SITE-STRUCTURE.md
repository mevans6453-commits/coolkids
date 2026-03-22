# CoolKids Site Structure — Growth Plan

> How the site should evolve as it expands beyond kids events into a full local events platform.

---

## The Problem We're Solving

Right now everything lives on one `/events` page with filters. That works fine at 93 events across 21 venues. But as we add sports leagues, concerts, festivals, farmers markets, adult classes, and seasonal attractions, one flat list won't cut it. Parents will get overwhelmed. The structure needs to scale without losing the "just show me what's happening this weekend" simplicity.

---

## Core Principle: Don't Organize by Category — Organize by Intent

Parents don't think "I want an *outdoor* event." They think:

- "What's happening **this weekend**?"
- "What's **close by** and **free**?"
- "What's the **big thing** everyone's talking about?"
- "What can I do with a **toddler** on a rainy Tuesday?"

The site structure should mirror these questions, not mirror a database schema.

---

## Proposed Navigation

The nav should stay minimal. No mega-menus. No dropdowns with 30 categories.

```
CoolKids    [This Weekend]    [Explore]    [Venues]    [My Events]    [Sign In]
```

### This Weekend (Quick Access)
The most common use case. A focused view showing only events happening in the next 2–3 days, sorted by distance from the user's ZIP. No filters needed — it's already filtered. If nothing's happening, widen to "This Week" automatically with a note.

### Explore (Replaces Current /events)
The full browsable event catalog. All the current filters (Sort, Group, When, Cost, Category, Age) live here. This is the power-user page for people who want to plan ahead or browse broadly.

### Venues
Already exists. Stays as-is — venue directory with event counts.

### My Events
Already exists. Starred + attending events with list/calendar toggle.

---

## Event Taxonomy

### Axis 1: Distance Tiers

> Based on the user's ZIP code from their profile. Default center: Canton, GA (30114).

| Tier | Label | Rough Distance | Current Venues That Fit |
|------|-------|---------------|------------------------|
| **Local** | "Right here" | 0–15 miles | Cherokee County Parks & Rec, Cherokee Aquatic Center, Canton Farmers Market, Canton Theatre, Sequoyah Library, Elm Street Arts, The Holler |
| **Nearby** | "Short drive" | 15–35 miles | Cagle's Family Farm, Pettit Creek Farms, Woodstock Arts, Reinhardt University, Scottsdale Farms |
| **Day Trip** | "Worth the drive" | 35–60 miles | Booth Western Art Museum, Chattahoochee Nature Center, North Georgia Zoo, Gibbs Gardens |
| **Big Outing** | "Make a day of it" | 60+ miles | Amicalola Falls State Park, Mercier Orchards, Ellijay Apple Houses, Burt's Pumpkin Farm |

**How this works in the UI:**
- On the Explore page, a "Distance" filter dropdown with these four tiers
- Requires user to have a ZIP in their profile (or fall back to 30114)
- "This Weekend" page auto-sorts by distance — closest first
- Venue cards could show a subtle distance badge: "12 mi" or "~45 min"

**Not hard-coded:** The tiers should be driven by actual geocoded distance from the user's ZIP to the venue's coordinates (we already have lat/long fields in the venues table). The labels ("Right here" vs "Short drive") are just display names for the ranges.

---

### Axis 2: Event Scale

Not all events are created equal. A massive pumpkin festival with 5,000 attendees is different from Tuesday morning story time at the library. The site should reflect this.

| Scale | Description | Current Examples |
|-------|-------------|-----------------|
| **Featured** | Big ticketed events, festivals, limited-time experiences that drive traffic. Worth planning around. | Daffodil Festival (Gibbs Gardens), Bunnypalooza (North Georgia Zoo), Earth Day Festival (Chattahoochee Nature Center), Spring Fling (Cherokee Parks) |
| **Community** | Regular events — classes, workshops, recurring meetups, open hours. The everyday stuff. | BAA Workshops (Booth Museum), Parents' Night Out Pool Party, Guided Waterfall Hike, Canton Farmers Market, Field Trip Season (Cagle's Farm) |
| **Seasonal** | Ongoing attractions tied to a season. Not a single date — a window of time. Often multi-week or multi-month. | Daffodil Festival (Mar–Apr), Spring Field Trip Season (Mar–May), Apple Picking Season (fall), Pumpkin Patch Season (fall) |

**How this works in the UI:**
- Featured events get visual prominence — larger cards, a "Featured" badge, maybe a hero slot on the homepage
- Community events are the default "bread and butter" — standard list/grid cards
- Seasonal events get a distinct treatment — a banner-style card with the date range prominent, maybe a "Season" badge
- The `event_type` column already exists. We could extend it: `'event' | 'hours' | 'featured' | 'seasonal'`
- Or add a separate `event_scale` column to keep classification and scale independent

**Not hard-coded:** What qualifies as "featured" should be easy to toggle from the admin dashboard. A staff pick, basically. Don't try to auto-detect this — it's editorial judgment.

---

### Axis 3: Audience (Already Partially Built)

We already have age filters (Toddler, Preschool, Elementary, Tween/Teen). This axis expands later:

| Audience | Who It's For |
|----------|-------------|
| **Little Kids** | Toddler + Preschool (0–5). Farms, story time, splash pads. |
| **Big Kids** | Elementary + Tween (6–13). Workshops, sports, adventure. |
| **Family** | Everyone welcome. Festivals, venue visits, seasonal. |
| **Parents** | Adults-only or parents' night out. Date nights, workshops. |
| **Teens** | 13+ appropriate. Music, sports, volunteering. |

This is the future expansion path — as we add concerts, sports leagues, etc., audience becomes more important than age ranges.

---

## How the Homepage Evolves

The homepage should be a curated "front page," not a miniature version of the events page.

### Current State
- Hero section
- 4 feature cards (Browse Events, This Weekend, etc.)
- Featured venues
- Dad joke

### Proposed Evolution

```
┌─────────────────────────────────────────────┐
│  HERO: "This Weekend in Cherokee County"    │
│  2–3 featured events as a carousel/stack    │
├─────────────────────────────────────────────┤
│  🔥 TRENDING                                │
│  3–4 events with the most stars/going       │
├─────────────────────────────────────────────┤
│  📍 NEAR YOU (if logged in with ZIP)        │
│  Events within 15 miles, sorted by date     │
├─────────────────────────────────────────────┤
│  🌸 SEASONAL SPOTLIGHT                      │
│  Current seasonal events with banner cards  │
├─────────────────────────────────────────────┤
│  😄 Dad Joke of the Day                     │
├─────────────────────────────────────────────┤
│  🏠 FEATURED VENUES                         │
│  Already exists — keeps community feel      │
└─────────────────────────────────────────────┘
```

Each section links to a filtered view on the Explore page. "Trending" → Explore sorted by trending. "Near You" → Explore filtered by Local distance tier. No new pages needed.

---

## How Filters Evolve on the Explore Page

Current filters: Sort, Group, When, Cost, Category, Age, Hours toggle

### Add (in priority order):

1. **Distance** — Local / Nearby / Day Trip / Big Outing (requires ZIP)
2. **Scale** — Featured / Community / Seasonal / All
3. **Venue** — Dropdown multi-select to filter to specific venues

### Don't add:
- A separate filter for every possible category. Categories should stay as tags on events, not as top-level navigation items. If someone wants "farm" events, they use the Category filter. They don't need a `/farms` page.

### Filter combinations that matter:
| Parent Question | Filter Combo |
|----------------|--------------|
| "Free stuff this weekend near me" | When: This Weekend + Cost: Free + Distance: Local |
| "Big events worth planning for" | Scale: Featured + When: This Month |
| "What can my toddler do?" | Age: Toddler + Distance: Local/Nearby |
| "What's happening at Booth Museum?" | Group: Venue → expand Booth, or Venue filter |

---

## When New Pages Make Sense (and When They Don't)

### Don't create pages for:
- Individual categories (no `/farms`, `/museums`, `/outdoor`)
- Individual distance tiers (no `/nearby`, `/day-trips`)
- Every event type (no `/workshops`, `/festivals`)

These are all filter states on the Explore page. Different URLs, same page:
- `/explore?category=farm` instead of `/farms`
- `/explore?distance=day-trip&when=this-month` instead of `/day-trips`

### Do create pages for:
- **Individual event detail** (`/events/[id]`) — when events have enough data to warrant a full page (description, photos, map, who's going, related events)
- **Individual venue detail** (`/venues/[id]`) — venue profile with upcoming events, location, reviews
- **This Weekend** (`/this-weekend`) — the quick-access focused view
- **Private events** (`/events/create`) — the invite/party feature from the roadmap
- **Newsletter archive** (`/newsletter`) — when newsletters are built

---

## URL Strategy

```
/                        → Homepage (curated sections)
/explore                 → Full event catalog (replaces current /events, keep /events as redirect)
/explore?when=weekend    → Pre-filtered views via query params
/this-weekend            → Focused weekend view (convenience shortcut)
/venues                  → Venue directory
/venues/[slug]           → Individual venue (future)
/events/[id]             → Individual event detail (future)
/events/create           → Private event creation (future)
/my-events               → User's starred/attending
/suggest                 → Suggest a venue
/profile                 → User profile
/subscribe               → Sign in / sign up
/admin/scraping          → Admin dashboard
```

---

## What NOT to Do

1. **Don't create a separate section for every content type.** Sports, concerts, classes — these are all just events with different categories. One Explore page with good filters beats 10 separate pages.

2. **Don't add top-level nav items for categories.** "Farms" is not a nav item. "Explore" is a nav item. Farms is a filter within Explore.

3. **Don't build distance features without geocoding.** The distance tiers only work if we calculate real distances. Rough radius from ZIP centroid is fine — don't need turn-by-turn driving distance.

4. **Don't over-organize before we have the content.** At 93 events, we don't need 6 sections and 15 filters. Add structure as content grows. The next additions should be Distance filter and Event Scale — those add the most value with the least complexity.

---

## Implementation Priority

| Priority | Feature | Why |
|----------|---------|-----|
| **Now** | Distance filter (using venue lat/long + user ZIP) | Most requested parent question: "What's near me?" |
| **Soon** | Event scale classification (Featured/Community/Seasonal) | Lets us highlight the good stuff on homepage |
| **Soon** | "This Weekend" quick view | Most common use case deserves its own entry point |
| **Later** | Event detail pages (`/events/[id]`) | Need more event data first (photos, full descriptions) |
| **Later** | Venue detail pages (`/venues/[slug]`) | Need venue photos, reviews, full profiles |
| **Later** | Rename `/events` to `/explore` with redirect | Naming matters, but not urgent |
| **Future** | Individual venue profiles with maps | Requires Google Maps integration |
| **Future** | Audience expansion beyond age ranges | Only needed when content diversifies |

---

## Open Questions

1. **Should "This Weekend" be a nav item or a homepage section?** Making it a nav item is more discoverable. Making it a homepage section keeps the nav shorter. Could do both — nav link that anchors to the homepage section, or a standalone `/this-weekend` page.

2. **When do we rename "Events" to "Explore"?** The word "Explore" signals browsability. "Events" is literal. Could wait until we have more content types (venues with hours, seasonal attractions, etc.) to justify the rename.

3. **How do we handle venues with no events?** 9 of 21 venues have 0 events. Should they still show on the venues page? Yes — they validate the venue list. But they should be visually distinct (grayed out, or "Coming Soon" badge).

4. **Do we need a search bar?** Not yet at 93 events. But once we cross ~200 events, free-text search becomes important. Plan for it in the nav layout.

---

*Last updated: March 22, 2026*
