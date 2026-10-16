-- Run this once in the Supabase SQL editor to put the Afterglow (750
-- Soyucoins) and Lumen (500 Soyucoins) Pro themes on sale. Safe to run twice. Until it
-- runs, unlocking them fails with "Unknown theme".
-- Keep the prices in step with CATALOG in src/lib/marketplace/catalog.ts.
insert into public.premium_themes (theme_id, price) values
  ('partylights', 750),
  ('lumen', 500)
on conflict (theme_id) do update set price = excluded.price;
