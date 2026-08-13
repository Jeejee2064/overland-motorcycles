import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public contact-form submission. Replaces the direct anon-key createMessage()
// insert that used to run from the browser — now that RLS denies anon access
// to `messages` entirely (read AND write), the insert has to go through the
// service role here instead.
export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ name, email, phone: phone || null, message }])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: data });
  } catch (err) {
    console.error('Error in POST /api/messages:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
