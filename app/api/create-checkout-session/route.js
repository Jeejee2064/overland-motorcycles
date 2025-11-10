import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
        firstName,
        lastName,
        email,
        phone,
        country,
        startDate,
        endDate,
        bikeQuantity,
        downPayment,
        totalRentalPrice,
        totalDeposit,
        calculatedDays,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
