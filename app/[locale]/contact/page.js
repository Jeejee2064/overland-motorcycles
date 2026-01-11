'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPin, Clock, Mail, Phone, Send, Instagram, Facebook } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import ButtonPrimary from '../../../components/ButtonPrimary';
import { createMessage } from '@/lib/supabase/messages';

const ContactPage = () => {
  const t = useTranslations('ContactPage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Save to Supabase database
      await createMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      });

      console.log('Message saved to database successfully');
      
      // Show success message
      alert('✅ Message sent successfully! We will get back to you soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

      // Also submit to Formspree as backup
      const formspreeData = new FormData();
      formspreeData.append('name', formData.name);
      formspreeData.append('email', formData.email);
      formspreeData.append('phone', formData.phone);
      formspreeData.append('message', formData.message);

      fetch('https://formspree.io/f/xblzydjy', {
        method: 'POST',
        body: formspreeData,
        headers: {
          'Accept': 'application/json'
        }
      }).catch(err => console.log('Formspree backup failed:', err));

    } catch (error) {
      console.error('Message error:', error);
      alert('There was an error sending your message. Please try again or contact us directly at overlandmotorcycles@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
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
                  <a href="https://wa.me/50768051100" className="text-gray-600 hover:text-yellow-400 transition-colors">
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

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('name')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
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
                      value={formData.email}
                      onChange={handleChange}
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
                      value={formData.phone}
                      onChange={handleChange}
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
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all resize-none"
                      placeholder="Tell us about your adventure plans..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Send size={20} />
                    {isSubmitting ? 'Sending...' : t('submit')}
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
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3587.1038012143595!2d-79.541778524982!3d8.954117091104239!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8faca9378280e6e9%3A0xf3d067acdd739d29!2sOverland%20motorcycles!5e1!3m2!1sfr!2spa!4v1768163740485!5m2!1sfr!2spa"
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