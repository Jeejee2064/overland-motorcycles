import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin-auth';

export async function POST(request) {
  const { password } = await request.json();

  if (!password || password !== process.env.PSWD_ADMIN) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const { token, maxAge } = await createAdminSessionToken();

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
