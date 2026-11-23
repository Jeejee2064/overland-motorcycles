import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { canEditTours } from '@/lib/admin-auth';
import { TOURS } from '@/lib/tours';
import {
  CONTENT_TAG, getAdminRow, getAdminRows, isBuiltinTour, resolveState, sanitizeState, serviceClient,
} from '@/lib/tours-content';

export const runtime = 'nodejs';

const refreshPublicSite = () => {
  // Public pages are statically generated: refresh them so the change is visible right away.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
};

// One endpoint, four actions on a tour:
//   save    → store the edits as the draft (visible in the admin preview only)
//   publish → make the edits public (saves the content first if one is sent)
//   discard → throw the draft away and go back to what is online
//   delete  → remove a tour created from the admin (built-in tours cannot be deleted)
export async function PUT(request, { params }) {
  try {
    const allowed = await canEditTours((name) => request.cookies.get(name)?.value);
    if (!allowed) return NextResponse.json({ error: 'Session expirée : reconnectez-vous.' }, { status: 401 });

    const { id } = await params;
    const builtin = isBuiltinTour(id);
    const row = await getAdminRow(id);
    if (!builtin && !row) return NextResponse.json({ error: 'Tour inconnu.' }, { status: 404 });

    const { action, content } = await request.json();
    const supabase = serviceClient();
    const now = new Date().toISOString();

    if (action === 'delete') {
      if (builtin) return NextResponse.json({ error: 'Les tours d’origine ne peuvent pas être supprimés.' }, { status: 400 });
      const { error } = await supabase.from('tour_content').delete().eq('tour_id', id);
      if (error) throw error;
      refreshPublicSite();
      return NextResponse.json({ success: true });
    }

    if (action === 'discard') {
      if (!builtin && Object.keys(row.published ?? {}).length === 0) {
        return NextResponse.json({ error: 'Ce tour n’est pas encore en ligne : supprimez-le plutôt.' }, { status: 400 });
      }
      const { error } = await supabase
        .from('tour_content')
        .upsert({ tour_id: id, published: row?.published ?? {}, draft: null, updated_at: now }, { onConflict: 'tour_id' });
      if (error) throw error;
      return NextResponse.json({ success: true, state: resolveState(id, row?.published) });
    }

    if (action !== 'save' && action !== 'publish') return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });

    let state;
    try {
      state = sanitizeState(content ?? row?.draft, { custom: !builtin });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    if (!builtin) {
      // Once online, the page address stays put (links and Google rankings depend on it).
      const liveSlug = row.published?.structure?.slug;
      if (liveSlug) state.structure.slug = liveSlug;

      const taken = new Set(TOURS.map((t) => t.slug));
      for (const [otherId, other] of Object.entries(await getAdminRows())) {
        if (otherId === id) continue;
        for (const s of [other.published?.structure?.slug, other.draft?.structure?.slug]) if (s) taken.add(s);
      }
      if (taken.has(state.structure.slug)) {
        return NextResponse.json({ error: 'Cette adresse de page est déjà utilisée par un autre tour.' }, { status: 400 });
      }
    }

    if (action === 'save') {
      const { error } = await supabase
        .from('tour_content')
        .upsert({ tour_id: id, published: row?.published ?? {}, draft: state, updated_at: now }, { onConflict: 'tour_id' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('tour_content')
      .upsert({ tour_id: id, published: state, draft: null, published_at: now, updated_at: now }, { onConflict: 'tour_id' });
    if (error) throw error;
    refreshPublicSite();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in PUT /api/admin/tours/[id]:', err);
    const missingTable = err?.code === 'PGRST205' || /tour_content/.test(err?.message ?? '');
    return NextResponse.json(
      { error: missingTable ? 'La table tour_content n’existe pas encore (voir supabase/tour_content.sql).' : 'Erreur serveur.' },
      { status: 500 }
    );
  }
}
