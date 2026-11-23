-- Editable content of the guided motorcycle tours (copy, price, photos).
-- Defaults still live in messages/tours.*.json, lib/tours.js and lib/tour-images.js;
-- a row here overrides them. Edited from /admin/lostoursdeclems.
--
-- RLS enabled with zero policies (same as the other tables): all access goes
-- through service-role API routes (app/api/admin/tours/*) and server code.
--
--   published : what the public site shows (complete snapshot, or '{}' = defaults)
--   draft     : pending edits shown in the admin preview, NULL = nothing pending

create table if not exists public.tour_content (
  tour_id      text primary key,
  published    jsonb not null default '{}'::jsonb,
  draft        jsonb,
  published_at timestamptz,
  updated_at   timestamptz not null default now()
);

alter table public.tour_content enable row level security;

-- Public bucket for the tour photos. Uploads use signed upload URLs issued by
-- app/api/admin/tours/upload, so no storage policy is needed for writing.
insert into storage.buckets (id, name, public)
values ('tour-photos', 'tour-photos', true)
on conflict (id) do nothing;
