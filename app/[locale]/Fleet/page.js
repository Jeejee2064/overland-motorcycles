'use client'
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Gauge, Mountain, Zap, Shield, Settings, Fuel, Weight, ChevronDown, Package, Smartphone, User, ArrowRight } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import MountainParallax from '../../../components/MountainParallax';
import Footer from '../../../components/Footer';
import ButtonPrimary from '../../../components/ButtonPrimary';
import ButtonSecondary from '../../../components/ButtonSecondary';

const FleetPage = () => {
  const t = useTranslations('FleetPage');
  const tNav = useTranslations('Navigation');
  const tPanama = useTranslations('PanamaPage');
  const [selectedImage, setSelectedImage] = useState(null);
  const { scrollY } = useScroll();

  const yBg = useTransform(scrollY, [0, 1000], [0, -200]);
  const scale = useTransform(scrollY, [0, 500], [1, 1.1]);

  const springConfig = { stiffness: 300, damping: 30 };

  // Gallery images array
  const galleryImages = [
    'Moto1.jpg', 'Moto2.jpg', 'Moto3.jpg', 'Moto4.jpg', 'Moto5.jpg',
    'Moto6.jpg', 'Moto7.jpg', 'Moto8.jpg', 'Moto9.jpg', 'Moto10.jpg',
    'Moto11.jpg', 'Moto12.jpg', 'Moto13.jpg', 'Moto14.jpg', 'Moto15.jpg',
    'Moto16.jpg', 'Moto17.jpg', 'Moto18.jpg', 'Moto19.jpg'
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navigation />

      {/* Hero Section - Clean & Direct */}
      <section className="relative pt-32 pb-16 bg-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 font-light">
              {t('heroSubtitle')}
            </p>
          </motion.div>

          {/* Main Grid - Motorcycle + Equipment */}
          <div className="grid lg:grid-cols-2 gap-16 items-start max-w-7xl mx-auto">
            {/* Motorcycle Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-[500px] h-[500px] bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-400/10 rounded-full blur-3xl" />
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="relative z-10"
              >
                <Image
                  src="/royal-enfield-himalayan.png"
                  alt={t('bikeAlt')}
                  width={700}
                  height={500}
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-8 left-8 bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl z-20"
              >
                {t('badge')}
              </motion.div>

              {/* View Specifications Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-center"
              >
                <a
                  href="#specs"
                  className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors duration-300 group"
                >
                  {t('viewSpecs')}
                  <ChevronDown className="ml-2 group-hover:translate-y-1 transition-transform duration-300" size={20} />
                </a>
              </motion.div>
            </motion.div>

            {/* Included Equipment */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('equipmentTitle')}
                </h2>
                <p className="text-gray-500">
                  {t('equipmentSubtitle')}
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Package, title: t('cases'), desc: t('casesDesc') },
                  { icon: Shield, title: t('helmets'), desc: t('helmetsDesc') },
                  { icon: Smartphone, title: t('phone'), desc: t('phoneDesc') },
                  { icon: User, title: t('passenger'), desc: t('passengerDesc') }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start space-x-4 p-5 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-300"
                  >
                    <div className="w-12 h-12 bg-yellow-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon size={24} className="text-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bike Showcase Section */}
      <section className="relative py-20 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              {t('bikeTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('bikeSubtitle')}
            </p>
            <div className="h-1 w-24 bg-yellow-400 mx-auto rounded-full mt-6" />
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-3xl font-bold text-gray-900">{t('descTitle')}</h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t('descText1')}
              </p>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t('descText2')}
              </p>
            </motion.div>

            {/* Subtle CTA to Pricing */}
            <motion.a
              href="/Pricing"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="block mt-12 group"
            >
              <div className="flex items-center justify-between p-6 rounded-xl bg-white hover:shadow-md transition-all duration-300">
                <div>
                  <p className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                    {tNav('navPricing')}
                  </p>
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-2 transition-all duration-300" size={24} />
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section id="specs" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('specsTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('specsSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, label: t('engine'), value: t('engineValue') },
              { icon: Gauge, label: t('power'), value: t('powerValue') },
              { icon: Settings, label: t('torque'), value: t('torqueValue') },
              { icon: Weight, label: t('weight'), value: t('weightValue') },
              { icon: Fuel, label: t('tank'), value: t('tankValue') },
              { icon: Mountain, label: t('ground'), value: t('groundValue') }
            ].map((spec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:border-yellow-400/30 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center">
                    <spec.icon size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{spec.label}</p>
                    <p className="text-xl font-bold text-white">{spec.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Subtle CTA to Panama */}
          <motion.a
            href="/Panama"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="block max-w-2xl mx-auto mt-16 group"
          >
            <div className="flex items-center justify-between p-6 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300">
              <div>
                <p className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                  {tPanama('heroTitle')}
                </p>
              </div>
              <ArrowRight className="text-gray-400 group-hover:text-yellow-400 group-hover:translate-x-2 transition-all duration-300" size={24} />
            </div>
          </motion.a>

          {/* Book Now Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-12"
          >
            <a
              href="/Booking"
              className="inline-flex items-center px-10 py-5 bg-yellow-400 text-gray-900 rounded-full font-bold text-lg hover:bg-yellow-500 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              {t('bookNow')}
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('featuresTitle')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: t('feature1Title'), desc: t('feature1Desc') },
              { title: t('feature2Title'), desc: t('feature2Desc') },
              { title: t('feature3Title'), desc: t('feature3Desc') },
              { title: t('feature4Title'), desc: t('feature4Desc') }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:border-yellow-400/30 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('galleryTitle')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index % 3) * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={`/${image}`}
                    alt={`${t('galleryAlt')} ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-yellow-400/90 text-gray-900 px-6 py-3 rounded-full font-bold">
                      {t('viewFull')}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Subtle CTA to Contact */}
          <motion.a
            href="/contact"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="block max-w-2xl mx-auto mt-16 group"
          >
            <div className="flex items-center justify-between p-6 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300">
              <div>
                <p className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                  {t('askQuestion')}
                </p>
              </div>
              <ArrowRight className="text-gray-400 group-hover:text-yellow-400 group-hover:translate-x-2 transition-all duration-300" size={24} />
            </div>
          </motion.a>
        </div>
      </section>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-yellow-400 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative w-full h-full max-w-7xl max-h-[90vh]"
          >
            <Image
              src={`/${selectedImage}`}
              alt={t('galleryAlt')}
              fill
              className="object-contain"
              quality={100}
              priority
            />
          </motion.div>
        </motion.div>
      )}

      {/* SEO Banner Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/Moto6.jpg"
            alt={t('bannerTitle')}
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>

        {/* SEO Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center px-4 z-10 max-w-5xl"
          >
            <h3 className="text-4xl md:text-6xl font-bold text-white mb-8">
              {t('bannerTitle')}
            </h3>
            <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-yellow-400/20">
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-6">
                {t('seoText1')}
              </p>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-6">
                {t('seoText2')}
              </p>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                {t('seoText3')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <MountainParallax />

      {/* CTA Section */}
      <section id="booking" className="relative min-h-screen py-32 overflow-hidden bg-background">
        <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
          <Image
            src="/moto2.webp"
            alt={t('ctaAlt')}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent" />
        </motion.div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('ctaTitle')}
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              {t('ctaDesc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <ButtonPrimary href="/Booking" text={t('rentNow')} />
              <ButtonSecondary href="/contact" text={t('askQuestion')} />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FleetPage;