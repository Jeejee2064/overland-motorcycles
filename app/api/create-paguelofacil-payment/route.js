import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      calculatedDays,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !downPayment || !startDate || !endDate || !bikeQuantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a unique token for this transaction
    const uniqueToken = crypto.randomBytes(16).toString('hex');

    // 1️⃣ Create pending booking in database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || '',
          country: country || '',
          start_date: startDate,
          end_date: endDate,
          bike_quantity: parseInt(bikeQuantity),
          down_payment: parseFloat(downPayment),
          total_price: parseFloat(totalRentalPrice),
          deposit: parseFloat(totalDeposit),
          status: 'pending',
          payment_status: 'pending',
          paid: false,
          paguelofacil_token: uniqueToken,
          pending_verification: true,
          webhook_received: false,
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
    const returnUrlHex = Buffer.from(returnUrlPlain).toString('hex');

    // 3️⃣ Prepare custom fields (PF_CF) - Optional metadata
    const customFields = [
      {
        id: "bookingId",
        nameOrLabel: "Booking ID",
        value: booking.id
      },
      {
        id: "token",
        nameOrLabel: "Security Token",
        value: uniqueToken
      }
    ];
    const customFieldsHex = Buffer.from(JSON.stringify(customFields)).toString('hex');

    // 4️⃣ Prepare request to PagueloFacil LinkDeamon
    const pagueloFacilData = {
      CCLW: process.env.PAGUELOFACIL_CCLW,
      CMTN: downPayment.toFixed(2),
      CDSC: `Motorcycle Rental - ${firstName} ${lastName} - ${bikeQuantity} bike${bikeQuantity > 1 ? 's' : ''} for ${calculatedDays} days`,
      RETURN_URL: returnUrlHex,
      PF_CF: customFieldsHex,
      PARM_1: booking.id, // Booking ID
      PARM_2: uniqueToken, // Security token
      PARM_3: bikeQuantity.toString(),
      PARM_4: startDate,
      PARM_5: endDate,
      PARM_6: email,
      EXPIRES_IN: 3600, // 1 hour expiration
    };

    // 5️⃣ Determine the endpoint (sandbox or production)
    const linkDeamonUrl = 'https://secure.paguelofacil.com/LinkDeamon.cfm'


    // 6️⃣ Make POST request to PagueloFacil
    const formBody = Object.keys(pagueloFacilData)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(pagueloFacilData[key])}`)
      .join('&');

    console.log('📤 Requesting payment link from PagueloFacil...');
    console.log('Endpoint:', linkDeamonUrl);
    console.log('CCLW:', process.env.PAGUELOFACIL_CCLW);
    console.log('Amount:', downPayment.toFixed(2));

    const response = await fetch(linkDeamonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
      },
      body: formBody,
    });

    const responseData = await response.json();

    console.log('📥 PagueloFacil response:', responseData);

    // 7️⃣ Check if request was successful
    if (!responseData.success || !responseData.data?.url) {
      console.error('❌ PagueloFacil error:', responseData);
      
      // Delete the pending booking if payment link creation failed
      await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      return NextResponse.json(
        { 
          error: responseData.message || 'Failed to create payment link',
          details: responseData 
        },
        { status: 400 }
      );
    }

    // 8️⃣ Update booking with PagueloFacil code
    await supabase
      .from('bookings')
      .update({
        paguelofacil_cclw: responseData.data.code, // Store the link code
      })
      .eq('id', booking.id);

    console.log('✅ Payment link created successfully');
    console.log('Payment URL:', responseData.data.url);
    console.log('Payment Code:', responseData.data.code);

    return NextResponse.json({
      url: responseData.data.url,
      bookingId: booking.id,
      paymentCode: responseData.data.code,
    });

  } catch (error) {
    console.error('❌ PagueloFacil payment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}