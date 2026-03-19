-- ===========================================
-- CoolKids - Profiles Table Migration
-- Run this in the Supabase SQL Editor
-- ===========================================

-- Profiles table linked to auth.users
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  zip text,
  kids_ages integer[] default '{}',
  interest_categories text[] default '{}',
  max_distance_miles integer default 25,
  newsletter_preference text default 'none'
    check (newsletter_preference in ('weekly', 'monthly', 'none')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for newsletter queries
create index if not exists idx_profiles_newsletter
  on profiles(newsletter_preference)
  where newsletter_preference != 'none';

-- Enable RLS
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-update updated_at
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

-- Auto-create a profile when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
