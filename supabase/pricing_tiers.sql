-- Rental price per number of days, per motorcycle model.
-- Replaces the hardcoded HIMALAYAN_PRICING / CFMOTO_PRICING arrays.
--
-- RLS enabled with zero policies (same as the other tables): all access goes
-- through service-role API routes:
--   - public read:  app/api/pricing/route.js
--   - admin write:  app/api/admin/pricing/route.js (role 'admin' only)
--
-- Seeded with the current prices so nothing changes when this is applied.

create table if not exists public.pricing_tiers (
  model      text not null,
  days       integer not null check (days > 0),
  price      numeric(10,2) not null check (price >= 0),
  updated_at timestamptz not null default now(),
  primary key (model, days)
);

alter table public.pricing_tiers enable row level security;

insert into public.pricing_tiers (model, days, price) values
  ('Himalayan', 1, 280), ('Himalayan', 2, 280), ('Himalayan', 3, 400),
  ('Himalayan', 4, 530), ('Himalayan', 5, 660), ('Himalayan', 6, 790),
  ('Himalayan', 7, 899), ('Himalayan', 8, 1010), ('Himalayan', 9, 1175),
  ('Himalayan', 10, 1230), ('Himalayan', 11, 1290), ('Himalayan', 12, 1350),
  ('Himalayan', 13, 1380), ('Himalayan', 14, 1420), ('Himalayan', 21, 1800),
  ('CFMoto700', 1, 340), ('CFMoto700', 2, 340), ('CFMoto700', 3, 480),
  ('CFMoto700', 4, 640), ('CFMoto700', 5, 790), ('CFMoto700', 6, 950),
  ('CFMoto700', 7, 1080), ('CFMoto700', 8, 1210), ('CFMoto700', 9, 1410),
  ('CFMoto700', 10, 1480), ('CFMoto700', 11, 1550), ('CFMoto700', 12, 1620),
  ('CFMoto700', 13, 1660), ('CFMoto700', 14, 1700), ('CFMoto700', 21, 2160)
on conflict (model, days) do nothing;
