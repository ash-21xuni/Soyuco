-- Run this once in the Supabase SQL editor to enable Google-Calendar-style
-- events (start/end times, colours, repeats). It also copies events from the
-- old one-per-hour `events` table, which is left untouched as a backup.
-- Until it runs, events are kept on this device only and cloud saves log an
-- error in the browser console.

create table if not exists public.calendar_events (
  user_id uuid not null references auth.users (id) on delete cascade,
  id bigint not null,
  title text not null,
  -- First (or only) day the event happens.
  day date not null,
  start_time text not null check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time text not null check (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  color text not null default 'peacock',
  repeat text not null default 'none'
    check (repeat in ('none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom')),
  -- Weekdays (0 = Sun) and every-N-weeks for a "custom" repeat.
  repeat_days smallint[] not null default '{}',
  repeat_interval smallint not null default 1 check (repeat_interval between 1 and 52),
  repeat_until date,
  -- Days removed from a repeating series.
  exceptions date[] not null default '{}',
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  check (end_time > start_time)
);

alter table public.calendar_events enable row level security;

drop policy if exists "Users read own calendar events" on public.calendar_events;
create policy "Users read own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users add own calendar events" on public.calendar_events;
create policy "Users add own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own calendar events" on public.calendar_events;
create policy "Users update own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own calendar events" on public.calendar_events;
create policy "Users delete own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- One-off copy of the old hourly events. The id (UTC-midnight epoch ms + hour)
-- matches what the app generates when converting events cached on a device.
do $$
begin
  if to_regclass('public.events') is not null then
    insert into public.calendar_events
      (user_id, id, title, day, start_time, end_time, color, ai_generated)
    select
      e.user_id,
      (extract(epoch from e.day::date::timestamp) * 1000)::bigint + e.hour,
      e.text,
      e.day::date,
      lpad(e.hour::text, 2, '0') || ':00',
      case when e.hour >= 23 then '23:59' else lpad((e.hour + 1)::text, 2, '0') || ':00' end,
      case when coalesce(e.ai_generated, false) then 'lavender' else 'peacock' end,
      coalesce(e.ai_generated, false)
    from public.events e
    where coalesce(trim(e.text), '') <> ''
    on conflict (user_id, id) do nothing;
  end if;
end $$;
