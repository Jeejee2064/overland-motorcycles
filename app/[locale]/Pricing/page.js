'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check, Shield, Calendar, DollarSign, FileText } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import ButtonPrimary from '../../../components/ButtonPrimary';

const HIMALAYAN_PRICING = [
  { days: 2,  price: 280 },
  { days: 3,  price: 400 },
  { days: 4,  price: 530 },
  { days: 5,  price: 660 },
  { days: 6,  price: 790 },
  { days: 7,  price: 899 },
  { days: 8,  price: 1010 },
  { days: 9,  price: 1175 },
  { days: 10, price: 1230 },
  { days: 11, price: 1290 },
  { days: 12, price: 1350 },
  { days: 13, price: 1380 },
  { days: 14, price: 1420 },
  { days: 21, price: 1800 },
];

const CFMOTO_PRICING = [
  { days: 2,  price: 340 },
  { days: 3,  price: 480 },
  { days: 4,  price: 640 },
  { days: 5,  price: 790 },
  { days: 6,  price: 950 },
  { days: 7,  price: 1080 },
  { days: 8,  price: 1210 },
  { days: 9,  price: 1410 },
  { days: 10, price: 1480 },
  { days: 11, price: 1550 },
  { days: 12, price: 1620 },
  { days: 13, price: 1660 },
  { days: 14, price: 1700 },
  { days: 21, price: 2160 },
];

const MODELS = [
  {
    id: 'himalayan',
    name: 'Royal Enfield Himalayan',
    cc: '450cc',
    type: 'Adventure Touring',
    qty: 'Fleet of 6',
    pricing: HIMALAYAN_PRICING,
    accent: 'yellow',
    bookParam: '?model=Himalayan',
  },
  {
    id: 'cfmoto',
    name: 'CF Moto 700 CL-X',
    cc: '700cc',
    type: 'Sport Adventure',
    qty: '1 Available',
    pricing: CFMOTO_PRICING,
    accent: 'orange',
    bookParam: '?model=CFMoto700',
  },
];

const PricingPage = () => {
  const t = useTranslations('PricingPage');
  const [activeModel, setActiveModel] = useState('himalayan');

  const currentModel = MODELS.find(m => m.id === activeModel);

  const included = [
    t('included1'),
    t('included2'),
    t('included3'),
    t('included4'),
    t('included5'),
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />

      {/* Pricing Table Section */}
      <section className="py-20 mt-8 bg-white">
        <div className="max-w-6xl mx-auto px-4">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('tableTitle')}
            </h2>
       
          </motion.div>

          {/* Model Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 rounded-2xl p-1.5 gap-1">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setActiveModel(model.id)}
                  className={`relative px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeModel === model.id
                      ? 'bg-gray-900 text-yellow-400 shadow-lg'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {activeModel === model.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gray-900 rounded-xl"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <span className="relative">
                    {model.name}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      activeModel === model.id
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {model.cc}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Model Info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModel}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              {/* Model badge row */}
              <div className="flex items-center gap-3 mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full">
                  {currentModel.type}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-600 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
                  {currentModel.qty}
                </span>
              </div>

              {/* Pricing Table */}
              <div className="bg-gray-50 rounded-3xl w-full max-w-[400px] border border-gray-200 overflow-hidden shadow-xl">
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
                      {currentModel.pricing.map((item, index) => (
                        <motion.tr
                          key={item.days}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
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

                <div className="bg-yellow-400/10 border-t border-yellow-400/30 px-6 py-4">
                  <p className="text-sm text-gray-700 text-center">
                    <DollarSign size={16} className="inline mr-1" />
                    {t('priceNote')}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center mt-10">
                <ButtonPrimary
                  href={`/Booking${currentModel.bookParam}`}
                  text={t('bookNow')}
                />
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* What's Included */}
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

      {/* Important Information */}
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
            <div className="flex items-start gap-4">
              <Shield size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('depositTitle')}</h3>
                <p className="text-gray-600">{t('depositDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <FileText size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('requirementsTitle')}</h3>
                <p className="text-gray-600">{t('requirementsDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Calendar size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('cancellationTitle')}</h3>
                <p className="text-gray-600">{t('cancellationDesc')}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">{t('legalNote')}</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/terms" className="text-sm font-semibold text-gray-900 hover:text-yellow-400 transition-colors underline">
                  {t('termsLink')}
                </Link>
                <Link href="/privacy" className="text-sm font-semibold text-gray-900 hover:text-yellow-400 transition-colors underline">
                  {t('privacyLink')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
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
                <h3 className="text-xl font-bold text-white mb-3">{t(`faq${num}Q`)}</h3>
                <p className="text-gray-300 leading-relaxed">{t(`faq${num}A`)}</p>
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