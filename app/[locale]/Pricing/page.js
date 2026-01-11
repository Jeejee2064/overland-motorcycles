'use client'
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check, Shield, Calendar, DollarSign, FileText } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import ButtonPrimary from '../../../components/ButtonPrimary';

const PricingPage = () => {
  const t = useTranslations('PricingPage');

  const pricingData = [
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

  const included = [
    t('included1'),
    t('included2'),
    t('included3'),
    t('included4'),
    t('included5')
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      
    
      {/* Pricing Table Section - WHITE BACKGROUND */}
      <section className="py-20 mt-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 ">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('tableTitle')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('tableSubtitle')}
            </p>
          </motion.div>
<div className="justify-center items-center flex">
          {/* Pricing Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gray-50 rounded-3xl max-w-[400px] border border-gray-200 overflow-hidden shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                      {t('days')}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-yellow-400 uppercase tracking-wider">
                      {t('price')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pricingData.map((item, index) => (
                    <motion.tr
                      key={item.days}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-yellow-400/10 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        {item.days} {item.days === 1 ? t('day') : t('daysPlural')}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-bold text-lg">
                        ${item.price}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note */}
            <div className="bg-yellow-400/10 border-t border-yellow-400/30 px-6 py-4">
              <p className="text-sm text-gray-700 text-center">
                <DollarSign size={16} className="inline mr-1" />
                {t('priceNote')}
              </p>
            </div>
          </motion.div>
</div>
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <ButtonPrimary href="/Booking" text={t('bookNow')} />
          </motion.div>
        </div>
      </section>

      {/* What's Included Section - DARK BACKGROUND */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('includedTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('includedSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {included.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-6 rounded-xl bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:border-yellow-400/30 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={18} className="text-yellow-400" />
                </div>
                <p className="text-gray-300 font-medium">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Information - WHITE BACKGROUND */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('importantTitle')}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 rounded-3xl border border-gray-200 p-8 space-y-6"
          >
            
            {/* Deposit */}
            <div className="flex items-start gap-4">
              <Shield size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('depositTitle')}</h3>
                <p className="text-gray-600">{t('depositDesc')}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="flex items-start gap-4">
              <FileText size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('requirementsTitle')}</h3>
                <p className="text-gray-600">{t('requirementsDesc')}</p>
              </div>
            </div>

            {/* Cancellation */}
            <div className="flex items-start gap-4">
              <Calendar size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('cancellationTitle')}</h3>
                <p className="text-gray-600">{t('cancellationDesc')}</p>
              </div>
            </div>

            {/* Legal Links */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">{t('legalNote')}</p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/terms"
                  className="text-sm font-semibold text-gray-900 hover:text-yellow-400 transition-colors underline"
                >
                  {t('termsLink')}
                </Link>
                <Link 
                  href="/privacy"
                  className="text-sm font-semibold text-gray-900 hover:text-yellow-400 transition-colors underline"
                >
                  {t('privacyLink')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section - DARK BACKGROUND */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('faqTitle')}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[1, 3, 4].map((num) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: num * 0.1 }}
                className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {t(`faq${num}Q`)}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {t(`faq${num}A`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;