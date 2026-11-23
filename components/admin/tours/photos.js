import { supabase } from '@/lib/supabase/client';
import { PHOTOS_BUCKET } from '@/lib/tours-shared';

const MAX_SIDE = 2000;

// Phone photos are 5–10 MB: shrink to 2000 px and re-encode before uploading, so the site stays fast.
async function shrink(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`« ${file.name} » n’a pas pu être lue. Utilisez une photo JPG, PNG ou WebP.`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob('image/webp', 0.82);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  return { blob: await toBlob('image/jpeg', 0.85), ext: 'jpg' };
}

// Returns the public URL of the uploaded photo.
export async function uploadTourPhoto(tourId, file) {
  if (!file.type.startsWith('image/')) throw new Error(`« ${file.name} » n’est pas une image.`);
  const { blob, ext } = await shrink(file);

  const res = await fetch('/api/admin/tours/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tourId, ext }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Envoi impossible.');

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).uploadToSignedUrl(data.path, data.token, blob, {
    contentType: blob.type,
  });
  if (error) throw new Error('Envoi de la photo impossible. Réessayez.');
  return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(data.path).data.publicUrl;
}
