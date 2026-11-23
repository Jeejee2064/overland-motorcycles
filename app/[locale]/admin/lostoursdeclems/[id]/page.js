import { notFound } from 'next/navigation';
import { PLACES } from '@/lib/tours';
import { getAdminRow, getTourFromState, isBuiltinTour, resolveState, TOURS_MESSAGES } from '@/lib/tours-content';
import { requireToursAccess } from '@/lib/tours-admin-page';
import TourEditor from '@/components/admin/tours/TourEditor';

export const metadata = { title: 'Modifier un tour', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function TourEditPage({ params }) {
  const { locale, id } = await params;
  await requireToursAccess(locale);

  let row = null;
  try {
    row = await getAdminRow(id);
  } catch (err) {
    console.error('tour_content unreachable:', err?.message ?? err);
  }

  const initial = resolveState(id, row?.draft ?? row?.published);
  const tour = getTourFromState(id, initial);
  if (!tour) notFound();

  const fr = TOURS_MESSAGES.fr;
  const builtin = isBuiltinTour(id);
  const info = {
    builtin,
    days: tour.days,
    nights: tour.nights,
    slug: tour.slug,
    stops: (tour.stops ?? []).map((stop) => fr.places[stop]?.name ?? stop),
    defaultPrice: builtin ? tour.price : null,
    places: Object.keys(PLACES).map((key) => ({ id: key, name: fr.places[key]?.name ?? key })),
    // Once a tour is online its page address no longer changes.
    slugLocked: !builtin && Object.keys(row?.published ?? {}).length > 0,
    neverPublished: !builtin && Object.keys(row?.published ?? {}).length === 0,
  };

  return <TourEditor tourId={id} info={info} initial={initial} initialHasDraft={!!row?.draft} />;
}
