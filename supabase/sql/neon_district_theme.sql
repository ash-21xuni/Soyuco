-- Run this once in the Supabase SQL editor to put the Neon District theme
-- (Pro tier, 750 Soyucoins) on sale. Safe to run twice. Until it runs,
-- unlocking it fails with "Unknown theme".
-- Keep the price in step with TIERS.pro in src/lib/marketplace/catalog.ts.
insert into public.premium_themes (theme_id, price) values
  ('cyberpunk', 750)
on conflict (theme_id) do update set price = excluded.price;
