import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { routing } from '@/routing';
import BookingDetailPage from '@/components/admin/booking/BookingDetailPage';

export const metadata = {
  title: 'Booking',
  robots: { index: false, follow: false },
};

export default async function AdminBookingPage({ params }) {
  const { locale, id } = await params;

  // The proxy already guards /admin/ok/*; this is the defence-in-depth check
  // (and gives us the role for coronado-scoped admins).
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid, role } = await verifyAdminSessionToken(token);

  if (!valid) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    redirect(`${prefix}/admin`);
  }

  return <BookingDetailPage bookingId={id} role={role} />;
}
