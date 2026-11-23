import { TOURS } from '@/lib/tours';
import { getAdminRows, getTourFromState, resolveState } from '@/lib/tours-content';
import { requireToursAccess } from '@/lib/tours-admin-page';
import ToursDashboard from '@/components/admin/tours/ToursDashboard';

export const metadata = { title: 'Les tours', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ToursAdminPage({ params }) {
  const { locale } = await params;
  await requireToursAccess(locale);

  let rows = {};
  let setupError = false;
  try {
    rows = await getAdminRows();
  } catch (err) {
    console.error('tour_content unreachable:', err?.message ?? err);
    setupError = true;
  }

  const builtinIds = TOURS.map((t) => t.id);
  const customIds = Object.keys(rows)
    .filter((id) => !builtinIds.includes(id))
    .sort((a, b) => (rows[a].draft?.structure ?? rows[a].published?.structure)?.order - (rows[b].draft?.structure ?? rows[b].published?.structure)?.order);

  const tours = [...builtinIds, ...customIds].map((id) => {
    const row = rows[id];
    const state = resolveState(id, row?.draft ?? row?.published);
    const tour = getTourFromState(id, state);
    if (!tour) return null;
    return {
      id,
      custom: !builtinIds.includes(id),
      days: tour.days,
      nights: tour.nights,
      name: state.copy.fr.name,
      route: state.copy.fr.route,
      image: state.image,
      price: state.price,
      photos: state.gallery.length,
      hasDraft: !!row?.draft,
      neverPublished: !builtinIds.includes(id) && Object.keys(row?.published ?? {}).length === 0,
      publishedAt: row?.published_at ?? null,
    };
  }).filter(Boolean);

  return <ToursDashboard tours={tours} setupError={setupError} />;
}
