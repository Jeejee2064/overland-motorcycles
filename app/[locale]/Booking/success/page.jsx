'use client'

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Mail, Download, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navigation from '../../../../components/Navigation';
import Footer from '../../../../components/Footer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BookingSuccessPage() {
  const t = useTranslations('SuccessPage');
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentPending, setPaymentPending] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        console.log('Fetching booking:', bookingId);

        // Poll for booking confirmation (webhook might take a few seconds)
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

          if (fetchError) {
            throw new Error('Booking not found');
          }

          // Check if webhook has been received
          if (booking.webhook_received && booking.status === 'confirmed') {
            console.log('Booking confirmed:', booking);
            setBookingDetails({ booking });
            setLoading(false);
            return;
          }

          // If payment is still pending, wait and retry
          if (booking.pending_verification) {
            console.log(`Waiting for payment confirmation... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            attempts++;
          } else {
            // Payment failed or other status
            if (booking.status === 'failed') {
              throw new Error('Payment was not approved');
            }
            break;
          }
        }

        // If we've exhausted attempts, show pending message
        setPaymentPending(true);
        const { data: pendingBooking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
          
        setBookingDetails({ booking: pendingBooking });
        setLoading(false);

      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">{t('loading.confirming')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('loading.wait')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <section className="py-16 mt-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <AlertCircle size={56} className="text-red-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {t('error.title')}
                </h1>
                <p className="text-gray-600 mb-4">{error}</p>
                <p className="text-sm text-gray-500">
                  {t('error.message')}{' '}
                  <a href="mailto:overlandmotorcycles@gmail.com" className="text-yellow-600 underline">
                    overlandmotorcycles@gmail.com
                  </a>
                  {' '}{t('error.sessionId')}: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{bookingId}</code>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/"
                  className="flex-1 px-6 py-3 bg-yellow-400 text-gray-900 font-bold text-center rounded-xl hover:shadow-lg transition-all"
                >
                  {t('actions.backHome')}
                </Link>
                <Link 
                  href="/contact"
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-semibold text-center rounded-xl hover:bg-gray-300 transition-all"
                >
                  {t('actions.contactUs')}
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Payment pending state
  if (paymentPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <section className="py-16 mt-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <Loader2 size={56} className="animate-spin text-yellow-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Payment Processing
                </h1>
                <p className="text-gray-600 mb-4">
                  Your payment is being processed. This usually takes a few seconds.
                </p>
                <p className="text-sm text-gray-500">
                  You will receive a confirmation email once the payment is confirmed.
                  If you don't receive it within 5 minutes, please contact us.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:shadow-lg transition-all"
                  >
                    Check Status Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <section className="py-16 mt-16">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            {/* Success Icon */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2 
                }}
                className="inline-block"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={56} className="text-green-500" />
                </div>
              </motion.div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('success.title')}
              </h1>
              <p className="text-lg text-gray-600">
                {t('success.subtitle')}
              </p>
            </div>

            {/* Booking Details */}
            {bookingDetails?.booking && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {t('details.title')}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('details.bookingId')}:</span>
                    <span className="font-mono text-gray-900 text-xs">{bookingDetails.booking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('details.name')}:</span>
                    <span className="text-gray-900">{bookingDetails.booking.first_name} {bookingDetails.booking.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('details.email')}:</span>
                    <span className="text-gray-900">{bookingDetails.booking.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('details.rentalPeriod')}:</span>
                    <span className="text-gray-900">
                      {bookingDetails.booking.start_date} {t('details.to')} {bookingDetails.booking.end_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('details.motorcycles')}:</span>
                    <span className="text-gray-900">{bookingDetails.booking.bike_quantity} {t('details.bikes')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">{t('details.downPayment')}:</span>
                    <span className="text-green-600 font-bold">${bookingDetails.booking.down_payment} ({t('details.paid')} ✓)</span>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('next.title')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail size={24} className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('next.email.title')}</h3>
                    <p className="text-sm text-gray-600">
                      {t('next.email.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar size={24} className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('next.prepare.title')}</h3>
                    <p className="text-sm text-gray-600">
                      {t('next.prepare.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Download size={24} className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('next.reference.title')}</h3>
                    <p className="text-sm text-gray-600">
                      {t('next.reference.sessionId')}: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{bookingId}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {t('payment.title')}
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('payment.downPayment')}</span>
                  <span className="font-semibold text-green-600">✓ {t('payment.paid')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('payment.remaining')}</span>
                  <span className="font-semibold text-gray-900">{t('payment.duePickup')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('payment.deposit')}</span>
                  <span className="font-semibold text-gray-900">{t('payment.depositNote')}</span>
                </div>
              </div>
            </div>

            {/* Important Reminders */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-blue-900 mb-2">
                ⚠️ {t('reminders.title')}
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• {t('reminders.license')}</li>
                <li>• {t('reminders.arrive')}</li>
                <li>• {t('reminders.payment')}</li>
                <li>• {t('reminders.contact')}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-center rounded-xl hover:shadow-lg transition-all"
              >
                {t('actions.backHome')}
              </Link>
              <Link 
                href="/contact"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-semibold text-center rounded-xl hover:bg-gray-300 transition-all"
              >
                {t('actions.contactUs')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}