import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { PRICING_MODELS } from '@/lib/pricing';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const bad = (error) => NextResponse.json({ error }, { status: 400 });

// Replaces the full list of seasonal periods. Full admin role only.
export async function PUT(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid, role } = await verifyAdminSessionToken(token);
    if (!valid || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { periods } = await request.json();
    if (!Array.isArray(periods) || periods.length > 100) return bad('Périodes invalides.');

    const rows = [];
    for (const p of periods) {
      if (!UUID.test(p.id)) return bad('Identifiant de période invalide.');
      const name = String(p.name ?? '').trim().slice(0, 80);
      if (!name) return bad('Chaque période doit avoir un nom.');
      if (!DATE.test(p.start_date) || !DATE.test(p.end_date) || p.end_date < p.start_date) {
        return bad(`Dates invalides pour « ${name} ».`);
      }
      const tiers = {};
      for (const model of PRICING_MODELS) {
        const grid = p.tiers?.[model];
        if (grid == null) continue;
        if (!Array.isArray(grid) || grid.length === 0 || grid.length > 60) return bad(`Grille invalide pour « ${name} ».`);
        const seen = new Set();
        tiers[model] = grid.map((t) => {
          const days = Number(t.days);
          const price = Math.round(Number(t.price) * 100) / 100;
          if (!Number.isInteger(days) || days < 1 || days > 365 || !Number.isFinite(price) || price < 0 || seen.has(days)) {
            throw new Error(`Durée ou prix invalide pour « ${name} ».`);
          }
          seen.add(days);
          return { days, price };
        }).sort((a, b) => a.days - b.days);
      }
      rows.push({
        id: p.id, name, start_date: p.start_date, end_date: p.end_date, tiers,
        updated_at: new Date().toISOString(),
      });
    }

    const sorted = [...rows].sort((a, b) => a.start_date.localeCompare(b.start_date));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start_date <= sorted[i - 1].end_date) {
        return bad(`« ${sorted[i - 1].name} » et « ${sorted[i].name} » se chevauchent.`);
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('pricing_periods').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.error('Error upserting pricing_periods:', error);
        return NextResponse.json({ error: 'Échec de l’enregistrement.' }, { status: 500 });
      }
    }

    const del = supabase.from('pricing_periods').delete();
    const { error: deleteError } = rows.length > 0
      ? await del.not('id', 'in', `(${rows.map((r) => r.id).join(',')})`)
      : await del.not('id', 'is', null);
    if (deleteError) {
      console.error('Error pruning pricing_periods:', deleteError);
      return NextResponse.json({ error: 'Enregistré, mais la suppression des périodes retirées a échoué.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes('invalide')) return bad(err.message);
    console.error('Error in PUT /api/admin/pricing/periods:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
