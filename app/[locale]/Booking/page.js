'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Users, MapPin, Mail, Phone, User, MessageSquare, Bike } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import ButtonPrimary from '../../../components/ButtonPrimary';

const BookingPage = () => {
  const t = useTranslations('BookingPage');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    riders: '1',
    bikeQuantity: '1',
    tripType: '',
    experience: '',
    specialRequests: '',
    hearAboutUs: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const bookingData = {
      ...formData,
      startDate,
      endDate
    };
    console.log('Booking submitted:', bookingData);
    // Handle form submission - send to backend/email
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
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-background flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/moto1.webp"
            alt="Book Your Adventure"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </motion.div>
      </section>

      {/* Booking Form Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('formTitle')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('formSubtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <form onSubmit={handleSubmit} className="bg-gray-50 p-8 md:p-12 rounded-3xl border border-gray-200">
              
              {/* Personal Information */}
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={24} className="text-yellow-400" />
                  {t('personalInfo')}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
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
                      placeholder="+507 6805-1100"
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

              {/* Trip Details */}
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar size={24} className="text-yellow-400" />
                  {t('tripDetails')}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('startDate')} *
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      placeholderText="Select start date"
                      required
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('endDate')} *
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate || new Date()}
                      dateFormat="MMMM d, yyyy"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      placeholderText="Select end date"
                      required
                    />
                  </div>

                  {/* Duration Display */}
                  {calculateDays() > 0 && (
                    <div className="md:col-span-2">
                      <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 text-center">
                        <p className="text-lg font-semibold text-gray-900">
                          {t('duration')}: <span className="text-yellow-600">{calculateDays()} {calculateDays() === 1 ? t('day') : t('days')}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('riders')} *
                    </label>
                    <select
                      name="riders"
                      value={formData.riders}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                    >
                      <option value="1">1 Rider</option>
                      <option value="2">2 Riders</option>
                    </select>
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                    >
                      <option value="1">1 Motorcycle</option>
                      <option value="2">2 Motorcycles</option>
                      <option value="3">3 Motorcycles</option>
                      <option value="4">4+ Motorcycles</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare size={24} className="text-yellow-400" />
                  {t('additionalInfo')}
                </h3>
                
                <div className="space-y-6">
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
                      <option value="google">Google Search</option>
                      <option value="social">Social Media</option>
                      <option value="friend">Friend/Family</option>
                      <option value="blog">Travel Blog</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  {t('submitBooking')}
                </button>
                <p className="mt-4 text-sm text-gray-600">
                  {t('submitNote')}
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 bg-background">
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