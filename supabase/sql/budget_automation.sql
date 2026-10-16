-- Run this once in the Supabase SQL editor to enable budget automation:
-- recurring income/expenses that post themselves, and monthly auto-saves
-- into savings goals. Safe to run twice. Until it runs, recurring items and
-- auto-saves are kept on this device only and cloud saves log an error in
-- the browser console.

create table if not exists public.recurring_transactions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id bigint not null,
  description text not null,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'yearly')),
  start_date date not null,
  end_date date,
  -- Most recent date a transaction was created for this item.
  last_posted date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  check (end_date is null or end_date >= start_date)
);

alter table public.recurring_transactions enable row level security;

drop policy if exists "Users read own recurring transactions" on public.recurring_transactions;
create policy "Users read own recurring transactions"
  on public.recurring_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users add own recurring transactions" on public.recurring_transactions;
create policy "Users add own recurring transactions"
  on public.recurring_transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own recurring transactions" on public.recurring_transactions;
create policy "Users update own recurring transactions"
  on public.recurring_transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own recurring transactions" on public.recurring_transactions;
create policy "Users delete own recurring transactions"
  on public.recurring_transactions for delete
  using (auth.uid() = user_id);

-- Transactions posted by a recurring item remember which item and which
-- scheduled date they came from. The unique index stops two devices posting
-- the same occurrence twice (rows without a recurring item never clash,
-- because nulls are distinct).
alter table public.transactions
  add column if not exists recurring_id bigint,
  add column if not exists occurrence date;

create unique index if not exists transactions_recurring_occurrence_key
  on public.transactions (user_id, recurring_id, occurrence);

-- Monthly auto-save into a savings goal. last_contribution is the last
-- month ("YYYY-MM") the amount was added.
alter table public.goals
  add column if not exists monthly_contribution numeric not null default 0
    check (monthly_contribution >= 0),
  add column if not exists last_contribution text
    check (last_contribution is null or last_contribution ~ '^\d{4}-(0[1-9]|1[0-2])$');
