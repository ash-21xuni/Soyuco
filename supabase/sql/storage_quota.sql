-- Run this once in the Supabase SQL editor (after soyucoins.sql) to enable the
-- storage bar in Settings. Safe to run twice.
--
-- Every account gets a free allowance (FREE_BYTES in storage_usage below) and
-- can add more by spending Soyucoins on storage packs. Packs stack and never
-- expire. Like theme unlocks, the price comes from this table, never the app.
-- Keep the packs in step with STORAGE_PACKS in src/lib/storage/storage.ts.

create table if not exists public.storage_packs (
  id text primary key,
  bytes bigint not null check (bytes > 0),
  price integer not null check (price > 0)
);

insert into public.storage_packs (id, bytes, price) values
  ('storage-500mb', 524288000, 300),
  ('storage-1gb', 1073741824, 500),
  ('storage-5gb', 5368709120, 1500)
on conflict (id) do update set bytes = excluded.bytes, price = excluded.price;

create table if not exists public.storage_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null references public.storage_packs (id),
  bytes bigint not null,
  price_paid integer not null,
  purchased_at timestamptz not null default now()
);

create index if not exists storage_purchases_user_idx on public.storage_purchases (user_id);

alter table public.storage_packs enable row level security;
alter table public.storage_purchases enable row level security;

drop policy if exists "Anyone reads storage packs" on public.storage_packs;
create policy "Anyone reads storage packs"
  on public.storage_packs for select
  using (true);

drop policy if exists "Users read own storage purchases" on public.storage_purchases;
create policy "Users read own storage purchases"
  on public.storage_purchases for select
  using (auth.uid() = user_id);

-- Bytes a user's rows take up in one table. Returns 0 for tables that don't
-- exist yet (not every feature's SQL may have been run).
create or replace function public.user_table_bytes(p_table text, p_user_id uuid)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  total bigint;
begin
  if to_regclass('public.' || quote_ident(p_table)) is null then
    return 0;
  end if;
  execute format('select coalesce(sum(pg_column_size(t.*)), 0) from public.%I t where t.user_id = $1', p_table)
    into total
    using p_user_id;
  return total;
end;
$$;

revoke all on function public.user_table_bytes(text, uuid) from public, anon, authenticated;

-- The signed-in user's usage per area, plus their total allowance.
create or replace function public.storage_usage()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  free_bytes constant bigint := 104857600; -- 100 MB
  images bigint;
  bought bigint;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(sum((metadata ->> 'size')::bigint), 0) into images
  from storage.objects
  where bucket_id = 'journal-images' and (storage.foldername(name))[1] = uid::text;

  select coalesce(sum(bytes), 0) into bought
  from storage_purchases
  where user_id = uid;

  return json_build_object(
    'journal', user_table_bytes('entries', uid) + user_table_bytes('collections', uid),
    'images', images,
    'planner', user_table_bytes('todos', uid) + user_table_bytes('habits', uid)
      + user_table_bytes('habit_history', uid) + user_table_bytes('mood_history', uid)
      + user_table_bytes('calendar_events', uid) + user_table_bytes('events', uid),
    'budget', user_table_bytes('transactions', uid) + user_table_bytes('goals', uid)
      + user_table_bytes('budget_limits', uid) + user_table_bytes('recurring_transactions', uid),
    'ai', user_table_bytes('ai_messages', uid),
    'free_bytes', free_bytes,
    'bought_bytes', bought
  );
end;
$$;

revoke all on function public.storage_usage() from public, anon;
grant execute on function public.storage_usage() to authenticated;

-- Spends coins on a storage pack. Returns the new balance.
create or replace function public.buy_storage(p_pack_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pack storage_packs%rowtype;
  new_balance integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into pack from storage_packs where id = p_pack_id;
  if not found then
    raise exception 'Unknown storage pack';
  end if;

  -- Check and deduct in one statement so two purchases can't share coins.
  update wallets
  set balance = balance - pack.price, updated_at = now()
  where user_id = uid and balance >= pack.price
  returning balance into new_balance;

  if new_balance is null then
    raise exception 'Not enough Soyucoins';
  end if;

  insert into storage_purchases (user_id, pack_id, bytes, price_paid)
  values (uid, pack.id, pack.bytes, pack.price);

  return new_balance;
end;
$$;

revoke all on function public.buy_storage(text) from public, anon;
grant execute on function public.buy_storage(text) to authenticated;
