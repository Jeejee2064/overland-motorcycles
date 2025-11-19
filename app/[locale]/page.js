
'use client'
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronDown, MapPin, Bike, Shield, ArrowRight, Briefcase, Smartphone, Bird, Sparkles } from 'lucide-react';

import { HeliconiaBackground, WaveBackground, TopWaveBackground, BambooBackground, GridPattern, PalmBackground } from '../../components/backgrounds';
import Navigation from '../../components/Navigation';
import MountainParallax from '../../components/MountainParallax';
import Footer from '../../components/Footer';


import ButtonPrimary from '../../components/ButtonPrimary';
import ButtonSecondary from '../../components/ButtonSecondary';

const HomePage = () => {
  const t = useTranslations('HomePage');
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
              src="/hero2.jpg"
              alt="Panama Adventure"
              fill
              className="object-cover"
              priority
            />

          </div>
        </motion.div>

        {/* Floating accent circle */}
        <motion.div
          style={{ x: mousePosition.x, y: mousePosition.y }}
          className="absolute top-20 left-20 w-4 h-4 bg-yellow-400/30 rounded-full blur-sm"
        />

        {/* Hero content */}
        <motion.div
          style={{ y: smoothYContent }}
          className="relative z-10 text-center px-4 max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full blur-xl" />
              <Image
                src="/LOGOBL.svg"
                alt="Logo Overland Motorcycles"
                fill
                className="object-contain relative z-10"
                priority
              />
            </div>
          </motion.div>

          <div className="relative px-6 py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.35)_40%,rgba(0,0,0,0)_100%)] pointer-events-none" />

            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent"
            >
              {t('hero')}
            </motion.h2>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative text-lg md:text-xl lg:text-2xl text-gray-200 drop-shadow-md mb-12 max-w-4xl mx-auto"
            >
              {t('heroSubtitle')}
            </motion.h1>
          </div>



          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <ButtonPrimary href="/Booking" text={t('bookTrip')} />
            <ButtonSecondary href="/Fleet" text={t('viewFleet')} />
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
      {/* Destinations Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500  to-yellow-400 bg-clip-text text-transparent">
              {t('destinationsTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t('aboutDesc')}</p>

          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { title: t('sanBlas'), desc: t('sanBlasDesc'), image: 'sanblas.webp' },
              { title: t('mountains'), desc: t('mountainsDesc'), image: 'montagne.webp' },
              { title: t('waterfalls'), desc: t('waterfallsDesc'), image: 'cascade.webp' }
            ].map((dest, index) => (
              <Link href="/Panama" key={index} passHref>
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-6">
                    <Image
                      src={`/${dest.image}`}
                      alt={dest.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 h" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-2xl font-bold text-white mb-3">{dest.title}</h3>
                      {/* <p className="text-gray-200">{dest.desc}</p> */}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/*Panama Section */}
      <section id="about" className="py-20 bg-background">

        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              {t('aboutTitle')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Bird, title: t('biodiversity') },
              { icon: Sparkles, title: t('adventure') },
              { icon: Shield, title: t('bridge') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-6 rounded-2xl  "
              >
                <div className="w-16 h-16 mx-auto mb-4  rounded-full flex items-center justify-center">
                  <item.icon size={32} className="text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
              </motion.div>
            ))}
          </div>

        </div>

      </section>
      <section className="relative py-20 bg-white overflow-hidden">

        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              {t('fleetTitle')}
            </h2>
            <h3 className="text-2xl md:text-3xl  text-gray-900 mb-4">               {t('fleetSubtitle')}</h3>
            <div className="h-1 w-24 bg-yellow-400 mx-auto rounded-full" />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Motorcycle Image Section */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                {/* Circular background accent */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[500px] h-[500px] bg-gradient-to-br from-yellow-400/20 via-gray-900/10 to-yellow-400/20 rounded-full blur-3xl" />
                </div>

                {/* Motorcycle image */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-10"
                >
                  <img
                    src="/royal-enfield-himalayan.png"
                    alt="Royal Enfield Himalayan"
                    className="w-full h-auto "
                  />
                </motion.div>




              </motion.div>
            </div>

            {/* Content Section */}
            <div className="space-y-8">

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <p className="text-xl text-gray-600 leading-relaxed">
                  {t('fleetAccessories')}
                </p>
              </motion.div>

              {/* Features List */}
              <div className="space-y-4">
                {[
                  { title: t('feature1'), icon: Shield },
                  { title: t('feature2'), icon: Briefcase },
                  { title: t('feature3'), icon: Smartphone },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ x: 10 }}
                    className="flex items-center space-x-4 p-5 rounded-xl bg-gray-50 border border-gray-200 group hover:border-yellow-400 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-14 h-14 bg-yellow-400/20 rounded-full flex items-center justify-center group-hover:bg-yellow-400/30 transition-colors duration-300">
                      <feature.icon size={26} className="text-gray-900" />
                    </div>
                    <h5 className="text-lg font-semibold text-gray-900">{feature.title}</h5>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-4"
              >
                <ButtonSecondary href="/Fleet" text={t('LearnMore')} theme='light' />
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      <MountainParallax />









      {/* Contact Section */}
      <section id="contact" className="relative min-h-screen py-32 overflow-hidden bg-background">
        <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
          <Image
            src="/ready.jpg"
            alt="Panama Adventure"
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-yellow-500  to-yellow-400 bg-clip-text text-transparent">
              {t("contactTitle")}
            </h2>
            <p className="text-xl text-gray-300 mb-10">{t("contactDesc")}</p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <ButtonPrimary href="/Booking" text={t('bookTrip')} />
              <ButtonSecondary href="/contact" text={t('contact')} />
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default HomePage;