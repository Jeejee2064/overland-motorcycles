import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { TOURS, PLACES } from '@/lib/tours';
import { TOUR_IMAGES } from '@/lib/tour-images';
import { COPY_LOCALES, TEXT_FIELDS, SLUG_PATTERN, normalizePhoto } from '@/lib/tours-shared';
import toursEn from '@/messages/tours.en.json';
import toursEs from '@/messages/tours.es.json';
import toursFr from '@/messages/tours.fr.json';
import toursPt from '@/messages/tours.pt.json';

export const TOURS_MESSAGES = { en: toursEn, es: toursEs, fr: toursFr, pt: toursPt };
export const CONTENT_TAG = 'tour-content';

export const serviceClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const clone = (x) => JSON.parse(JSON.stringify(x));

// ---------- defaults (what the site shows when nothing was edited) ----------

export const isBuiltinTour = (tourId) => TOURS.some((t) => t.id === tourId);

const blankCopy = () => ({
  ...Object.fromEntries(TEXT_FIELDS.map((f) => [f, ''])),
  highlights: [],
  days: [],
  faq: [],
});

export function getDefaultState(tourId) {
  const tour = TOURS.find((t) => t.id === tourId);
  // Tours created from the admin start empty (see POST /api/admin/tours).
  if (!tour) {
    return {
      price: 0,
      image: '/hero.webp',
      gallery: [],
      copy: Object.fromEntries(COPY_LOCALES.map((l) => [l, blankCopy()])),
    };
  }
  const copy = {};
  for (const locale of COPY_LOCALES) {
    const item = TOURS_MESSAGES[locale].items[tourId];
    copy[locale] = {
      ...Object.fromEntries(TEXT_FIELDS.map((f) => [f, item[f] ?? ''])),
      highlights: clone(item.highlights ?? []),
      days: clone(item.days ?? []),
      faq: clone(item.faq ?? []),
    };
  }
  return {
    price: tour.price,
    image: tour.image,
    gallery: (TOUR_IMAGES[tourId] ?? []).map(normalizePhoto),
    copy,
  };
}

// Overlay a stored (possibly partial) state on the defaults → always a complete state.
export function resolveState(tourId, stored) {
  const base = getDefaultState(tourId);
  if (!stored || typeof stored !== 'object') return base;
  const copy = {};
  for (const locale of COPY_LOCALES) copy[locale] = { ...base.copy[locale], ...(stored.copy?.[locale] ?? {}) };
  return {
    price: stored.price ?? base.price,
    image: stored.image || base.image,
    gallery: Array.isArray(stored.gallery) ? stored.gallery.map(normalizePhoto) : base.gallery,
    copy,
    ...(stored.structure ? { structure: stored.structure } : {}),
    ...(stored.hidden ? { hidden: true } : {}),
  };
}

// Structure (duration, slug, map stops) of any tour: built-in ones are in lib/tours.js,
// tours created from the admin carry it in their state.
export function getTourFromState(tourId, state) {
  const builtin = TOURS.find((t) => t.id === tourId);
  if (builtin) return builtin;
  const st = state?.structure;
  if (!st) return null;
  return {
    id: tourId,
    slug: st.slug,
    days: st.days,
    nights: Math.max(0, st.days - 1),
    stops: st.stops ?? [],
    price: state.price,
    image: state.image,
  };
}

// Messages of the "Tours" namespace for one locale, with a state applied on top of one tour.
export function toursMessagesWith(locale, tourId, state) {
  const messages = clone(TOURS_MESSAGES[locale] ?? TOURS_MESSAGES.en);
  const copy = state.copy[locale] ?? {};
  messages.items[tourId] = { ...messages.items[tourId], ...copy };
  messages.overrides = { [tourId]: { price: state.price, image: state.image, gallery: state.gallery } };
  messages.custom = [];
  messages.hidden = [];
  return messages;
}

// ---------- published content (public site) ----------

const loadPublished = unstable_cache(
  async () => {
    const { data, error } = await serviceClient().from('tour_content').select('tour_id, published');
    if (error) throw error;
    return Object.fromEntries(data.map((row) => [row.tour_id, row.published]));
  },
  ['tour-content-published'],
  { tags: [CONTENT_TAG], revalidate: 300 }
);

// Never throws: if the table is missing or unreachable the site falls back to the built-in content.
export async function getPublishedRows() {
  try {
    return await loadPublished();
  } catch (err) {
    console.error('tour_content unreachable, using built-in tour content:', err?.message ?? err);
    return {};
  }
}

