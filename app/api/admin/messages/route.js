import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The Messages tab isn't rendered for the coronado role, same restriction as
// /api/admin/messages/[id].
async function requireAdmin(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid, role } = await verifyAdminSessionToken(token);
  return valid && role === 'admin';
}

// List contact-form messages for the admin dashboard. Replaces the direct
// anon-key getAllMessages()/getUnreadMessages() calls that used to run from
// the browser.
export async function GET(request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional: e.g. 'unread'

    let query = supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/messages:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
