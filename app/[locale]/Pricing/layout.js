import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'es', 'pt', 'fr'];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  
  if (!locales.includes(locale)) notFound();
  
  const t = await getTranslations({ locale, namespace: 'PricingMetadata' });
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const pricingPath = '/Pricing';
  const currentUrl = locale === 'en' 
    ? `${baseUrl}${pricingPath}` 
    : `${baseUrl}/${locale}${pricingPath}`;
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'en-US': '/Pricing',
        'es-ES': '/es/Pricing',
        'pt-BR': '/pt/Pricing',
        'fr-FR': '/fr/Pricing',
        'x-default': '/Pricing'
      }
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: currentUrl,
      siteName: t('siteName'),
      locale: getOpenGraphLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
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

export default function PricingLayout({ children }) {
  return children;
}