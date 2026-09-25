-- Run this once in the Supabase SQL editor to enable habit history.
-- When weekly habit reset is on, the app saves a snapshot of each finished
-- week here (one row per user per week) before clearing the ticks. Until it
-- runs, history is kept on this device only and cloud saves log an error.

create table if not exists public.habit_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Sunday the week started on (the habit grid runs Sun–Sat).
  week_start date not null,
  -- [{ "id": number, "name": text, "days": [7 booleans, Sun..Sat] }]
  habits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.habit_history enable row level security;

drop policy if exists "Users read own habit history" on public.habit_history;
create policy "Users read own habit history"
  on public.habit_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users add own habit history" on public.habit_history;
create policy "Users add own habit history"
  on public.habit_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own habit history" on public.habit_history;
create policy "Users update own habit history"
  on public.habit_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own habit history" on public.habit_history;
create policy "Users delete own habit history"
  on public.habit_history for delete
  using (auth.uid() = user_id);
