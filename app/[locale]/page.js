
'use client'
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronDown, MapPin, Bike, Shield, Star } from 'lucide-react';
import Navigation from '../../components/Navigation'; 
import MountainParallax from '../../components/MountainParallax'; 

// Mock translations - replace with your actual translation setup
const useMockTranslations = (namespace) => {
  const translations = {
    'HomePage': {
      // Hero
      hero: 'Adventure starts here!',
      heroSubtitle: 'Explore Panama on Royal Enfield Himalayan 450cc motorcycles through diverse landscapes.',
      bookTrip: 'Book Your Trip',
      viewFleet: 'The Fleet',
      
      // Fleet
      fleetTitle: 'Royal Enfield Himalayan 450cc',
      fleetSubtitle: 'Built for Adventure',
      fleetDesc: 'Premium motorcycles with full gear included.',
      fleetAccessories: 'Included Accessories',
      feature1: 'Adventure Helmet',
      feature2: 'Side & Top Cases',
      feature3: 'Phone Mount',
      feature4: '450cc Engine',
      
      // Destinations
      destinationsTitle: 'Discover Panama',
      sanBlas: 'San Blas Islands',
      sanBlasDesc: 'Caribbean paradise with crystal waters.',
      mountains: 'Mountain Adventures', 
      mountainsDesc: 'Cloud forests and scenic peaks.',
      waterfalls: 'Hidden Waterfalls',
      waterfallsDesc: 'Secret cascades in rainforest.',
      
      // Trips
      tripsTitle: 'Our Trips',
      tripsDesc: 'Choose your Panama experience.',
      
      // Pricing
      pricingTitle: 'Pricing',
      pricingDesc: 'Transparent all-inclusive packages.',
      dayTrips: 'Day Trips',
      multiDay: 'Multi-Day',
      custom: 'Custom',
      
      // About
      aboutTitle: 'Why Panama?',
      aboutDesc: 'Bridge between continents and oceans with incredible biodiversity.',
      biodiversity: 'Biodiversity Hotspot',
      adventure: 'Adventure Paradise',
      bridge: 'Bridge of Americas',
      
      // Contact
      contactTitle: 'Ready for Adventure?',
      contactDesc: 'Join us for unforgettable motorcycle adventures.',
      bookNow: 'Book Now',
      contact: 'Contact Us'
    }
  };
  
  return (key) => translations[namespace]?.[key] || key;
};

const HomePage = () => {
  const t = useMockTranslations('HomePage');
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ y: smoothYBg, scale }}
          className="absolute inset-0 z-0"
        >
          <div className="relative w-full h-full">
            <Image
              src="/hero.webp"
              alt="Panama Adventure"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent" />
          </div>
        </motion.div>

        <motion.div
          style={{
            x: mousePosition.x,
            y: mousePosition.y,
          }}
          className="absolute top-20 left-20 w-4 h-4 bg-yellow-400/30 rounded-full blur-sm"
        />

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
                src="/LOGO.svg"
                alt="Logo"
                fill
                className="object-contain relative z-10"
                priority
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-yellow-500  to-yellow-400 bg-clip-text text-transparent"
          >
            {t('hero')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="#trips" className="group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative px-8 py-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-full shadow-2xl overflow-hidden min-w-[200px]"
              >
                <span className="relative z-10">{t('bookTrip')}</span>
                <motion.div
                  className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                />
              </motion.button>
            </Link>

            <Link href="#fleet" className="group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative px-8 py-4 bg-transparent border-2 border-yellow-400 text-yellow-400 hover:text-gray-900 font-bold text-lg rounded-full overflow-hidden min-w-[200px] transition-colors duration-300"
              >
                <motion.div
                  className="absolute inset-0 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                />
                <span className="relative z-10">{t('viewFleet')}</span>
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

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

      {/* Fleet Section */}
      <section id="fleet" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              {t('fleetTitle')}
            </h2>
            <h3 className="text-2xl text-white mb-6">{t('fleetSubtitle')}</h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t('fleetDesc')}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`relative group cursor-pointer ${index === 2 ? 'col-span-2' : ''}`}
                >
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden relative">
                    <Image
                      src={`/moto${item}.webp`}
                      alt={`Himalayan ${item}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 " />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
                        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
      
            <p className="text-xl p-4 text-gray-300 max-w-3xl mx-auto">{t('fleetAccessories')}</p>
          </motion.div>
              {[
                { title: t('feature1'), icon: Shield },
                { title: t('feature2'), icon: MapPin },
                { title: t('feature3'), icon: Bike },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-gray-800/50"
                >
                  <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center">
                    <feature.icon size={24} className="text-yellow-400" />
                  </div>
                  <h5 className="text-lg font-semibold text-white">{feature.title}</h5>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
<MountainParallax />

      {/* Destinations Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {t('destinationsTitle')}
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { title: t('sanBlas'), desc: t('sanBlasDesc'), image: 'sanblas.webp' },
              { title: t('mountains'), desc: t('mountainsDesc'), image: 'montagne.webp' },
              { title: t('waterfalls'), desc: t('waterfallsDesc'), image: 'cascade.webp' }
            ].map((dest, index) => (
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
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

      {/* Trips Section */}
      <section id="trips" className="py-20 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              {t('tripsTitle')}
            </h2>
            <p className="text-xl text-gray-300">{t('tripsDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {['Day Adventures', 'Multi-Day Tours', 'Custom Expeditions'].map((trip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700/30"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-gray-600 to-gray-500 rounded-xl mb-4 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bike size={48} className="text-yellow-400/50" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{trip}</h3>
                <p className="text-gray-400">Explore Panama your way</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {t('pricingTitle')}
            </h2>
            <p className="text-xl text-gray-300">{t('pricingDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: t('dayTrips'), price: '$199', popular: false },
              { name: t('multiDay'), price: '$149', popular: true },
              { name: t('custom'), price: 'Custom', popular: false }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`relative p-8 rounded-2xl ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-yellow-400/10 to-yellow-600/5 border-2 border-yellow-400/30' 
                    : 'bg-gray-800/50 border border-gray-700/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold">
                    Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                  <span className="text-4xl font-bold text-yellow-400">{plan.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
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
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t('aboutDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: t('biodiversity') },
              { icon: Bike, title: t('adventure') },
              { icon: Shield, title: t('bridge') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-6 rounded-2xl bg-gray-800/50 border border-gray-700/30"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400/20 rounded-full flex items-center justify-center">
                  <item.icon size={32} className="text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {t('contactTitle')}
            </h2>
            <p className="text-xl text-gray-300 mb-10">{t('contactDesc')}</p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/trips">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-12 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold text-xl rounded-full"
                >
                  {t('bookNow')}
                </motion.button>
              </Link>

              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-12 py-5 border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900 font-bold text-xl rounded-full transition-colors"
                >
                  {t('contact')}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;