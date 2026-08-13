import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from './lib/admin-auth';

const intlMiddleware = createMiddleware(routing);

const ADMIN_OK_PATTERN = /^\/(?:(en|es|pt|fr)\/)?admin\/ok(\/.*)?$/;

export default async function proxy(request) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(ADMIN_OK_PATTERN);

  if (match) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid: isValid } = await verifyAdminSessionToken(token);

    if (!isValid) {
      const localePrefix = match[1] ? `/${match[1]}` : '';
      return NextResponse.redirect(new URL(`${localePrefix}/admin`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
matcher: ['/', '/(fr|es|pt)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
