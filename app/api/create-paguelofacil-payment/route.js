import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Human-readable label for emails / payment description
const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      downPayment,
      totalRentalPrice,
      totalDeposit,
      startDate,
      endDate,
      bikeQuantity,
      motorcycleModel,   // ← new field from booking page
      calculatedDays,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !downPayment || !startDate || !endDate || !bikeQuantity || !motorcycleModel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate model value
    if (!MODEL_LABELS[motorcycleModel]) {
      return NextResponse.json(
        { error: `Invalid motorcycle model: ${motorcycleModel}` },
        { status: 400 }
      );
    }

    const modelLabel  = MODEL_LABELS[motorcycleModel];
    const uniqueToken = crypto.randomBytes(16).toString('hex');

    // 1️⃣ Create pending booking in database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          first_name:        firstName,
          last_name:         lastName,
          email:             email,
          phone:             phone || '',
          country:           country || '',
          start_date:        startDate,
          end_date:          endDate,
          bike_quantity:     parseInt(bikeQuantity),
          motorcycle_model:  motorcycleModel,   // ← saved to DB
          down_payment:      parseFloat(downPayment),
          total_price:       parseFloat(totalRentalPrice),
          deposit:           parseFloat(totalDeposit),
          status:            'pending',
          payment_status:    'pending',
          paid:              false,
          paguelofacil_token:    uniqueToken,
          pending_verification:  true,
          webhook_received:      false,
        },
      ])
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Database error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // 2️⃣ Encode RETURN_URL in hexadecimal
    const returnUrlPlain = `${process.env.NEXT_PUBLIC_BASE_URL}/Booking/success?booking_id=${booking.id}`;
    const returnUrlHex   = Buffer.from(returnUrlPlain).toString('hex');

    // 3️⃣ Custom fields
    const customFields = [
      { id: 'bookingId',      nameOrLabel: 'Booking ID',      value: booking.id },
      { id: 'token',          nameOrLabel: 'Security Token',  value: uniqueToken },
      { id: 'motorcycleModel',nameOrLabel: 'Motorcycle Model',value: motorcycleModel },
        { id: 'paymentType',   nameOrLabel: 'Payment Type',   value: 'INITIAL' }, // ← ajout

    ];
    const customFieldsHex = Buffer.from(JSON.stringify(customFields)).toString('hex');

    // 4️⃣ Build PaguéloFácil payload
    const bikeQty = parseInt(bikeQuantity);
    const pagueloFacilData = {
      CCLW:       process.env.PAGUELOFACIL_CCLW,
      CMTN:       parseFloat(downPayment).toFixed(2),
      CDSC:       `Motorcycle Rental - ${firstName} ${lastName} - ${bikeQty} × ${modelLabel} for ${calculatedDays} days`,
      RETURN_URL: returnUrlHex,
      PF_CF:      customFieldsHex,
      PARM_1:     booking.id,
      PARM_2:     uniqueToken,
      PARM_3:     bikeQuantity.toString(),
      PARM_4:     startDate,
      PARM_5:     endDate,
      PARM_6:     email,
      EXPIRES_IN: 3600,
    };

    const linkDeamonUrl = process.env.NODE_ENV === 'production'
      ? 'https://secure.paguelofacil.com/LinkDeamon.cfm'
      : 'https://sandbox.paguelofacil.com/LinkDeamon.cfm';

    // 5️⃣ POST to PaguéloFácil
    const formBody = Object.keys(pagueloFacilData)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(pagueloFacilData[key])}`)
      .join('&');

    console.log('📤 Requesting payment link…');
    console.log('Endpoint:', linkDeamonUrl);
    console.log('Model:', motorcycleModel, '|', 'Amount:', pagueloFacilData.CMTN);

    const response     = await fetch(linkDeamonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
      body: formBody,
    });
    const responseData = await response.json();

    console.log('📥 PaguéloFácil response:', responseData);

    // 6️⃣ Handle failure — clean up orphaned booking
    if (!responseData.success || !responseData.data?.url) {
      console.error('❌ PaguéloFácil error:', responseData);
      await supabase.from('bookings').delete().eq('id', booking.id);
      return NextResponse.json(
        { error: responseData.message || 'Failed to create payment link', details: responseData },
        { status: 400 }
      );
    }

    // 7️⃣ Store PaguéloFácil link code
    await supabase
      .from('bookings')
      .update({ paguelofacil_cclw: responseData.data.code })
      .eq('id', booking.id);

    console.log('✅ Payment link created:', responseData.data.url);

    return NextResponse.json({
      url:         responseData.data.url,
      bookingId:   booking.id,
      paymentCode: responseData.data.code,
    });

  } catch (error) {
    console.error('❌ Payment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}