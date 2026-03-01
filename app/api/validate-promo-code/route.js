// app/api/validate-promo-code/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    const { code, totalBeforeDiscount } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'No code provided.' });
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('active', true)
      .ilike('code', code.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code.' });
    }

    let discountAmount = 0;
    if (data.discount_type === 'percentage') {
      discountAmount = parseFloat(((totalBeforeDiscount * data.discount_value) / 100).toFixed(2));
    } else {
      discountAmount = parseFloat(Math.min(data.discount_value, totalBeforeDiscount).toFixed(2));
    }

    return NextResponse.json({
      valid: true,
      discountType:  data.discount_type,
      discountValue: data.discount_value,
      discountAmount,
      codeId:        data.id,
    });
  } catch (err) {
    console.error('[validate-promo-code]', err);
    return NextResponse.json({ valid: false, error: 'Server error. Please try again.' });
  }
}