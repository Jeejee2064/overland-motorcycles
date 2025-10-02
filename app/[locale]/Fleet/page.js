'use client'
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Gauge, Mountain, Zap, Shield, Settings, Fuel, Weight, ChevronDown, Package, Smartphone, User } from 'lucide-react';

import Navigation from '../../../components/Navigation'; 
import MountainParallax from '../../../components/MountainParallax'; 
import Footer from '../../../components/Footer'; 
import ButtonPrimary from '../../../components/ButtonPrimary';
import ButtonSecondary from '../../../components/ButtonSecondary';

const FleetPage = () => {
  const t = useTranslations('FleetPage');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const { scrollY } = useScroll();
  
  const yBg = useTransform(scrollY, [0, 1000], [0, -200]);
  const yContent = useTransform(scrollY, [0, 1000], [0, -100]);
  const scale = useTransform(scrollY, [0, 500], [1, 1.1]);
  
  // Parallax text transforms
  const xText1 = useTransform(scrollY, [0, 2000], [0, -300]);
  const xText2 = useTransform(scrollY, [0, 2000], [0, 300]);
  const yParallaxBg = useTransform(scrollY, [0, 2000], [0, -600]);
  
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

  // Gallery images array
  const galleryImages = [
    'Moto1.jpg', 'Moto2.jpg', 'Moto3.jpg', 'Moto4.jpg', 'Moto5.jpg',
    'Moto6.jpg', 'Moto7.jpg', 'Moto8.jpg', 'Moto9.jpg', 'Moto10.jpg',
    'Moto11.jpg', 'Moto12.jpg', 'Moto13.jpg', 'Moto14.jpg', 'Moto15.jpg',
    'Moto16.jpg', 'Moto17.jpg', 'Moto18.jpg', 'Moto19.jpg'
  ];

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
              src="/Moto6.jpg"
              alt={t('heroAlt')}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent" />
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
            className="text-xl md:text-2xl lg:text-3xl text-gray-200 mb-12 max-w-4xl mx-auto"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <ButtonPrimary href="#specs" text={t('viewSpecs')} />
            <ButtonSecondary href="/Booking" text={t('bookNow')} />
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

      {/* Bike Showcase Section */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-900/5 rounded-full blur-3xl" />
        
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

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Motorcycle Image */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[500px] h-[500px] bg-gradient-to-br from-yellow-400/20 via-gray-900/10 to-yellow-400/20 rounded-full blur-3xl" />
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-10"
                >
<Image
  src="/royal-enfield-himalayan.png"
  alt={t('bikeAlt')}
  width={700}   // or the actual image width
  height={500}  // or the actual image height
  className="w-full h-auto"
/>

                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-8 left-8 bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl z-20"
                >
                  {t('badge')}
                </motion.div>
              </motion.div>
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
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

      {/* Included Equipment */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              {t('equipmentTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('equipmentSubtitle')}
            </p>
            <div className="h-1 w-24 bg-yellow-400 mx-auto rounded-full mt-6" />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Package, title: t('cases'), desc: t('casesDesc') },
              { icon: Shield, title: t('helmets'), desc: t('helmetsDesc') },
              { icon: Smartphone, title: t('phone'), desc: t('phoneDesc') },
              { icon: User, title: t('passenger'), desc: t('passengerDesc') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <item.icon size={40} className="text-gray-900" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
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


      <section className="relative h-screen overflow-hidden">
        {/* Fast parallax background */}
     

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