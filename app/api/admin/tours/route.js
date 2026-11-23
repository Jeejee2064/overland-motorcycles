import { NextResponse } from 'next/server';
import { canEditTours } from '@/lib/admin-auth';
import { TOURS } from '@/lib/tours';
import { COPY_LOCALES, slugify } from '@/lib/tours-shared';
import { getAdminRows, getDefaultState, serviceClient } from '@/lib/tours-content';

export const runtime = 'nodejs';

// Creates a new tour as a draft: name + duration, everything else is filled in the editor.
export async function POST(request) {
  try {
    const allowed = await canEditTours((name) => request.cookies.get(name)?.value);
    if (!allowed) return NextResponse.json({ error: 'Session expirée : reconnectez-vous.' }, { status: 401 });

    const body = await request.json();
    const name = String(body.name ?? '').replace(/[{}]/g, '').trim().slice(0, 120);
    const days = Number(body.days);
    if (!name) return NextResponse.json({ error: 'Donnez un nom au tour.' }, { status: 400 });
    if (!Number.isInteger(days) || days < 1 || days > 60) {
      return NextResponse.json({ error: 'La durée doit être de 1 à 60 jours.' }, { status: 400 });
    }

    const rows = await getAdminRows();
    const taken = new Set(TOURS.map((t) => t.slug));
    for (const row of Object.values(rows)) {
      for (const s of [row.published?.structure?.slug, row.draft?.structure?.slug]) if (s) taken.add(s);
    }
    const base = slugify(name) || 'tour';
    let slug = base;
    for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;

    const id = `custom-${Math.random().toString(36).slice(2, 8)}`;
    const draft = getDefaultState(id);
    for (const l of COPY_LOCALES) draft.copy[l].name = name;
    draft.structure = { days, slug, stops: [], order: Date.now() };

    const { error } = await serviceClient()
      .from('tour_content')
      .insert({ tour_id: id, published: {}, draft, updated_at: new Date().toISOString() });
    if (error) throw error;
    return NextResponse.json({ id });
  } catch (err) {
    console.error('Error in POST /api/admin/tours:', err);
    const missingTable = err?.code === 'PGRST205' || /tour_content/.test(err?.message ?? '');
    return NextResponse.json(
      { error: missingTable ? 'La table tour_content n’existe pas encore (voir supabase/tour_content.sql).' : 'Erreur serveur.' },
      { status: 500 }
    );
  }
}
