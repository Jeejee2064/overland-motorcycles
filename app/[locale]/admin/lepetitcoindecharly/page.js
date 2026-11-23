import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { routing } from '@/routing';
import PricingEditor from '@/components/admin/pricing/PricingEditor';

export const metadata = {
  title: 'Pricing',
  robots: { index: false, follow: false },
};

export default async function HiddenPricingPage({ params }) {
  const { locale } = await params;

  // The proxy already guards this path; this is the defence-in-depth check.
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid, role } = await verifyAdminSessionToken(token);

  if (!valid || role !== 'admin') {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    redirect(`${prefix}/admin`);
  }

  return <PricingEditor />;
}
