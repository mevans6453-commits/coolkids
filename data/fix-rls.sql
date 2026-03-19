-- Run this in Supabase SQL Editor to allow inserting venues and events
create policy "Allow insert on venues" on venues for insert with check (true);
create policy "Allow update on venues" on venues for update using (true);
create policy "Allow insert on events" on events for insert with check (true);
create policy "Allow update on events" on events for update using (true);
