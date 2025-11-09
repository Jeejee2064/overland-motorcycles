import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'es', 'pt', 'fr'];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  
  if (!locales.includes(locale)) notFound();
  
  const t = await getTranslations({ locale, namespace: 'ContactMetadata' });
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const contactPath = '/contact';
  const currentUrl = locale === 'en' 
    ? `${baseUrl}${contactPath}` 
    : `${baseUrl}/${locale}${contactPath}`;
  
  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'en-US': '/contact',
        'es-ES': '/es/contact',
        'pt-BR': '/pt/contact',
        'fr-FR': '/fr/contact',
        'x-default': '/contact'
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
      },
    },
    other: {
      'og:locale:alternate': getAlternateLocales(locale),
      'geo.region': 'PA-8',
      'geo.placename': 'Panama City',
      'geo.position': '8.9824;-79.5199',
      'ICBM': '8.9824, -79.5199',
      'contact:phone_number': '+507 6805-1100',
      'contact:email': 'overlandmotorcycles@gmail.com'
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

export default function ContactLayout({ children }) {
  return children;
}