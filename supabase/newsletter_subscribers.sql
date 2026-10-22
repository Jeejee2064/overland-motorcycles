-- Newsletter signups from the footer and home page.
--
-- RLS is enabled with zero policies, same as the rest of this project's
-- RLS-hardened tables. All access goes through service-role API routes:
--   - writes: app/api/newsletter/route.js
--   - reads/deletes: app/api/admin/newsletter/route.js (admin-session gated)

create table if not exists public.newsletter_subscribers (
  id         bigint generated always as identity primary key,
  email      text not null,
  locale     text,
  source     text,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;
