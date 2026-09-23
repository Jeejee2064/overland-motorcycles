-- Behavior tracking: pageviews, link clicks, and booking-funnel steps.
--
-- RLS is enabled with zero policies, same as the rest of this project's
-- RLS-hardened tables — the anon/authenticated roles get no direct access.
-- All reads and writes go through service-role Next.js API routes:
--   - writes: app/api/track/route.js, app/api/create-paguelofacil-payment/route.js,
--             app/api/paguelofacil-webhook/route.js
--   - reads:  app/api/admin/analytics/route.js (admin-session gated)

create table if not exists public.analytics_events (
  id           bigint generated always as identity primary key,
  event_type   text not null check (event_type in ('pageview', 'click', 'funnel')),
  event_name   text not null,
  path         text,
  locale       text,
  session_id   text not null,
  visitor_id   text not null,
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  device_type  text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx      on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_type_name_idx on public.analytics_events (event_type, event_name);
create index if not exists analytics_events_session_idx         on public.analytics_events (session_id);
create index if not exists analytics_events_metadata_gin_idx    on public.analytics_events using gin (metadata);

alter table public.analytics_events enable row level security;
-- No policies created on purpose: anon/authenticated have zero access.
