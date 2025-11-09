'use client'

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Mail, Download } from 'lucide-react';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    if (sessionId) {
      // Ici, vous pouvez récupérer les détails de la réservation
      // depuis votre API ou Supabase
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400"></div>
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
                Payment Successful!
              </h1>
              <p className="text-lg text-gray-600">
                Your motorcycle rental booking has been confirmed
              </p>
            </div>

            {/* Booking Details */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                What's Next?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail size={24} className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Check Your Email</h3>
                    <p className="text-sm text-gray-600">
                      We've sent a confirmation email with all the details of your booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar size={24} className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Prepare for Your Trip</h3>
                    <p className="text-sm text-gray-600">
                      Make sure to bring your valid driver's license and the remaining payment at pickup.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Download size={24} className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Booking Reference</h3>
                    <p className="text-sm text-gray-600">
                      Session ID: <span className="font-mono text-xs">{sessionId}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Payment Summary
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Down Payment (Paid)</span>
                  <span className="font-semibold text-green-600">✓ Paid</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining Payment</span>
                  <span className="font-semibold text-gray-900">Due at pickup</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-semibold text-gray-900">Due at pickup (refundable)</span>
                </div>
              </div>
            </div>

            {/* Important Reminders */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-blue-900 mb-2">
                ⚠️ Important Reminders
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Bring a valid motorcycle driver's license</li>
                <li>• Arrive at least 30 minutes before your scheduled pickup time</li>
                <li>• Prepare the remaining payment and security deposit in cash or card</li>
                <li>• Contact us at overlandmotorcycles@gmail.com if you have any questions</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-center rounded-xl hover:shadow-lg transition-all"
              >
                Back to Home
              </Link>
              <Link 
                href="/contact"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-semibold text-center rounded-xl hover:bg-gray-300 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}