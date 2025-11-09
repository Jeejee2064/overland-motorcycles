import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY in environment variables');
      return NextResponse.json(
        { error: 'Stripe key not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON in request body');
    });

    const {
      bookingId,
      firstName,
      lastName,
      email,
      downPayment,
      totalRentalPrice,
      totalDeposit,
      startDate,
      endDate,
      bikeQuantity,
      calculatedDays,
    } = body;

    console.log('Creating Stripe session for', email);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Motorcycle Rental - Down Payment',
              description: `${bikeQuantity} motorcycle(s) for ${calculatedDays} days (${startDate} to ${endDate})`,
            },
            unit_amount: Math.round(downPayment * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/Booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/Booking?canceled=true`,
      customer_email: email,
      metadata: {
        bookingId,
        firstName,
        lastName,
        paymentType: 'down_payment',
      },
      payment_intent_data: {
        metadata: {
          bookingId,
          paymentType: 'down_payment',
        },
      },
    });

    console.log('Stripe session created successfully:', session.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
