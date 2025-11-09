import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
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
      calculatedDays
    } = body;

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Motorcycle Rental - Down Payment`,
              description: `${bikeQuantity} motorcycle(s) for ${calculatedDays} days (${startDate} to ${endDate})`,
              images: ['https://your-domain.com/motorcycle-image.jpg'], // Optionnel
            },
            unit_amount: Math.round(downPayment * 100), // Stripe utilise les centimes
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
        downPayment: downPayment.toString(),
        totalRentalPrice: totalRentalPrice.toString(),
        totalDeposit: totalDeposit.toString(),
        startDate,
        endDate,
        bikeQuantity: bikeQuantity.toString(),
        paymentType: 'down_payment'
      },
      payment_intent_data: {
        metadata: {
          bookingId,
          paymentType: 'down_payment'
        }
      }
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}