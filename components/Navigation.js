'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import LocaleSwitcher from './LocaleSwitcher';
import { useTranslations } from 'next-intl';

const Navigation = () => {
    // We'll use the 'Navigation' namespace for all translation keys here
    const t = useTranslations('Navigation'); 
    const tTours = useTranslations('Tours');

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect - check on mount AND on scroll
  useEffect(() => {
    // Check initial scroll position
    const checkScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };
    
    // Check immediately on mount
    checkScroll();

    // Then listen for scroll events
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  // Close the mobile menu with Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Use translation keys for the nav items
  const navItems = [
    { name: t('navFleet'), href: '/Fleet' },
    { name: t('navPanama'), href: '/Panama' },
    { name: tTours('navLabel'), href: '/motorcycle-tours' },
    { name: t('navPricing'), href: '/Pricing' },
    { name: t('navContact'), href: '/contact' }
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition duration-300 bg-background`}
    >
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.span 
              className="text-lg lg:text-xl font-bold bg-gradient-to-br from-gray-50 to-gray-200 bg-clip-text text-transparent"
              whileHover={{ scale: 1.02 }}
            >
              {/* Logo text is often not translated, but using a key for consistency is fine */}
              {t('logoText')} 
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <Link
                  href={item.href}
                  className="relative px-4 py-2 text-gray-300 hover:text-yellow-400 transition-colors duration-200 group"
                >
                  <span className="relative z-10 font-medium">{item.name}</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-lg opacity-0 group-hover:opacity-100"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 group-hover:w-full group-hover:left-0 transition duration-300"
                  />
                </Link>
              </motion.div>
            ))}
               <LocaleSwitcher />
          </div>

          {/* Desktop Right Side - Locale Switcher + CTA */}
          <div className="hidden lg:flex items-center gap-4">
         
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link
                href="/Booking"
                className="group relative inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-semibold rounded-lg shadow-lg overflow-hidden transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
                <span className="relative z-10">{t('bookNowBtn')}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            type="button"
            className="lg:hidden p-3 text-gray-300 bg-gray-900/80 backdrop-blur-sm rounded-lg hover:text-yellow-400 transition-colors"
            onClick={toggleMenu}
            whileTap={{ scale: 0.95 }}
            aria-label={isOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
              onClick={toggleMenu}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-full overflow-y-auto overscroll-contain bg-gray-900 shadow-2xl lg:hidden z-50"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent" />
              
              <div className="relative p-6 flex flex-col h-full">
                {/* Logo in mobile menu */}
                <Link href="/" onClick={toggleMenu} className="mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-20 h-20 mx-auto"
                  >
                    <Image
                      src="/LOGOBL.svg"
                      alt={t('logoAlt')}
                      fill
                      className="object-contain"
                    />
                  </motion.div>
                </Link>

                <div className="space-y-2 w-full  items-center flex flex-col mb-6">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={toggleMenu}
                        className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition duration-200 group"
                      >
                        <span className="font-medium">{item.name}</span>
                        <motion.div
                          className="ml-auto opacity-0 group-hover:opacity-100"
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                        >
                          →
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Locale Switcher Mobile */}
                <motion.div
                  className="mb-6 flex justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <LocaleSwitcher />
                </motion.div>
                
                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    href="/Booking"
                    onClick={toggleMenu}
                    className="group relative block w-full px-6 py-4 text-center bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-semibold rounded-lg shadow-lg overflow-hidden transition-transform duration-200 active:scale-[0.98]"
                  >
                    <span className="relative z-10">{t('bookYourTripBtn')}</span>
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"
                    />
                  </Link>
                </motion.div>

                {/* Decorative element */}
                <div className="mt-6 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navigation;