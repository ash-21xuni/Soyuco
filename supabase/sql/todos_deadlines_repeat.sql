-- Run this once in the Supabase SQL editor to add task deadlines and
-- repeating tasks. Until it runs, task saves to the cloud fail (the app keeps
-- working from local storage and logs the error to the browser console).

alter table public.todos
  add column if not exists due_date date,
  add column if not exists due_time text,
  add column if not exists repeat text not null default 'none',
  add column if not exists done_dates date[] not null default '{}';

alter table public.todos
  drop constraint if exists todos_repeat_check;
alter table public.todos
  add constraint todos_repeat_check
  check (repeat in ('none', 'daily', 'weekdays', 'weekly', 'monthly'));

alter table public.todos
  drop constraint if exists todos_due_time_check;
alter table public.todos
  add constraint todos_due_time_check
  check (due_time is null or due_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
