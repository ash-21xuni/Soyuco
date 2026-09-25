-- Run this once in the Supabase SQL editor to enable custom repeats
-- ("every N weeks on Mon, Wed, Fri") for tasks and calendar events.
-- Safe to run whether or not todos_deadlines_repeat.sql and
-- calendar_events.sql have been run already, and safe to run twice.

alter table public.todos
  add column if not exists repeat text not null default 'none',
  add column if not exists repeat_days smallint[] not null default '{}',
  add column if not exists repeat_interval smallint not null default 1;

alter table public.todos
  drop constraint if exists todos_repeat_check;
alter table public.todos
  add constraint todos_repeat_check
  check (repeat in ('none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom'));

alter table public.todos
  drop constraint if exists todos_repeat_interval_check;
alter table public.todos
  add constraint todos_repeat_interval_check
  check (repeat_interval between 1 and 52);

do $$
begin
  if to_regclass('public.calendar_events') is not null then
    alter table public.calendar_events
      add column if not exists repeat_days smallint[] not null default '{}',
      add column if not exists repeat_interval smallint not null default 1;

    alter table public.calendar_events
      drop constraint if exists calendar_events_repeat_check;
    alter table public.calendar_events
      add constraint calendar_events_repeat_check
      check (repeat in ('none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom'));

    alter table public.calendar_events
      drop constraint if exists calendar_events_repeat_interval_check;
    alter table public.calendar_events
      add constraint calendar_events_repeat_interval_check
      check (repeat_interval between 1 and 52);
  end if;
end $$;
