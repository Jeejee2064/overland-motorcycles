'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPin, Clock, Mail, Phone, Send, Instagram, Facebook } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import ButtonPrimary from '../../../components/ButtonPrimary';

const ContactPage = () => {
  const t = useTranslations('ContactPage');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />


      {/* Contact Information & Form */}
      <section className="py-20 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-8">
                  {t('getInTouch')}
                </h2>
            
              </div>

              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} className="text-gray-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('location')}</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    Local 1 - Edificio Antigua Domingo{'\n'}
                    Plaza Santa Ana{'\n'}
                    Panama City, Panama
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={24} className="text-gray-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('hours')}</h3>
                  <div className="space-y-2 text-gray-600">
                    <div>
                      <p className="font-semibold">{t('weekdays')}</p>
                      <p>{t('weekdayHours')}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('weekend')}</p>
                      <p>{t('weekendHours')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail size={24} className="text-gray-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                  <a href="mailto:overlandmotorcycles@gmail.com" className="text-gray-600 hover:text-yellow-400 transition-colors">
                    overlandmotorcycles@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={24} className="text-gray-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
                  <a href="tel:+50768051100" className="text-gray-600 hover:text-yellow-400 transition-colors">
                    +507 6805-1100
                  </a>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('followUs')}</h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/overlandmotorcycles/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors"
                  >
                    <Instagram size={24} className="text-gray-900" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61573828461831"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors"
                  >
                    <Facebook size={24} className="text-gray-900" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  {t('sendMessage')}
                </h3>

                <form
                  action="https://formspree.io/f/xblzydjy"
                  method="POST"
                  className="space-y-6"
                >
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('phone')}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                      placeholder="+507 6805-1100"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('message')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all resize-none"
                      placeholder="Tell us about your adventure plans..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Send size={20} />
                    {t('submit')}
                  </button>
                </form>

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl overflow-hidden shadow-2xl"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.0928199152077!2d-79.54171968483294!3d8.95402210000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8faca9953cf48bb7%3A0xde2fc73619b47d94!2sFORMATNULL%E2%84%A2%20ventures%20S.A.!5e0!3m2!1sen!2s!4v1700000000000"
              width="100%"
              height="500"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Overland Motorcycles Location"
            />
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;