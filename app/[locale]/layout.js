import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import './globals.css';

const locales = ['en', 'es', 'pt', 'fr'];

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  // Await params to get locale (Next.js 15 requirement)
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  // Dynamic base URL - works in development and production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Current URL based on locale
  const currentUrl = locale === 'en' ? baseUrl : `${baseUrl}/${locale}`;
  
  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('title')
    },
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        'en-US': '/',
        'es-ES': '/es',
        'pt-BR': '/pt', 
        'fr-FR': '/fr',
        'x-default': '/' // For unmatched languages, default to English
      }
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: currentUrl,
      siteName: t('title'),
      locale: getOpenGraphLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
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
    // Structured data for better SEO
    other: {
      'og:locale:alternate': getAlternateLocales(locale)
    }
  };
}

// Helper function to get proper OpenGraph locale format
function getOpenGraphLocale(locale) {
  const localeMap = {
    'en': 'en_US',
    'es': 'es_ES', 
    'pt': 'pt_BR',
    'fr': 'fr_FR'
  };
  return localeMap[locale] || 'en_US';
}

// Helper function to get alternate locales for OG
function getAlternateLocales(currentLocale) {
  const allLocales = ['en_US', 'es_ES', 'pt_BR', 'fr_FR'];
  return allLocales.filter(loc => loc !== getOpenGraphLocale(currentLocale)).join(', ');
}

export default async function RootLayout({ children, params }) {
  // Await params to get locale (Next.js 15 requirement)
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        {/* Additional SEO meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}