'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Calendar, User, MessageSquare, Bike, MapPin, Check, AlertCircle, X, MessageCircle, ChevronRight, ChevronLeft, Edit2, Receipt, CreditCard } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import BookingCalendar from '../../../components/BookingCalendar';
import { loadStripe } from '@stripe/stripe-js';
import { createBooking, checkBikesAvailable } from '@/lib/supabase/bookings';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Modal Component
const Modal = ({ isOpen, onClose, type, message, onConfirm }) => {
  if (!isOpen) return null;

  const modalTypes = {
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      buttonColor: 'bg-red-500 hover:bg-red-600'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
    },
    info: {
      icon: MessageCircle,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-500 hover:bg-blue-600'
    },
    contact: {
      icon: MessageCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      buttonColor: 'bg-green-500 hover:bg-green-600'
    }
  };

  const config = modalTypes[type] || modalTypes.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-700"
      >
        <div className={`p-6 ${config.bgColor} ${config.borderColor} border-b`}>
          <div className="flex items-center gap-3">
            <Icon className={config.iconColor} size={28} />
            <h3 className="text-xl font-bold text-gray-900">
              {type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'contact' ? 'Contact Required' : 'Information'}
            </h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        <div className="p-6 bg-gray-800/50 flex gap-3">
          {type === 'contact' && (
            <a
              href="https://wa.me/50768051100"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all text-center"
            >
              Contact Us on WhatsApp
            </a>
          )}
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3 ${config.buttonColor} text-white rounded-xl font-semibold transition-all`}
            >
              Confirm
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
          >
            {type === 'contact' ? 'Go Back' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Progress Dots Component
const ProgressDots = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {[...Array(totalSteps)].map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <motion.div
            key={stepNumber}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'bg-yellow-400 scale-125'
                  : isCompleted
                  ? 'bg-yellow-400/50'
                  : 'bg-gray-600'
              }`}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

