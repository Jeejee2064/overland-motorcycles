import { notFound } from 'next/navigation';
import { createTranslator } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import TourDetailView from '@/components/tours/TourDetailView';
import { withOverrides } from '@/lib/tours';
import { getAdminRow, getTourFromState, resolveState, toursMessagesWith } from '@/lib/tours-content';
import { requireToursAccess } from '@/lib/tours-admin-page';
import { routing } from '@/routing';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// The real public tour page, rendered from the unpublished draft. Shown inside the preview iframe.
export default async function TourRenderPage({ params }) {
  const { locale, id } = await params;
  await requireToursAccess(locale);
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const row = await getAdminRow(id);
  const state = resolveState(id, row?.draft ?? row?.published);
  const base = getTourFromState(id, state);
  if (!base) notFound();
  const toursLocale = ['en', 'es', 'fr', 'pt'].includes(locale) ? locale : 'en';
  const messages = toursMessagesWith(toursLocale, id, state);
  const t = createTranslator({ locale, messages: { Tours: messages }, namespace: 'Tours' });

  const tour = withOverrides(base, messages.overrides);
  return <TourDetailView t={t} locale={locale} tour={tour} gallery={state.gallery} />;
}
