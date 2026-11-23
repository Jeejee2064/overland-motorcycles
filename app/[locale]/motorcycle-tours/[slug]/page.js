import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import TourDetailView from '@/components/tours/TourDetailView';
import { TOURS, getTourBySlug, withOverrides } from '@/lib/tours';
import { TOUR_IMAGES } from '@/lib/tour-images';
import { normalizePhoto } from '@/lib/tours-shared';
import { buildMetadata } from '@/lib/tours-seo';
import { routing } from '@/routing';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    TOURS.map((tour) => ({ locale, slug: tour.slug }))
  );
}

// Price, main photo and gallery can be edited from /admin/lostoursdeclems (Tours.overrides).
async function loadTour(locale, slug) {
  const t = await getTranslations({ locale, namespace: 'Tours' });
  // Built-in tours first, then the ones created from /admin/lostoursdeclems.
  const base = getTourBySlug(slug) ?? t.raw('custom').find((tour) => tour.slug === slug);
  if (!base || t.raw('hidden').includes(base.id)) return null;
  const overrides = t.raw('overrides');
  const tour = withOverrides(base, overrides);
  const gallery = overrides?.[tour.id]?.gallery ?? (TOUR_IMAGES[tour.id] ?? []).map(normalizePhoto);
  return { t, tour, gallery };
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const loaded = await loadTour(locale, slug);
  if (!loaded) return {};
  const { t, tour } = loaded;

  return buildMetadata({
    locale,
    path: `/motorcycle-tours/${tour.slug}`,
    title: t(`items.${tour.id}.metaTitle`),
    description: t(`items.${tour.id}.metaDescription`),
    keywords: t(`items.${tour.id}.keywords`),
    siteName: t('meta.siteName'),
    image: tour.image,
  });
}

export default async function TourPage({ params }) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const loaded = await loadTour(locale, slug);
  if (!loaded) notFound();

  return <TourDetailView locale={locale} {...loaded} />;
}