const BookingPage = () => {
  const t = useTranslations('BookingPage');
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    message: '',
    onConfirm: null
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const bikes = searchParams.get("bikes");

    if (start) setStartDate(start);
    if (end) setEndDate(end);
    if (bikes) {
      setFormData(prev => ({ ...prev, bikeQuantity: bikes }));
    }
    if (start && end) {
      validateDates(start, end);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    riders: '1',
    bikeQuantity: '1',
    specialRequests: '',
    hearAboutUs: ''
  });

  const pricingData = [
    { days: 1, price: 280 },
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

  const showModal = (type, message, onConfirm = null) => {
    setModal({ isOpen: true, type, message, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: 'info', message: '', onConfirm: null });
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
      12, 0, 0
    );
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const validateDates = (start, end) => {
    if (!start || !end) {
      setValidationError(t('validationSelectDates'));
      return false;
    }

    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const minAdvanceDate = new Date(now);
    minAdvanceDate.setDate(minAdvanceDate.getDate() + 2);

    if (startDate < minAdvanceDate) {
      setValidationError('');
      showModal(
        'contact',
        t('validation48Hours')
      );
      return false;
    }

    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 2) {
      setValidationError(t('validationMinimum2Days'));
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleDateRangeChange = async (range) => {
    const start = formatLocalDate(range.startDate);
    const end = formatLocalDate(range.endDate);

    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      validateDates(start, end);

      try {
        const available = await checkBikesAvailable(start, end);
        const needed = parseInt(formData.bikeQuantity);

        if (available < needed) {
          setAvailabilityError(`Sorry, only ${available} motorcycle(s) available for the selected dates.`);
        } else {
          setAvailabilityError('');
        }
      } catch (error) {
        console.error('Availability check error:', error);
        setAvailabilityError('Unable to check availability. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const available = await checkBikesAvailable(startDate, endDate);
      const needed = parseInt(formData.bikeQuantity);

      if (available < needed) {
        showModal('error', `Sorry, only ${available} motorcycle(s) available for the selected dates. Please adjust your selection or choose different dates.`);
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/create-paguelofacil-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          downPayment: calculateDownPaymentWithFees(),
          totalRentalPrice: calculateTotalWithTaxes(),
          totalDeposit,
          startDate,
          endDate,
          bikeQuantity: parseInt(formData.bikeQuantity),
          calculatedDays: calculateDays(),
        }),
      });

      const { url, error, bookingId } = await response.json();

      if (error) throw new Error(error);
      if (!url) throw new Error('Missing Payment URL from server.');

      window.location.href = url;
    } catch (error) {
      console.error('Booking error:', error);
      showModal('error', error.message || 'There was an error processing your booking. Please try again or contact us for assistance.');
      setIsSubmitting(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'bikeQuantity' && startDate && endDate) {
      try {
        const available = await checkBikesAvailable(startDate, endDate);
        const needed = parseInt(value);

        if (available < needed) {
          setAvailabilityError(`Sorry, only ${available} motorcycle(s) available for the selected dates.`);
        } else {
          setAvailabilityError('');
        }
      } catch (error) {
        console.error('Availability check error:', error);
        setAvailabilityError('Unable to check availability. Please try again.');
      }
    }
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = parseLocalDate(startDate);
      const end = parseLocalDate(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    }
    return 0;
  };

  const calculatePrice = () => {
    const days = calculateDays();
    if (days === 0) return 0;

    const pricing = pricingData.find(p => p.days === days);
    if (pricing) return pricing.price;

    const sortedPricing = [...pricingData].sort((a, b) => a.days - b.days);
    for (let i = 0; i < sortedPricing.length - 1; i++) {
      if (days > sortedPricing[i].days && days < sortedPricing[i + 1].days) {
        return sortedPricing[i + 1].price;
      }
    }

    if (days > 21) {
      const basePrice = 1800;
      const baseDays = 21;
      return Math.round((basePrice / baseDays) * days);
    }

    return 0;
  };

  const rentalPrice = calculatePrice();
  const numBikes = parseInt(formData.bikeQuantity) || 1;
  const totalRentalPrice = rentalPrice * numBikes;
  
  // Tax calculations
  const ITBMS_RATE = 0.07; // 7%
  const CARD_FEE_RATE = 0.035; // 3.5%
  
  const itbmsTax = totalRentalPrice * ITBMS_RATE;
  const subtotalWithTax = totalRentalPrice + itbmsTax;
  const cardFee = subtotalWithTax * CARD_FEE_RATE;
  const totalWithAllFees = subtotalWithTax + cardFee;
  
  const depositPerBike = 1000;
  const totalDeposit = depositPerBike * numBikes;
  
  const downPayment = totalWithAllFees / 2;
  const remainingPayment = totalWithAllFees / 2;

  const calculateTotalWithTaxes = () => totalWithAllFees;
  const calculateDownPaymentWithFees = () => downPayment;

  const canProceedStep2 = startDate && endDate && !validationError && !availabilityError;
  const canProceedStep3 = formData.firstName.trim() && formData.lastName.trim() && formData.email.trim() && formData.phone.trim() && formData.country.trim();

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <Navigation />
      
      {modal.isOpen && (
        <Modal
          isOpen={modal.isOpen}
          onClose={closeModal}
          type={modal.type}
          message={modal.message}
          onConfirm={modal.onConfirm}
        />
      )}

      {/* Full-Screen Step Container */}
      <div className="min-h-screen pt-24 pb-6 px-4 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <ProgressDots currentStep={currentStep} totalSteps={4} />

          <AnimatePresence mode="wait">
            {/* STEP 1: Bike Selection */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                    {t('step1Title')}
                  </h2>
                  <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                    {t('step1Subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  {[1, 2, 3, 4].map((num) => (
                    <motion.button
                      key={num}
                      onClick={() => setFormData(prev => ({ ...prev, bikeQuantity: num.toString() }))}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: num * 0.1 }}
                      className={`relative p-4 md:p-6 rounded-2xl border-2 transition-all ${
                        formData.bikeQuantity === num.toString()
                          ? 'border-yellow-400 bg-yellow-400/10 shadow-xl shadow-yellow-400/20'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-3xl md:text-4xl font-black text-yellow-400 mb-1">{num}</div>
                      <div className="text-xs md:text-sm text-gray-300">
                        {num === 1 ? t('bikesOption1') : t('bikesOption2')}
                      </div>
                      {formData.bikeQuantity === num.toString() && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1"
                        >
                          <Check size={16} className="text-gray-900" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={() => setCurrentStep(2)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 md:py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-black text-lg md:text-xl rounded-2xl shadow-2xl hover:shadow-yellow-400/50 transition-all flex items-center justify-center gap-3"
                >
                  {t('stepContinue')}
                  <ChevronRight size={24} />
                </motion.button>
              </motion.div>
            )}

            {/* STEP 2: Date Selection */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                    {t('step2Title')}
                  </h2>
            
                </div>

                <div className="mb-4">
                  <BookingCalendar onDateRangeChange={handleDateRangeChange} />
                </div>

                {availabilityError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={18} />
                    <p className="text-red-300 text-sm">{availabilityError}</p>
                  </motion.div>
                )}

                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={18} />
                    <p className="text-yellow-300 text-sm">{validationError}</p>
                  </motion.div>
                )}

                {calculateDays() > 0 && !validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-gradient-to-br from-yellow-400/10 to-yellow-500/5 rounded-xl p-4 border border-yellow-400/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-400">{formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}</div>
                        <div className="text-lg font-bold text-white mt-1">
                          {calculateDays()} {calculateDays() === 1 ? t('day') : t('days')} × {formData.bikeQuantity} {formData.bikeQuantity === '1' ? 'Bike' : 'Bikes'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Rental Price</div>
                        <div className="text-2xl font-black text-yellow-400">${totalRentalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setCurrentStep(1)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 md:px-8 py-4 md:py-5 bg-gray-700 hover:bg-gray-600 text-white font-bold text-base md:text-lg rounded-2xl transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    <span className="hidden sm:inline">{t('stepBack')}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedStep2}
                    whileHover={canProceedStep2 ? { scale: 1.02 } : {}}
                    whileTap={canProceedStep2 ? { scale: 0.98 } : {}}
                    className={`flex-1 py-4 md:py-5 font-black text-lg md:text-xl rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 ${
                      canProceedStep2
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:shadow-yellow-400/50'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {t('stepContinue')}
                    <ChevronRight size={24} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Personal Information */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                    {t('step3Title')}
                  </h2>
                  <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                    {t('step3Subtitle')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {t('firstName')} *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-700 bg-gray-900/50 text-white outline-none focus:border-yellow-400 transition-all text-base"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {t('lastName')} *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-700 bg-gray-900/50 text-white outline-none focus:border-yellow-400 transition-all text-base"
                      placeholder="Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-700 bg-gray-900/50 text-white outline-none focus:border-yellow-400 transition-all text-base"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {t('phone')} *
                    </label>
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={formData.phone}
                      onChange={(value) => {
                        handleChange({
                          target: {
                            name: 'phone',
                            value: value || ''
                          }
                        });
                      }}
                      className="phone-input-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {t('country')} *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-700 bg-gray-900/50 text-white outline-none focus:border-yellow-400 transition-all text-base"
                      placeholder="USA"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {t('hearAboutUs')}
                    </label>
                    <select
                      name="hearAboutUs"
                      value={formData.hearAboutUs}
                      onChange={handleChange}
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-700 bg-gray-900/50 text-white outline-none focus:border-yellow-400 transition-all text-base"
                    >
                      <option value="">{t('selectOption')}</option>
                      <option value="google">{t('hearAboutOption1')}</option>
                      <option value="social">{t('hearAboutOption2')}</option>
                      <option value="friend">{t('hearAboutOption3')}</option>
                      <option value="blog">{t('hearAboutOption4')}</option>
                      <option value="other">{t('hearAboutOption5')}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {t('specialRequests')}
                    </label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-3 rounded-xl border-2 border-gray-700 bg-gray-900/50 text-white outline-none focus:border-yellow-400 transition-all text-base resize-none"
                      placeholder={t('specialRequestsPlaceholder')}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setCurrentStep(2)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 md:px-8 py-4 md:py-5 bg-gray-700 hover:bg-gray-600 text-white font-bold text-base md:text-lg rounded-2xl transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    <span className="hidden sm:inline">{t('stepBack')}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedStep3}
                    whileHover={canProceedStep3 ? { scale: 1.02 } : {}}
                    whileTap={canProceedStep3 ? { scale: 0.98 } : {}}
                    className={`flex-1 py-4 md:py-5 font-black text-lg md:text-xl rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 ${
                      canProceedStep3
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:shadow-yellow-400/50'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {t('stepContinue')}
                    <ChevronRight size={24} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Review & Payment - CONDENSED */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                    {t('summaryTitle')}
                  </h2>
                  <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                    {t('summarySubtitle')}
                  </p>
                </div>

                {/* CONDENSED SINGLE CARD */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 md:p-6 border border-yellow-400/30 mb-6"
                >
                  {/* Booking Info with Edit Buttons */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
                    <h3 className="text-lg font-black text-white">{t('summaryMotorcycles')} & {t('summaryDates')}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="p-2 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 transition-all text-xs flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        <span className="hidden sm:inline">{t('stepChange')}</span>
                      </button>
          
                    </div>
                  </div>

                  {/* Compact Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-gray-700">
                    <div>
                      <div className="text-xs text-gray-400">{t('summaryMotorcycles')}</div>
                      <div className="text-xl font-black text-yellow-400">{formData.bikeQuantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">{t('duration')}</div>
                      <div className="text-xl font-black text-yellow-400">{calculateDays()} {t('days')}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-400">{t('summaryDates')}</div>
                      <div className="text-sm font-bold text-white">{formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}</div>
                    </div>
                  </div>

                  {/* Contact Info with Edit */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
                    <h3 className="text-base font-black text-white">{t('summaryContact')}</h3>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="p-2 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 transition-all text-xs flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      <span className="hidden sm:inline">{t('stepChange')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-4 pb-4 border-b border-gray-700">
                    <div>
                      <span className="text-gray-400">{t('firstName')}: </span>
                      <span className="text-white font-semibold">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t('email')}: </span>
                      <span className="text-white font-semibold truncate">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t('phone')}: </span>
                      <span className="text-white font-semibold">{formData.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t('country')}: </span>
                      <span className="text-white font-semibold">{formData.country}</span>
                    </div>
                  </div>

                  {/* Price Breakdown - Compact */}
                  <h3 className="text-base font-black text-yellow-400 mb-3">{t('summaryPaymentTitle')}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('summaryRentalCost')}</span>
                      <span className="text-white font-bold">${totalRentalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t('summaryTax')}</span>
                      <span className="text-gray-400">+${itbmsTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs pb-2 border-b border-gray-700">
                      <span className="text-gray-500">{t('summaryCardFee')}</span>
                      <span className="text-gray-400">+${cardFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-yellow-400/10 rounded-lg px-3">
                      <span className="font-bold text-yellow-400">{t('summaryTotal')}</span>
                      <span className="text-xl font-black text-yellow-400">${totalWithAllFees.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Schedule - Compact */}
                  <div className="grid md:grid-cols-2 gap-3 mt-4">
                    <div className="bg-green-500/10 border border-green-500 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-400 text-sm">{t('downPaymentLabel')}</span>
                        <span className="text-xl font-black text-green-400">${downPayment.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-green-300 mt-1">{t('downPaymentNote')}</p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-400 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-blue-300 text-sm">{t('atPickupLabel')}</span>
                        <span className="text-xl font-black text-blue-300">${(remainingPayment + totalDeposit).toFixed(2)}</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-gray-400">
                          <span>{t('remainingRentalLabel')}</span>
                          <span className="text-gray-300">${remainingPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>{t('refundableDepositLabel')}</span>
                          <span className="text-gray-300">${totalDeposit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Terms - Compact */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-2 border-gray-600 text-yellow-400 focus:ring-2 focus:ring-yellow-400/20 cursor-pointer transition-all flex-shrink-0"
                    />
                    <span className="text-gray-300 leading-relaxed text-sm">
                      {t('agreement.prefix')}{' '}
                      <a href="/terms" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline font-semibold">
                        {t('agreement.terms')}
                      </a>{' '}
                      {t('agreement.and')}{' '}
                      <a href="/privacy" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline font-semibold">
                        {t('agreement.privacy')}
                      </a>
                      {t('agreement.suffix')}
                    </span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setCurrentStep(3)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 md:px-8 py-4 md:py-5 bg-gray-700 hover:bg-gray-600 text-white font-bold text-base md:text-lg rounded-2xl transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    <span className="hidden sm:inline">{t('stepBack')}</span>
                  </motion.button>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!acceptedTerms || isSubmitting}
                    whileHover={acceptedTerms && !isSubmitting ? { scale: 1.02 } : {}}
                    whileTap={acceptedTerms && !isSubmitting ? { scale: 0.98 } : {}}
                    className={`flex-1 py-4 md:py-5 font-black text-base md:text-lg rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 ${
                      acceptedTerms && !isSubmitting
                        ? 'bg-gradient-to-r from-green-400 to-green-500 text-gray-900 hover:shadow-green-400/50'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} className='hidden md:block' />
                        {t('stepPayment')} (${downPayment.toFixed(2)})
                        <ChevronRight size={24} />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingPage;