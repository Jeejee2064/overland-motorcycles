import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Environment variable checks
if (!process.env.STRIPE_SECRET_KEY) throw new Error('❌ STRIPE_SECRET_KEY missing');
if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('❌ STRIPE_WEBHOOK_SECRET missing');
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL missing');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY missing');

// Initialize clients
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`✅ Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('❌ Error handling event:', err);
    return NextResponse.json({ error: 'Event handling failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// --- Event Handlers ---

async function handleCheckoutCompleted(session) {
  console.log('💬 Handling checkout.session.completed');

  const bookingId = session.metadata?.bookingId;
  const paymentIntentId = session.payment_intent;

  if (!bookingId) {
    console.warn('⚠️ No bookingId in session.metadata');
    return;
  }

  console.log(`✅ Checkout completed for booking: ${bookingId}`);

  try {
    const { markBookingAsPaid } = await import('@/lib/supabase/bookings');
    await markBookingAsPaid(bookingId, paymentIntentId, session.id);
    console.log(`🎉 Booking ${bookingId} marked as paid.`);
  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId) {
    console.warn('⚠️ Payment succeeded but no bookingId in metadata');
    return;
  }
  console.log(`✅ Payment succeeded for booking ${bookingId}`);
}

async function handlePaymentFailed(paymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId) {
    console.warn('⚠️ Payment failed but no bookingId in metadata');
    return;
  }

  console.log(`❌ Payment failed for booking ${bookingId}`);
  try {
    await supabase
      .from('bookings')
      .update({
        payment_status: 'payment_failed',
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    console.log(`🔄 Booking ${bookingId} set to payment_failed.`);
  } catch (error) {
    console.error('Error updating failed payment:', error);
  }
}

export const config = { api: { bodyParser: false } };
