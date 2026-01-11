import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import WhatsApp from '@/components/Whatsapp';
const locales = ['en', 'es', 'pt', 'fr'];

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const currentUrl = locale === 'en' ? baseUrl : `${baseUrl}/${locale}`;
  
  const keywords = t.raw('keywords');
  
  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('title')
    },
    description: t('description'),
    metadataBase: new URL(baseUrl),
    keywords: keywords,
    authors: [{ name: 'Overland Motorcycles' }],
    creator: 'Overland Motorcycles',
    publisher: 'Overland Motorcycles',
    alternates: {
      canonical: currentUrl,
      languages: {
        'en-US': '/',
        'es-ES': '/es',
        'pt-BR': '/pt', 
        'fr-FR': '/fr',
        'x-default': '/'
      }
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: currentUrl,
      siteName: 'Overland Motorcycles',
      locale: getOpenGraphLocale(locale),
      type: 'website',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Overland Motorcycles - Royal Enfield Himalayan Rentals in Panama',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og-image.jpg'],
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
    verification: {
      google: 'your-google-verification-code',
    },
    category: 'motorcycle rentals',
    other: {
      'og:locale:alternate': getAlternateLocales(locale)
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

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Enhanced JSON-LD structured data for maximum SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}#organization`,
    name: 'Overland Motorcycles',
    description: 'Your trusted partner for motorcycle adventures in Panama. Experience the freedom of the open road with our premium Royal Enfield Himalayan fleet.',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512
    },
    image: `${baseUrl}/og-image.jpg`,
    telephone: '+507-6805-1100',
    email: 'overlandmotorcycles@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Local 1 - Edificio Antigua Domingo, Plaza Santa Ana',
      addressLocality: 'Panama City',
      addressRegion: 'Panama',
      addressCountry: 'PA'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 8.9823792,
      longitude: -79.5198696
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '00:00',
        closes: '00:00',
        description: 'By appointment'
      }
    ],
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card',
    areaServed: {
      '@type': 'Country',
      name: 'Panama'
    },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 8.9823792,
        longitude: -79.5198696
      },
      geoRadius: '500000'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Motorcycle Rental Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: 'Royal Enfield Himalayan 411cc Rental',
            description: 'Premium adventure motorcycle rental for exploring Panama',
            brand: {
              '@type': 'Brand',
              name: 'Royal Enfield'
            },
            model: 'Himalayan 411cc'
          }
        }
      ]
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        telephone: '+507-6805-1100',
        email: 'overlandmotorcycles@gmail.com',
        availableLanguage: ['English', 'Spanish', 'Portuguese', 'French'],
        areaServed: 'PA'
      }
    ],
    sameAs: [
      'https://www.facebook.com/overlandmotorcyclespanama',
      'https://www.instagram.com/overlandmotorcyclespanama'
    ]
  };

  // Website schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    url: baseUrl,
    name: 'Overland Motorcycles',
    description: t('description'),
    publisher: {
      '@id': `${baseUrl}#organization`
    },
    inLanguage: ['en', 'es', 'pt', 'fr'],
    
  };

  // Service schema
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${baseUrl}#service`,
    serviceType: 'Motorcycle Rental',
    provider: {
      '@id': `${baseUrl}#organization`
    },
    areaServed: {
      '@type': 'Country',
      name: 'Panama'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Motorcycle Rentals',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Daily Motorcycle Rental',
            description: 'Rent a Royal Enfield Himalayan by the day'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Weekly Motorcycle Rental',
            description: 'Rent a Royal Enfield Himalayan by the week'
          }
        }
      ]
    }
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      }
    ]
  };

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="geo.region" content="PA" />
        <meta name="geo.placename" content="Panama City" />
        <meta name="geo.position" content="8.9823792;-79.5198696" />
        <meta name="ICBM" content="8.9823792, -79.5198696" />
        
        {/* Favicons and Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        
        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        
        {/* Service Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        
        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <WhatsApp />
          <Analytics/>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}