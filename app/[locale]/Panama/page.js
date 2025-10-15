'use client'
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Mountain, Waves, TreePine, Sun, Compass, Map, Bird, ChevronDown, Camera, Shield, Sparkles, MapPin, Clock, Users } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import MountainParallax from '../../../components/MountainParallax';
import Footer from '../../../components/Footer';
import ButtonPrimary from '../../../components/ButtonPrimary';
import ButtonSecondary from '../../../components/ButtonSecondary';

const PanamaPage = () => {
  const t = useTranslations('PanamaPage');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();

  const yBg = useTransform(scrollY, [0, 1000], [0, -200]);
  const yContent = useTransform(scrollY, [0, 1000], [0, -100]);
  const scale = useTransform(scrollY, [0, 500], [1, 1.1]);

  const springConfig = { stiffness: 300, damping: 30 };
  const smoothYBg = useSpring(yBg, springConfig);
  const smoothYContent = useSpring(yContent, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen bg-background flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ y: smoothYBg, scale }}
          className="absolute inset-0 z-0"
        >
          <div className="relative w-full h-full">
            <Image
              src="/sanblas.webp"
              alt={t('heroAlt')}
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.div>

        <motion.div
          style={{ x: mousePosition.x, y: mousePosition.y }}
          className="absolute top-20 left-20 w-4 h-4 bg-yellow-400/30 rounded-full blur-sm"
        />

        <motion.div
          style={{ y: smoothYContent }}
          className="relative z-10 text-center px-4 max-w-6xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent"
          >
            {t('heroTitle')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl lg:text-3xl text-background mb-12 max-w-4xl   mx-auto"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <ButtonPrimary href="/Booking" text={t('bookCta')} />
            <ButtonSecondary href="#trips" text={t('exploreCta')} />

          </motion.div>
        </motion.div>
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center text-yellow-400"
          >
            <ChevronDown size={24} />
          </motion.div>
        </motion.div>
      </section>

      {/* Why Panama Section - WHITE BACKGROUND */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {t('whyTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('whySubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Bird,
                title: t('biodiversityTitle'),
                desc: t('biodiversityDesc')
              },
              {
                icon: Waves,
                title: t('oceansTitle'),
                desc: t('oceansDesc')
              },
              {
                icon: Mountain,
                title: t('mountainsTitle'),
                desc: t('mountainsDesc')
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-8 rounded-2xl bg-gray-50 border border-gray-200 hover:border-yellow-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <item.icon size={40} className="text-gray-900" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wildlife Gallery - DARK BACKGROUND */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('wildlifeTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('wildlifeSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { image: 'sloth.jpg', title: t('slothTitle') },
              { image: 'croco.jpg', title: t('crocoTitle') },
              { image: 'hibiscus.jpg', title: t('hibiscusTitle') },
              { image: 'toucan.jpg', title: t('toucanTitle') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={`/${item.image}`}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proposed Trips - WHITE BACKGROUND */}
      <section id="trips" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {t('tripsTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('tripsSubtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: t('trip1Title'),
                desc: t('trip1Desc'),
                duration: t('trip1Duration'),
                difficulty: t('trip1Difficulty'),
                image: 'sanblas.webp',
                highlights: [t('trip1H1'), t('trip1H2'), t('trip1H3')]
              },
              {
                title: t('trip2Title'),
                desc: t('trip2Desc'),
                duration: t('trip2Duration'),
                difficulty: t('trip2Difficulty'),
                image: 'montagne.webp',
                highlights: [t('trip2H1'), t('trip2H2'), t('trip2H3')]
              },
              {
                title: t('trip3Title'),
                desc: t('trip3Desc'),
                duration: t('trip3Duration'),
                difficulty: t('trip3Difficulty'),
                image: 'cascade.webp',
                highlights: [t('trip3H1'), t('trip3H2'), t('trip3H3')]
              }
            ].map((trip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 hover:border-yellow-400 hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={`/${trip.image}`}
                    alt={trip.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{trip.title}</h3>
                  <p className="text-gray-600 mb-4">{trip.desc}</p>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{trip.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mountain size={16} />
                      <span>{trip.difficulty}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {trip.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2" />
                        <p className="text-sm text-gray-600">{highlight}</p>
                      </div>
                    ))}
                  </div>

                  <ButtonSecondary href="/contact" text={t('learnMore')} theme="light" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations - DARK BACKGROUND */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('destinationsTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('destinationsSubtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {[
              { title: t('cityTitle'), desc: t('cityDesc'), image: 'panama-city.jpg' },
              { title: t('cultureTitle'), desc: t('cultureDesc'), image: 'pirogue.jpg' }
            ].map((dest, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                  <Image
                    src={`/${dest.image}`}
                    alt={dest.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-white mb-3">{dest.title}</h3>
                    <p className="text-gray-200">{dest.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section - WHITE BACKGROUND */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/Moto8.jpg"
                  alt={t('experienceAlt')}
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                {t('experienceTitle')}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t('experienceDesc1')}
              </p>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t('experienceDesc2')}
              </p>
              <div className="pt-4">
                <ButtonPrimary href="/Booking" text={t('startAdventure')} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Adventure Features - DARK BACKGROUND */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('adventureTitle')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Compass, title: t('guided'), desc: t('guidedDesc') },
              { icon: Shield, title: t('safe'), desc: t('safeDesc') },
              { icon: Camera, title: t('memorable'), desc: t('memorableDesc') },
              { icon: Map, title: t('routes'), desc: t('routesDesc') }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <feature.icon size={32} className="text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="book" className="relative min-h-screen py-32 overflow-hidden bg-background">
        <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
          <Image
            src="/montagne.webp"
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
              <ButtonPrimary href="/Booking" text={t('bookNow')} />
              <ButtonSecondary href="/contact" text={t('contactUs')} />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PanamaPage;