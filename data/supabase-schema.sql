-- ===========================================
-- CoolKids - Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables
-- ===========================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- -----------------------------------------------
-- VENUES TABLE
-- Stores all tracked family-friendly venues
-- -----------------------------------------------
create table if not exists venues (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  city text not null,
  county text not null default 'Cherokee',
  state text not null default 'GA',
  zip text,
  website text,
  scrape_url text,
  scrape_method text check (scrape_method in ('firecrawl', 'apify', 'manual')),
  categories text[] default '{}',
  phone text,
  description text,
  latitude double precision,
  longitude double precision,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------
-- EVENTS TABLE
-- Stores scraped events linked to venues
-- -----------------------------------------------
create table if not exists events (
  id uuid default uuid_generate_v4() primary key,
  venue_id uuid references venues(id) on delete cascade not null,
  name text not null,
  description text,
  start_date date not null,
  end_date date,
  start_time text,
  end_time text,
  cost text,
  cost_min numeric,
  cost_max numeric,
  is_free boolean default false,
  age_range_min integer,
  age_range_max integer,
  categories text[] default '{}',
  source_url text,
  image_url text,
  is_recurring boolean default false,
  recurrence_rule text,
  status text default 'published' check (status in ('published', 'draft', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------
-- SUBSCRIBERS TABLE
-- Stores newsletter subscribers and their preferences
-- -----------------------------------------------
create table if not exists subscribers (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  name text,
  zip text,
  max_distance_miles integer,
  kids_ages integer[] default '{}',
  interest_categories text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  unsubscribed_at timestamptz
);

-- -----------------------------------------------
-- VENUE_SUGGESTIONS TABLE
-- Stores user-submitted venue suggestions
-- -----------------------------------------------
create table if not exists venue_suggestions (
  id uuid default uuid_generate_v4() primary key,
  suggested_by_email text not null,
  venue_name text not null,
  venue_url text,
  notes text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- -----------------------------------------------
-- INDEXES for faster queries
-- -----------------------------------------------
create index if not exists idx_events_start_date on events(start_date);
create index if not exists idx_events_venue_id on events(venue_id);
create index if not exists idx_events_status on events(status);
create index if not exists idx_venues_is_active on venues(is_active);
create index if not exists idx_subscribers_is_active on subscribers(is_active);

-- -----------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Controls who can read/write data
-- -----------------------------------------------

-- Enable RLS on all tables
alter table venues enable row level security;
alter table events enable row level security;
alter table subscribers enable row level security;
alter table venue_suggestions enable row level security;

-- Venues: anyone can read, only authenticated users can write
create policy "Venues are publicly readable"
  on venues for select
  using (true);

-- Events: anyone can read published events
create policy "Published events are publicly readable"
  on events for select
  using (status = 'published');

-- Subscribers: only the API can manage (via service role key)
-- The anon key cannot read subscriber data
create policy "Subscribers managed by service role only"
  on subscribers for all
  using (false);

-- Venue suggestions: anyone can insert, only service role can read
create policy "Anyone can suggest a venue"
  on venue_suggestions for insert
  with check (true);

create policy "Suggestions readable by service role only"
  on venue_suggestions for select
  using (false);

-- -----------------------------------------------
-- AUTO-UPDATE the updated_at timestamp
-- -----------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger venues_updated_at
  before update on venues
  for each row execute function update_updated_at_column();

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at_column();
