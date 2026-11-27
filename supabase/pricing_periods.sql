-- Seasonal price periods: between start_date and end_date (inclusive), a rental
-- whose START date falls in the period uses the period's price grid instead of
-- the standard one in pricing_tiers. Periods never overlap.
--
-- tiers: { "Himalayan": [{"days":2,"price":300}, ...], "CFMoto700": [...] }
-- A model missing from tiers falls back to the standard grid.
--
-- RLS enabled with zero policies: access goes through service-role API routes
--   - public read:  app/api/pricing/route.js
--   - admin write:  app/api/admin/pricing/periods/route.js (role 'admin' only)

create table if not exists public.pricing_periods (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_date date not null,
  end_date   date not null check (end_date >= start_date),
  tiers      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pricing_periods enable row level security;
