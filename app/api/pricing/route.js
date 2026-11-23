import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public: prices are shown on the Pricing and Booking pages anyway.
export async function GET() {
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('model, days, price')
    .order('days', { ascending: true });

  if (error) {
    console.error('Error reading pricing_tiers:', error);
    return NextResponse.json({ error: 'Failed to load pricing' }, { status: 500 });
  }

  const pricing = {};
  for (const row of data) {
    (pricing[row.model] ??= []).push({ days: row.days, price: Number(row.price) });
  }
  return NextResponse.json({ pricing }, { headers: { 'Cache-Control': 'no-store' } });
}
