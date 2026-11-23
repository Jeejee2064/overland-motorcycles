import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { PRICING_MODELS } from '@/lib/pricing';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Replaces the full price grid of one model. Full admin role only.
export async function PUT(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid, role } = await verifyAdminSessionToken(token);
    if (!valid || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model, tiers } = await request.json();
    if (!PRICING_MODELS.includes(model)) {
      return NextResponse.json({ error: 'Moto inconnue.' }, { status: 400 });
    }
    if (!Array.isArray(tiers) || tiers.length === 0 || tiers.length > 60) {
      return NextResponse.json({ error: 'Grille de prix invalide.' }, { status: 400 });
    }

    const seen = new Set();
    const rows = [];
    for (const t of tiers) {
      const days = Number(t.days);
      const price = Math.round(Number(t.price) * 100) / 100;
      if (!Number.isInteger(days) || days < 1 || days > 365 || !Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: 'Durée ou prix invalide.' }, { status: 400 });
      }
      if (seen.has(days)) {
        return NextResponse.json({ error: `Durée en double : ${days} jours.` }, { status: 400 });
      }
      seen.add(days);
      rows.push({ model, days, price, updated_at: new Date().toISOString() });
    }

    const { error: upsertError } = await supabase
      .from('pricing_tiers')
      .upsert(rows, { onConflict: 'model,days' });
    if (upsertError) {
      console.error('Error upserting pricing:', upsertError);
      return NextResponse.json({ error: 'Échec de l’enregistrement.' }, { status: 500 });
    }

    // Remove tiers the admin deleted.
    const { error: deleteError } = await supabase
      .from('pricing_tiers')
      .delete()
      .eq('model', model)
      .not('days', 'in', `(${[...seen].join(',')})`);
    if (deleteError) {
      console.error('Error pruning pricing:', deleteError);
      return NextResponse.json({ error: 'Enregistré, mais la suppression des lignes retirées a échoué.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in PUT /api/admin/pricing:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
