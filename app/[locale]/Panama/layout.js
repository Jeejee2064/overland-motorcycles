import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'es', 'pt', 'fr'];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  
  if (!locales.includes(locale)) notFound();
  
  const t = await getTranslations({ locale, namespace: 'PanamaMetadata' });
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const panamaPath = '/Panama';
  const currentUrl = locale === 'en' 
    ? `${baseUrl}${panamaPath}` 
    : `${baseUrl}/${locale}${panamaPath}`;
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'en-US': '/Panama',
        'es-ES': '/es/Panama',
        'pt-BR': '/pt/Panama',
        'fr-FR': '/fr/Panama',
        'x-default': '/Panama'
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
          url: '/images/panama-motorcycle-adventure.jpg',
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
      images: ['/images/panama-motorcycle-adventure.jpg'],
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
      'geo.region': 'PA',
      'geo.placename': 'Panama',
      'geo.position': '8.5380;-80.7821',
      'ICBM': '8.5380, -80.7821'
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

export default function PanamaLayout({ children }) {
  return children;
}