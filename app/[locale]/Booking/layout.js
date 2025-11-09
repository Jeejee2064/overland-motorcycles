import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'es', 'pt', 'fr'];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  
  if (!locales.includes(locale)) notFound();
  
  const t = await getTranslations({ locale, namespace: 'BookingMetadata' });
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const bookingPath = '/Booking';
  const currentUrl = locale === 'en' 
    ? `${baseUrl}${bookingPath}` 
    : `${baseUrl}/${locale}${bookingPath}`;
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'en-US': '/Booking',
        'es-ES': '/es/Booking',
        'pt-BR': '/pt/Booking',
        'fr-FR': '/fr/Booking',
        'x-default': '/Booking'
      }
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: currentUrl,
      siteName: t('siteName'),
      locale: getOpenGraphLocale(locale),
      type: 'website',
      images: [
        {
          url: '/images/royal-enfield-himalayan-450-panama.jpg',
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
      images: ['/images/royal-enfield-himalayan-450-panama.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'og:locale:alternate': getAlternateLocales(locale),
      'geo.region': 'PA-8',
      'geo.placename': 'Panama City',
      'geo.position': '8.9824;-79.5199',
      'ICBM': '8.9824, -79.5199'
    }
  };
}

function getOpenGraphLocale(locale) {
  const localeMap = {
    'en': 'en_US',
    'es': 'es_ES',
    'pt': 'pt_BR',
    'fr': 'fr_FR'
  };
  return localeMap[locale] || 'en_US';
}

function getAlternateLocales(currentLocale) {
  const allLocales = ['en_US', 'es_ES', 'pt_BR', 'fr_FR'];
  return allLocales.filter(loc => loc !== getOpenGraphLocale(currentLocale)).join(', ');
}

export default function BookingLayout({ children }) {
  return children;
}