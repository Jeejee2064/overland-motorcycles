import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken, safeCompare } from '@/lib/admin-auth';

export async function POST(request) {
  const { password } = await request.json();

  let role = null;
  if (password && process.env.PSWD_ADMIN && safeCompare(password, process.env.PSWD_ADMIN)) role = 'admin';
  else if (password && process.env.PSWD_CORONADO && safeCompare(password, process.env.PSWD_CORONADO)) role = 'coronado';

  if (!role) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const { token, maxAge } = await createAdminSessionToken(role);

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return res;
}
