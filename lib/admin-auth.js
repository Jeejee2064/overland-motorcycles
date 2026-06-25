export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.PSWD_ADMIN),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(expiresAt)));
  return { token: `${expiresAt}.${toHex(signature)}`, maxAge: SESSION_DURATION_MS / 1000 };
}

export async function verifyAdminSessionToken(token) {
  if (!token) return false;

  const [expiresAt, signatureHex] = token.split('.');
  if (!expiresAt || !signatureHex) return false;
  if (Date.now() > Number(expiresAt)) return false;

  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(expiresAt));
  return toHex(signature) === signatureHex;
}
