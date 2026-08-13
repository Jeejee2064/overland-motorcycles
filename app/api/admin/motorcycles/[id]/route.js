import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_FIELDS = ['is_available', 'location', 'km'];

// Fleet management is only exposed to the full admin role (MotorcyclesTab isn't
// rendered at all for the coronado role), so this route requires role === 'admin'.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing motorcycle ID' }, { status: 400 });
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid, role } = await verifyAdminSessionToken(token);
    if (!valid || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if ('location' in updates && !['Panama City', 'Playa Coronado'].includes(updates.location)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('motorcycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating motorcycle:', error);
      return NextResponse.json({ error: 'Failed to update motorcycle' }, { status: 500 });
    }

    return NextResponse.json({ motorcycle: data });
  } catch (err) {
    console.error('Error in PATCH /api/admin/motorcycles/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
