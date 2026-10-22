import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public newsletter signup (footer + home page). RLS denies anon access to
// newsletter_subscribers, so the insert goes through the service role here.
export async function POST(request) {
  try {
    const { email, locale, source } = await request.json();
    const clean = String(email || '').trim().toLowerCase();

    if (!clean || clean.length > 254 || !EMAIL_RE.test(clean)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { error } = await supabase.from('newsletter_subscribers').insert([{
      email: clean,
      locale: locale ? String(locale).slice(0, 10) : null,
      source: source ? String(source).slice(0, 30) : null,
    }]);

    // 23505 = unique violation: already subscribed, treat as success.
    if (error && error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    if (error) {
      console.error('Error saving newsletter subscriber:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in POST /api/newsletter:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
