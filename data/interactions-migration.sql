-- ===========================================
-- CoolKids - Event Interactions Migration
-- Run this in the Supabase SQL Editor
-- ===========================================

-- User event interactions (star, attending)
create table if not exists user_event_interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  interaction_type text not null check (interaction_type in ('star', 'attending')),
  created_at timestamptz default now(),
  unique(user_id, event_id, interaction_type)
);

-- Indexes for common queries
create index if not exists idx_interactions_user on user_event_interactions(user_id);
create index if not exists idx_interactions_event on user_event_interactions(event_id);
create index if not exists idx_interactions_type on user_event_interactions(event_id, interaction_type);

-- Enable RLS
alter table user_event_interactions enable row level security;

-- Anyone can read interactions (needed for aggregate counts)
create policy "Anyone can read interactions"
  on user_event_interactions for select using (true);

-- Users can insert their own interactions
create policy "Users can insert own interactions"
  on user_event_interactions for insert
  with check (auth.uid() = user_id);

-- Users can delete their own interactions (untoggle)
create policy "Users can delete own interactions"
  on user_event_interactions for delete
  using (auth.uid() = user_id);
