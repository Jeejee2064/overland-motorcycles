// Shared (client + server) constants and pure helpers for editable tour content.
//
// A tour's editable content is one JSON object ("state"):
//   { price, image, gallery: [{ id, src, alt, credit, url }],
//     copy: { en|es|fr|pt: { name, tagline, route, intro, metaTitle, metaDescription,
//                            keywords, highlights: [str], days: [{title, body}], faq: [{q, a}] } } }
// Defaults come from messages/tours.*.json, lib/tours.js and lib/tour-images.js.
// A row in tour_content overrides them (see supabase/tour_content.sql).

export const COPY_LOCALES = ['fr', 'en', 'es', 'pt'];
export const LOCALE_LABELS = { fr: 'Français', en: 'English', es: 'Español', pt: 'Português' };

export const TEXT_FIELDS = ['name', 'tagline', 'route', 'intro', 'metaTitle', 'metaDescription', 'keywords'];

export const PHOTOS_BUCKET = 'tour-photos';

const LEGACY_CREDIT = (p) => `Photo: ${p.author} (${p.license}) via Wikimedia Commons`;

// Turns the legacy { src, alt, author, license, url } shape (and the new one) into the editor shape.
export function normalizePhoto(p, index = 0) {
  return {
    id: p.id || p.src || `photo-${index}`,
    src: p.src,
    alt: p.alt || '',
    credit: p.credit ?? (p.author ? LEGACY_CREDIT(p) : ''),
    url: p.url || '',
  };
}

export const mediaUrl = (src, baseUrl) => (/^https?:\/\//.test(src) ? src : `${baseUrl}${src}`);

export const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
