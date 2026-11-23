import { notFound } from 'next/navigation';
import { getAdminRow, getTourFromState, resolveState } from '@/lib/tours-content';
import { requireToursAccess } from '@/lib/tours-admin-page';
import TourPreview from '@/components/admin/tours/TourPreview';

export const metadata = { title: 'Aperçu', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function TourPreviewPage({ params, searchParams }) {
  const { locale, id } = await params;
  await requireToursAccess(locale);

  const row = await getAdminRow(id);
  const state = resolveState(id, row?.draft ?? row?.published);
  const tour = getTourFromState(id, state);
  if (!tour) notFound();
  const { lang } = await searchParams;

  return (
    <TourPreview
      tourId={id}
      slug={tour.slug}
      name={state.copy.fr.name}
      hasDraft={!!row?.draft}
      initialLang={['fr', 'en', 'es', 'pt'].includes(lang) ? lang : 'fr'}
    />
  );
}
