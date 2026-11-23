import { NextResponse } from 'next/server';
import { canEditTours } from '@/lib/admin-auth';
import { PHOTOS_BUCKET } from '@/lib/tours-shared';
import { serviceClient } from '@/lib/tours-content';

export const runtime = 'nodejs';

// Hands out a one-time signed URL: the browser uploads the (already resized) photo straight to
// Supabase Storage, so the file never goes through the 4.5 MB serverless body limit.
export async function POST(request) {
  try {
    const allowed = await canEditTours((name) => request.cookies.get(name)?.value);
    if (!allowed) return NextResponse.json({ error: 'Session expirée : reconnectez-vous.' }, { status: 401 });

    const { tourId, ext } = await request.json();
    if (!/^[a-z0-9-]{1,80}$/.test(String(tourId))) return NextResponse.json({ error: 'Tour inconnu.' }, { status: 404 });
    const extension = ['webp', 'jpg'].includes(ext) ? ext : 'webp';

    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${tourId}/${Date.now()}-${rand}.${extension}`;
    const { data, error } = await serviceClient().storage.from(PHOTOS_BUCKET).createSignedUploadUrl(path);
    if (error) {
      console.error('createSignedUploadUrl failed:', error);
      return NextResponse.json({ error: 'Le stockage des photos n’est pas prêt (voir supabase/tour_content.sql).' }, { status: 500 });
    }
    return NextResponse.json({ path, token: data.token });
  } catch (err) {
    console.error('Error in POST /api/admin/tours/upload:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
