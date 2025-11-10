'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Calendar, User, MessageSquare, Bike, MapPin, Check, AlertCircle } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import BookingCalendar from '../../../components/BookingCalendar';
import { loadStripe } from '@stripe/stripe-js';

import { createBooking, checkBikesAvailable } from '@/lib/supabase/bookings';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const BookingPage = () => {
  const t = useTranslations('BookingPage');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    riders: '1',
    bikeQuantity: '1',
    specialRequests: '',
    hearAboutUs: ''
  });

  const pricingData = [
    { days: 1, price: 280 },
    { days: 2, price: 280 },
    { days: 3, price: 400 },
    { days: 4, price: 530 },
    { days: 5, price: 660 },
    { days: 6, price: 790 },
    { days: 7, price: 899 },
    { days: 8, price: 1010 },
    { days: 9, price: 1175 },
    { days: 10, price: 1230 },
    { days: 11, price: 1290 },
    { days: 12, price: 1350 },
    { days: 13, price: 1380 },
    { days: 14, price: 1420 },
    { days: 21, price: 1800 }
  ];


  const isFormValid = () => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.country.trim() !== '' &&
      startDate !== '' &&
      endDate !== ''
    );
  };

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse date string as local date
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
      12, 0, 0 // Use noon to avoid DST issues
    );
  };

  // Format date for display (e.g., "Jan 21, 2025")
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const validateDates = (start, end) => {
    if (!start || !end) {
      setValidationError(t('validationSelectDates'));
      return false;
    }

    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const minAdvanceDate = new Date(now);
    minAdvanceDate.setDate(minAdvanceDate.getDate() + 2); // 48 hours = 2 days

    // Check if booking is at least 48 hours in advance
    if (startDate < minAdvanceDate) {
      setValidationError(t('validationMinimum48h'));
      return false;
    }

    // Check minimum 2 days rental
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (days < 2) {
      setValidationError(t('validationMinimum2Days'));
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleDateRangeChange = (range) => {
    const start = formatLocalDate(range.startDate);
    const end = formatLocalDate(range.endDate);

    console.log('Date range selected:', { start, end });

    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      validateDates(start, end);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      alert('Please fill all required fields and select a valid date range.');
      return;
    }

    if (!validateDates(startDate, endDate)) {
      alert(validationError);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const available = await checkBikesAvailable(startDate, endDate);
 

      const needed = parseInt(formData.bikeQuantity);

      if (available < needed) {
        alert(`Sorry, only ${available} motorcycle(s) available for the selected dates.`);
        setIsSubmitting(false);
        return;
      }

      // --- Create Stripe session only ---
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          downPayment,
          totalRentalPrice,
          totalDeposit,
          startDate,
          endDate,
          bikeQuantity: parseInt(formData.bikeQuantity),
          calculatedDays: calculateDays(),
        }),
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (!url) throw new Error('Missing Checkout URL from server.');

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Booking error:', error);
      alert(error.message || 'There was an error processing your booking.');
      setIsSubmitting(false);
    }
  };


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Calculate number of days
  const calculateDays = () => {
    if (startDate && endDate) {
      const start = parseLocalDate(startDate);
      const end = parseLocalDate(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  // Calculate price based on days
  const calculatePrice = () => {
    const days = calculateDays();
    if (days === 0) return 0;

    const pricing = pricingData.find(p => p.days === days);
    if (pricing) return pricing.price;

    const sortedPricing = [...pricingData].sort((a, b) => a.days - b.days);
    for (let i = 0; i < sortedPricing.length - 1; i++) {
      if (days > sortedPricing[i].days && days < sortedPricing[i + 1].days) {
        return sortedPricing[i + 1].price;
      }
    }

    if (days > 21) {
      const basePrice = 1800;
      const baseDays = 21;
      return Math.round((basePrice / baseDays) * days);
    }

    return 0;
  };

  const rentalPrice = calculatePrice();
  const numBikes = parseInt(formData.bikeQuantity) || 1;
  const totalRentalPrice = rentalPrice * numBikes;
  const depositPerBike = 1000;
  const totalDeposit = depositPerBike * numBikes;
  const downPayment = totalRentalPrice / 2;
  const remainingPayment = totalRentalPrice / 2;

  const showQuote = totalRentalPrice > 0 && !validationError;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />

      {/* Main Content */}
      <section className="py-16 bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {t('formTitle')}
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              {t('formSubtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Column - Date Selection */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="bg-white p-0 md:p-8 rounded-2xl md:shadow-lg md:border md:border-gray-200">

                {/* Step 1: Trip Dates */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-bold">1</div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                      {t('tripDetails')}
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <BookingCalendar
                      selectedRange={{
                        startDate: startDate ? parseLocalDate(startDate) : new Date(),
                        endDate: endDate ? parseLocalDate(endDate) : new Date(),
                        key: 'selection'
                      }}
                      onChange={handleDateRangeChange}
                    />

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t('bikeQuantity')} *
                      </label>
                      <select
                        name="bikeQuantity"
                        value={formData.bikeQuantity}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      >
                        <option value="1">{t('bikesOption1')}</option>
                        <option value="2">{t('bikesOption2')}</option>
                        <option value="3">{t('bikesOption3')}</option>
                        <option value="4">{t('bikesOption4')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Validation Error */}
                  {validationError && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700 font-semibold">{validationError}</p>
                    </div>
                  )}

                  {/* Duration Display */}
                  {calculateDays() > 0 && !validationError && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-center text-gray-900 font-semibold">
                        {t('duration')}: <span className="text-yellow-600">{calculateDays()} {calculateDays() === 1 ? t('day') : t('days')}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-8">
                  {/* Step 2: Personal Info */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-bold">2</div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                        {t('personalInfo')}
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('firstName')} *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                          placeholder="John"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('lastName')} *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                          placeholder="Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('email')} *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('phone')} *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                          placeholder="+1 234 567 8900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('country')} *
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-bold">3</div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                        {t('additionalInfo')}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('specialRequests')}
                        </label>
                        <textarea
                          name="specialRequests"
                          value={formData.specialRequests}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all resize-none"
                          placeholder={t('specialRequestsPlaceholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {t('hearAboutUs')}
                        </label>
                        <select
                          name="hearAboutUs"
                          value={formData.hearAboutUs}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                        >
                          <option value="">{t('selectOption')}</option>
                          <option value="google">{t('hearAboutOption1')}</option>
                          <option value="social">{t('hearAboutOption2')}</option>
                          <option value="friend">{t('hearAboutOption3')}</option>
                          <option value="blog">{t('hearAboutOption4')}</option>
                          <option value="other">{t('hearAboutOption5')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Price Quote (Sticky) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="lg:sticky lg:top-6">
                {showQuote ? (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-2xl border border-yellow-400/30">
                    <h4 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
                      {t('quoteTitle')}
                    </h4>

                    <div className="space-y-4">
                      {/* Date Range Display */}
                      <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4">
                        <div className="text-center">
                          <p className="text-xs text-yellow-400 font-semibold mb-2">RENTAL PERIOD</p>
                          <div className="flex items-center justify-center gap-2 text-white">
                            <span className="font-bold">{formatDisplayDate(startDate)}</span>
                            <span className="text-yellow-400">→</span>
                            <span className="font-bold">{formatDisplayDate(endDate)}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'} • {numBikes} {numBikes === 1 ? 'motorcycle' : 'motorcycles'}
                          </p>
                        </div>
                      </div>

                      {/* Trip Summary */}
                      <div className="bg-gray-700/50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">{t('rentalLabel')}</span>
                          <span className="text-xl font-bold text-white">${totalRentalPrice}</span>
                        </div>
                      </div>

                      {/* Down Payment */}
                      <div className="bg-green-500/10 border-2 border-green-500 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-green-400 font-bold">{t('downPaymentLabel')}</span>
                          <span className="text-2xl font-bold text-green-400">${downPayment}</span>
                        </div>
                        <p className="text-xs text-green-300">{t('downPaymentNote')}</p>
                      </div>

                      {/* At Pickup */}
                      <div className="bg-blue-500/10 border border-blue-400 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-blue-300 font-bold">{t('atPickupLabel')}</span>
                          <span className="text-xl font-bold text-blue-300">${remainingPayment + totalDeposit}</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-400">
                          <div className="flex justify-between">
                            <span>{t('remainingRentalLabel')}</span>
                            <span className="text-gray-300">${remainingPayment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('refundableDepositLabel')}</span>
                            <span className="text-gray-300">${totalDeposit}</span>
                          </div>
                        </div>
                      </div>

                      {/* What's Included */}
                      <div className="bg-gray-700/30 rounded-xl p-4">
                        <p className="text-xs text-gray-300 mb-2 font-semibold">{t('includesNote')}</p>
                        <div className="space-y-1 text-xs text-gray-400">
                          <div className="flex items-start gap-2">
                            <Check size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span>{t('includedItem1')}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span>{t('includedItem2')}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span>{t('includedItem3')}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span>{t('includedItem4')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !isFormValid()}
                      className={`w-full mt-6 px-6 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ${isSubmitting || !isFormValid() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        `Pay Down Payment ($${downPayment})`
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      {t('submitNote')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 p-8 rounded-2xl text-center">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-bold text-gray-600 mb-2">{t('selectDatesPrompt')}</h4>
                    <p className="text-sm text-gray-500">{t('selectDatesDescription')}</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: t('infoTitle1'),
                desc: t('infoDesc1')
              },
              {
                icon: Bike,
                title: t('infoTitle2'),
                desc: t('infoDesc2')
              },
              {
                icon: MapPin,
                title: t('infoTitle3'),
                desc: t('infoDesc3')
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <item.icon size={32} className="text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookingPage;