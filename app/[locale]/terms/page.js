'use client'
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FileText, Clock, DollarSign, Shield, Users, AlertTriangle } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';

const TermsPage = () => {
  const t = useTranslations('TermsPage');

  const termsData = [
    {
      icon: FileText,
      title: t('term1Title'),
      content: t('term1Content'),
    },
    {
      icon: Clock,
      title: t('term2Title'),
      content: t('term2Content'),
    },
    {
      icon: DollarSign,
      title: t('term3Title'),
      content: t('term3Content'),
    },
    {
      icon: Shield,
      title: t('term4Title'),
      content: t('term4Content'),
    },
    {
      icon: Users,
      title: t('term5Title'),
      content: t('term5Content'),
    },
    {
      icon: AlertTriangle,
      title: t('term6Title'),
      content: t('term6Content'),
    },
  ];



  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section - DARK BACKGROUND */}
      <section className="relative h-[40vh] bg-background flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/moto2.webp" // Reusing your background image
            alt="Terms and Conditions Background"
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
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </motion.div>
      </section>

      {/* Terms Content Section - WHITE BACKGROUND */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('sectionTitle')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('sectionSubtitle')}
            </p>
          </motion.div>

          {/* Terms Grid */}
          <div className="space-y-8">
            {termsData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 border border-gray-200"
              >
                <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <item.icon size={18} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legal Links Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-10 mt-10 border-t border-gray-200 text-center"
          >
            <p className="text-base text-gray-600 mb-3">
              {t('term6Content')}
            </p>
            <Link 
              href="/privacy"
              className="text-lg font-semibold text-gray-900 hover:text-yellow-400 transition-colors underline"
            >
              {t('privacyLink')}
            </Link>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsPage;