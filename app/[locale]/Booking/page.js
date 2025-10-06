'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Calendar, User, MessageSquare, Bike, MapPin, Check, AlertCircle } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';

const BookingPage = () => {
  const t = useTranslations('BookingPage');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validationError, setValidationError] = useState('');
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

  const validateDates = (start, end) => {
    if (!start || !end) {
      setValidationError(t('validationSelectDates'));
      return false;
    }

    const startDateTime = new Date(start).getTime();
    const endDateTime = new Date(end).getTime();
    const now = new Date().getTime();
    const minAdvanceTime = now + (48 * 60 * 60 * 1000); // 48 hours from now

    // Check if booking is at least 48 hours in advance
    if (startDateTime < minAdvanceTime) {
      setValidationError(t('validationMinimum48h'));
      return false;
    }

    // Check minimum 2 days rental
    const days = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60 * 24));
    if (days < 2) {
      setValidationError(t('validationMinimum2Days'));
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate) {
      validateDates(date, endDate);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (startDate) {
      validateDates(startDate, date);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateDates(startDate, endDate)) {
      alert(validationError);
      return;
    }

    const bookingData = {
      ...formData,
      startDate,
      endDate,
      totalPrice: totalRentalPrice,
      downPayment,
      deposit: totalDeposit
    };
    console.log('Booking submitted:', bookingData);
    alert(t('submitNote'));
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
      const start = new Date(startDate);
      const end = new Date(endDate);
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

  // Calculate minimum date (48 hours from now)
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    return minDate.toISOString().split('T')[0];
  };

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
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
                
                {/* Step 1: Trip Dates */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-bold">1</div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                      {t('tripDetails')}
                    </h3>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t('startDate')} *
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        min={getMinDate()}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        {t('endDate')} *
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        min={startDate || getMinDate()}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      />
                    </div>

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
                      {/* Trip Summary */}
                      <div className="bg-gray-700/50 rounded-xl p-4">
                        <div className="flex justify-between text-sm text-gray-300 mb-1">
                          <span>{calculateDays()} {calculateDays() === 1 ? t('day') : t('days')}</span>
                          <span>{numBikes} {numBikes === 1 ? t('bike') : t('bikes')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-600">
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
                      className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                      {t('submitBooking')}
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