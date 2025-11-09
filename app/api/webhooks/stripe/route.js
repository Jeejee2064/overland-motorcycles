import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Vérifier que toutes les variables existent
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is missing');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Créer un client Supabase avec la clé SERVICE_ROLE pour le webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  // Gérer les différents types d'événements
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutCompleted(session);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSucceeded(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailed(failedPayment);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session) {
  const bookingId = session.metadata.bookingId;
  const paymentIntentId = session.payment_intent;

  console.log('Checkout completed for booking:', bookingId);

  try {
    // Import the function (add at top of file)
    const { markBookingAsPaid } = await import('@/lib/supabase/bookings');
    
    // Mark booking as paid and assign motorcycles
    await markBookingAsPaid(bookingId, paymentIntentId, session.id);

    console.log('Booking confirmed and motorcycles assigned:', bookingId);

    // Ici, vous pouvez ajouter l'envoi d'email de confirmation
    // await sendConfirmationEmail(session.customer_email, bookingId);

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  console.log('Payment succeeded for booking:', bookingId);
}

async function handlePaymentFailed(paymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  console.log('Payment failed for booking:', bookingId);

  try {
    await supabase
      .from('bookings')
      .update({
        payment_status: 'payment_failed',
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
  } catch (error) {
    console.error('Error updating failed payment:', error);
  }
}

// Important: désactiver le parsing du body pour les webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};