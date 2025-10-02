'use client'
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Shield, Lock, FileText, Mail } from 'lucide-react';

import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';

const PrivacyPage = () => {
  const t = useTranslations('PrivacyPage');

  const privacySections = [
    {
      icon: Lock,
      title: t('section1Title'),
      content: t('section1Content'),
    },
    {
      icon: FileText,
      title: t('section2Title'),
      content: t('section2Content'),
    },
    {
      icon: Shield,
      title: t('section3Title'),
      content: t('section3Content'),
    },
    {
      icon: Mail,
      title: t('section4Title'),
      content: t('section4Content'),
    },
  ];

  // Placeholder for translation keys
  /*
  "PrivacyPage": {
    "heroTitle": "Política de Privacidad",
    "heroSubtitle": "Tu información es importante. Entiende cómo la recopilamos y la protegemos.",
    "lastUpdated": "Última Actualización: 01 de Octubre, 2025",
    "section1Title": "1. Información que Recopilamos",
    "section1Content": "Recopilamos información personal necesaria para el proceso de alquiler, incluyendo tu nombre, dirección, número de teléfono, correo electrónico, copia de la licencia de conducir y detalles de pago. Esta información es esencial para procesar la reserva y cumplir con los requisitos legales.",
    "section2Title": "2. Uso de la Información",
    "section2Content": "Utilizamos tu información para: (a) Procesar y confirmar tu reserva de motocicleta. (b) Gestionar la fianza y el proceso de devolución. (c) Cumplir con obligaciones legales y de seguros. (d) Comunicarnos contigo sobre tu alquiler o promociones futuras (si has dado tu consentimiento).",
    "section3Title": "3. Seguridad y Almacenamiento",
    "section3Content": "Tomamos medidas de seguridad técnicas y organizativas razonables para proteger tu información personal contra el acceso no autorizado, la divulgación, la alteración o la destrucción. Tu información es almacenada de forma segura.",
    "section4Title": "4. Contacto",
    "section4Content": "Si tienes alguna pregunta sobre esta política de privacidad, por favor contáctanos en nuestro correo electrónico oficial.",
    "termsLink": "Términos y Condiciones"
  }
  */

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      
      {/* Hero Section - DARK BACKGROUND */}
      <section className="relative h-[40vh] bg-background flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/moto2.webp"
            alt="Privacy Policy Background"
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

      {/* Privacy Content Section - WHITE BACKGROUND */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm text-gray-500 text-center mb-10"
          >
            {t('lastUpdated')}
          </motion.p>

          {/* Privacy Sections */}
          <div className="space-y-8">
            {privacySections.map((item, index) => (
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
              {t('section3Content')}
            </p>
            <Link 
              href="/terms"
              className="text-lg font-semibold text-gray-900 hover:text-yellow-400 transition-colors underline"
            >
              {t('termsLink')}
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;