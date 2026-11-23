import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canEditTours } from '@/lib/admin-auth';
import { routing } from '@/routing';

export const localePrefix = (locale) => (locale === routing.defaultLocale ? '' : `/${locale}`);

// The proxy already guards /admin/lostoursdeclems; this is the defence-in-depth check.
export async function requireToursAccess(locale) {
  const store = await cookies();
  if (!(await canEditTours((name) => store.get(name)?.value))) redirect(`${localePrefix(locale)}/admin`);
}
