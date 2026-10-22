import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The Newsletter tab isn't rendered for the coronado role.
async function requireAdmin(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid, role } = await verifyAdminSessionToken(token);
  return valid && role === 'admin';
}

export async function GET(request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching newsletter subscribers:', error);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    return NextResponse.json({ subscribers: data || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/newsletter:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting newsletter subscriber:', error);
      return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in DELETE /api/admin/newsletter:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