// Applies published edits onto the "Tours" messages of a locale (used by i18n/request.js).
export async function applyPublishedContent(locale, toursMessages) {
  const rows = await getPublishedRows();
  const messages = { ...toursMessages, items: { ...toursMessages.items }, overrides: {}, custom: [], hidden: [] };
  for (const [tourId, stored] of Object.entries(rows)) {
    if (!stored || Object.keys(stored).length === 0) continue;
    const builtin = isBuiltinTour(tourId);
    if (!builtin && !stored.structure) continue;
    const state = resolveState(tourId, stored);
    messages.items[tourId] = { ...messages.items[tourId], ...state.copy[locale] };
    messages.overrides[tourId] = { price: state.price, image: state.image, gallery: state.gallery };
    if (state.hidden) messages.hidden.push(tourId);
    if (!builtin) {
      const tour = getTourFromState(tourId, state);
      messages.custom.push({ ...tour, order: state.structure.order ?? 0 });
    }
  }
  messages.custom.sort((a, b) => a.order - b.order);
  return messages;
}

// ---------- admin: rows with draft ----------

export async function getAdminRow(tourId) {
  const { data, error } = await serviceClient()
    .from('tour_content')
    .select('tour_id, published, draft, published_at, updated_at')
    .eq('tour_id', tourId)
    .maybeSingle();
  // Table not created yet: behave as "nothing edited" (saving will report the missing table).
  if (error && error.code !== 'PGRST205') throw error;
  return data ?? null;
}

export async function getAdminRows() {
  const { data, error } = await serviceClient()
    .from('tour_content')
    .select('tour_id, published, draft, published_at, updated_at');
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.tour_id, row]));
}

// ---------- validation of what the admin sends ----------

// Braces are stripped: next-intl would read them as ICU placeholders and break the page.
const str = (v, max) => (typeof v === 'string' ? v.replace(/[{}]/g, '').trim().slice(0, max) : '');
const isMediaSrc = (v) => typeof v === 'string' && v.length <= 600 && (v.startsWith('/') || /^https:\/\//.test(v));

export function sanitizeState(input, { custom = false } = {}) {
  if (!input || typeof input !== 'object') throw new Error('Contenu invalide.');

  const price = Math.round(Number(input.price) * 100) / 100;
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) throw new Error('Prix invalide.');
  if (!isMediaSrc(input.image)) throw new Error('Photo principale invalide.');
  if (!Array.isArray(input.gallery) || input.gallery.length > 80) throw new Error('Galerie invalide.');

  const gallery = input.gallery.map((p, i) => {
    if (!isMediaSrc(p?.src)) throw new Error('Photo invalide dans la galerie.');
    return {
      id: str(p.id, 120) || `photo-${i}`,
      src: p.src,
      alt: str(p.alt, 200),
      credit: str(p.credit, 200),
      url: /^https?:\/\//.test(p.url ?? '') ? str(p.url, 600) : '',
    };
  });

  let structure;
  if (custom) {
    const st = input.structure;
    const days = Number(st?.days);
    if (!Number.isInteger(days) || days < 1 || days > 60) throw new Error('Durée invalide (de 1 à 60 jours).');
    const slug = String(st?.slug ?? '').trim().toLowerCase();
    if (!SLUG_PATTERN.test(slug) || slug.length > 100) throw new Error('Adresse de la page invalide (lettres, chiffres et tirets).');
    const stops = Array.isArray(st?.stops) ? st.stops.filter((id) => PLACES[id]).slice(0, 30) : [];
    structure = { days, slug, stops, order: Number(st?.order) || Date.now() };
  }

  const copy = {};
  for (const locale of COPY_LOCALES) {
    const c = input.copy?.[locale];
    if (!c) throw new Error(`Textes manquants (${locale}).`);
    copy[locale] = {
      name: str(c.name, 120),
      tagline: str(c.tagline, 300),
      route: str(c.route, 400),
      intro: str(c.intro, 4000),
      metaTitle: str(c.metaTitle, 200),
      metaDescription: str(c.metaDescription, 400),
      keywords: str(c.keywords, 600),
      highlights: (c.highlights ?? []).map((h) => str(h, 300)).filter(Boolean).slice(0, 30),
      days: (c.days ?? [])
        .map((d) => ({ title: str(d?.title, 200), body: str(d?.body, 4000) }))
        .filter((d) => d.title || d.body)
        .slice(0, 40),
      faq: (c.faq ?? [])
        .map((f) => ({ q: str(f?.q, 300), a: str(f?.a, 4000) }))
        .filter((f) => f.q && f.a)
        .slice(0, 30),
    };
    if (!copy[locale].name) throw new Error(`Le nom du tour est obligatoire (${locale}).`);
  }
  return { price, image: input.image, gallery, copy, ...(structure ? { structure } : {}) };
}
