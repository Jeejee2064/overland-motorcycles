import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, TOURS_SESSION_COOKIE } from '@/lib/admin-auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  for (const name of [ADMIN_SESSION_COOKIE, TOURS_SESSION_COOKIE]) {
    res.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
  return res;
}
