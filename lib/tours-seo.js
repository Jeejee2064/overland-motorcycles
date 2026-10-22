// Shared SEO helpers for the tours hub and tour pages.

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://overland-motorcycles.com';

const OG_LOCALES = { en: 'en_US', es: 'es_ES', pt: 'pt_BR', fr: 'fr_FR' };
// pt has no dedicated tours copy (it renders the English text), so it is not advertised in hreflang.
const HREFLANG = { en: 'en-US', es: 'es-ES', fr: 'fr-FR' };

export const localizedPath = (locale, path) => (locale === 'en' ? path : `/${locale}${path}`);

export const ogLocale = (locale) => OG_LOCALES[locale] || 'en_US';

// pt pages carry English copy, so they canonicalise to the English URL.
export function buildAlternates(locale, path) {
  const canonicalLocale = HREFLANG[locale] ? locale : 'en';
  const languages = Object.fromEntries(
    Object.entries(HREFLANG).map(([loc, tag]) => [tag, localizedPath(loc, path)])
  );
  languages['x-default'] = localizedPath('en', path);
  return { canonical: `${BASE_URL}${localizedPath(canonicalLocale, path)}`, languages };
}

export function buildMetadata({ locale, path, title, description, keywords, siteName, image }) {
  const alternates = buildAlternates(locale, path);
  return {
    title: { absolute: title },
    description,
    keywords,
    metadataBase: new URL(BASE_URL),
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName,
      locale: ogLocale(locale),
      type: 'website',
      images: [{ url: image || '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image || '/og-image.png'],
    },
    robots: { index: true, follow: true },
  };
}

export const faqSchema = (faq) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${BASE_URL}${item.path}`,
  })),
});
