-- Run this once in the Supabase SQL editor to enable Soyucoins (the in-app
-- currency used to unlock premium themes). Safe to run twice.
--
-- Users can READ their own balance and themes but never write them directly.
-- Coins only change through two functions:
--   * unlock_theme()  - called by the signed-in user; spends coins on a theme
--                       at the price stored here, never a price the app sends.
--   * credit_coins()  - service role only; called by the server once a
--                       payment has been confirmed.

-- Prices live in the database so the browser can't choose what it pays.
-- Keep these in step with TIERS / COIN_PACKS in src/lib/marketplace/catalog.ts.
create table if not exists public.premium_themes (
  theme_id text primary key,
  price integer not null check (price > 0)
);

insert into public.premium_themes (theme_id, price) values
  ('spongebob', 400),
  ('meangirls', 400),
  ('minecraft', 500),
  ('cyberpunk', 750)
on conflict (theme_id) do update set price = excluded.price;

create table if not exists public.coin_packs (
  id text primary key,
  coins integer not null check (coins > 0),
  price_cents integer not null check (price_cents > 0)
);

insert into public.coin_packs (id, coins, price_cents) values
  ('coins-300', 300, 4000),
  ('coins-500', 500, 6000),
  ('coins-1000', 1000, 10000),
  ('coins-2500', 2500, 22500)
on conflict (id) do update
set coins = excluded.coins, price_cents = excluded.price_cents;

create table if not exists public.wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.owned_themes (
  user_id uuid not null references auth.users (id) on delete cascade,
  theme_id text not null references public.premium_themes (theme_id),
  price_paid integer not null,
  purchased_at timestamptz not null default now(),
  primary key (user_id, theme_id)
);

-- One row per confirmed payment. provider_ref is the payment provider's
-- transaction id; it's unique so a repeated webhook can't credit twice.
create table if not exists public.coin_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_id text not null references public.coin_packs (id),
  coins integer not null,
  price_cents integer not null,
  provider text not null,
  provider_ref text not null unique,
  created_at timestamptz not null default now()
);

alter table public.premium_themes enable row level security;
alter table public.coin_packs enable row level security;
alter table public.wallets enable row level security;
alter table public.owned_themes enable row level security;
alter table public.coin_purchases enable row level security;

drop policy if exists "Anyone reads premium theme prices" on public.premium_themes;
create policy "Anyone reads premium theme prices"
  on public.premium_themes for select
  using (true);

drop policy if exists "Anyone reads coin packs" on public.coin_packs;
create policy "Anyone reads coin packs"
  on public.coin_packs for select
  using (true);

drop policy if exists "Users read own wallet" on public.wallets;
create policy "Users read own wallet"
  on public.wallets for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own themes" on public.owned_themes;
create policy "Users read own themes"
  on public.owned_themes for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own coin purchases" on public.coin_purchases;
create policy "Users read own coin purchases"
  on public.coin_purchases for select
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policies: with RLS on, those are
-- refused for app users. The functions below run as their owner instead.

-- Spends coins on a premium theme. Returns the new balance.
create or replace function public.unlock_theme(p_theme_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cost integer;
  new_balance integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select price into cost from premium_themes where theme_id = p_theme_id;
  if cost is null then
    raise exception 'Unknown theme';
  end if;

  if exists (select 1 from owned_themes where user_id = uid and theme_id = p_theme_id) then
    raise exception 'You already own this theme';
  end if;

  -- The balance check and the deduction happen in one statement, so two
  -- unlocks at once can't both spend the same coins.
  update wallets
  set balance = balance - cost, updated_at = now()
  where user_id = uid and balance >= cost
  returning balance into new_balance;

  if new_balance is null then
    raise exception 'Not enough Soyucoins';
  end if;

  insert into owned_themes (user_id, theme_id, price_paid)
  values (uid, p_theme_id, cost);

  return new_balance;
end;
$$;

revoke all on function public.unlock_theme(text) from public, anon;
grant execute on function public.unlock_theme(text) to authenticated;

-- Adds a pack's coins after a confirmed payment. Returns the new balance.
-- Calling it again with the same provider_ref does nothing.
create or replace function public.credit_coins(
  p_user_id uuid,
  p_pack_id text,
  p_provider text,
  p_provider_ref text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  pack coin_packs%rowtype;
  new_balance integer;
begin
  select * into pack from coin_packs where id = p_pack_id;
  if not found then
    raise exception 'Unknown coin pack';
  end if;

  insert into coin_purchases (user_id, pack_id, coins, price_cents, provider, provider_ref)
  values (p_user_id, pack.id, pack.coins, pack.price_cents, p_provider, p_provider_ref)
  on conflict (provider_ref) do nothing;

  if not found then
    -- Already credited for this payment.
    select balance into new_balance from wallets where user_id = p_user_id;
    return coalesce(new_balance, 0);
  end if;

  insert into wallets (user_id, balance)
  values (p_user_id, pack.coins)
  on conflict (user_id) do update
  set balance = wallets.balance + excluded.balance, updated_at = now()
  returning balance into new_balance;

  return new_balance;
end;
$$;

-- Only the server (service role key) may credit coins.
revoke all on function public.credit_coins(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.credit_coins(uuid, text, text, text) to service_role;
