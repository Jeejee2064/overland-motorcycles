import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"

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
          alt: 'Royal Enfield Himalayan 450cc - Motorcycle Rentals in Panama',
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

  // LocalBusiness Schema with complete info
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}#organization`,
    name: 'Overland Motorcycles',
    description: 'Your trusted partner for motorcycle adventures in Panama. Experience the freedom of the open road with our premium Royal Enfield Himalayan 450cc fleet.',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512
    },
    image: [
      `${baseUrl}/og-image.jpg`,
      `${baseUrl}/royal-enfield-himalayan.png`
    ],
    telephone: '+507-6805-1100',
    email: 'overlandmotorcycles@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Local 1 - Edificio Antigua Domingo, Plaza Santa Ana',
      addressLocality: 'Panama City',
      addressCountry: 'PA'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 8.982379,
      longitude: -79.519870
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
        closes: '00:00'
      }
    ],
    priceRange: '$280-$1800',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    areaServed: [
      {
        '@type': 'Country',
        name: 'Panama'
      },
      {
        '@type': 'State',
        name: 'Chiriquí Province'
      }
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '24'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Reservations',
      telephone: '+507-6805-1100',
      email: 'overlandmotorcycles@gmail.com',
      availableLanguage: ['English', 'Spanish', 'Portuguese', 'French'],
      areaServed: 'PA'
    }
  };

  // Product Schema for Royal Enfield Himalayan 450cc
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}#himalayan450`,
    name: 'Royal Enfield Himalayan 450cc Rental',
    description: 'Premium Royal Enfield Himalayan 450cc adventure motorcycle rental in Panama. Perfect for exploring Panama\'s mountains, beaches, and rainforests. Includes helmet, side cases, top case, and phone mount.',
    image: `${baseUrl}/royal-enfield-himalayan.png`,
    brand: {
      '@type': 'Brand',
      name: 'Royal Enfield'
    },
    model: 'Himalayan 450cc',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '24'
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '280',
      highPrice: '1800',
      offerCount: '4',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-12-31',
      seller: {
        '@id': `${baseUrl}#organization`
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Daily Rental (1-2 days)',
          price: '280',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Weekly Rental (7 days)',
          price: '899',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Two Week Rental (14 days)',
          price: '1420',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Three Week Rental (21 days)',
          price: '1800',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        }
      ]
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Engine Size',
        value: '450cc'
      },
      {
        '@type': 'PropertyValue',
        name: 'Includes Helmet',
        value: 'Yes'
      },
      {
        '@type': 'PropertyValue',
        name: 'Includes Luggage',
        value: 'Side cases and top case included'
      },
      {
        '@type': 'PropertyValue',
        name: 'Phone Mount',
        value: 'Included'
      },
      {
        '@type': 'PropertyValue',
        name: 'Fleet Size',
        value: '4 motorcycles'
      }
    ]
  };

  // Service Schema for Motorcycle Rental
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${baseUrl}#service`,
    serviceType: 'Motorcycle Rental',
    name: 'Royal Enfield Himalayan 450cc Rental Service',
    description: 'Premium motorcycle rental service in Panama. Rent Royal Enfield Himalayan 450cc adventure bikes with all equipment included.',
    provider: {
      '@id': `${baseUrl}#organization`
    },
    areaServed: {
      '@type': 'Country',
      name: 'Panama'
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${baseUrl}/Booking`,
      servicePhone: '+507-6805-1100',
      availableLanguage: ['English', 'Spanish', 'Portuguese', 'French']
    },
    termsOfService: `${baseUrl}/terms`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '280',
      highPrice: '1800'
    }
  };

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    url: baseUrl,
    name: 'Overland Motorcycles Panama',
    description: t('description'),
    publisher: {
      '@id': `${baseUrl}#organization`
    },
    inLanguage: ['en', 'es', 'pt', 'fr'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  // FAQ Schema for common questions
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What motorcycle models do you rent?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We rent Royal Enfield Himalayan 450cc adventure motorcycles. We have a fleet of 4 bikes, all 2024 models.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is included in the rental?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every rental includes: driver and passenger helmets, side cases, top case, and phone mount. All equipment is included in the rental price.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does it cost to rent a motorcycle?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Rental prices range from $280 USD for 1-2 days to $1,800 USD for 21 days. Weekly rentals (7 days) are $899 USD. All prices include helmet, luggage cases, and phone mount.'
        }
      },
      {
        '@type': 'Question',
        name: 'Where are you located?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We are located in Panama City at Local 1 - Edificio Antigua Domingo, Plaza Santa Ana. Our opening hours are Monday to Friday 10:00 AM - 6:00 PM, and weekends by appointment.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I explore all of Panama with the rental?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Our Royal Enfield Himalayan 450cc motorcycles are perfect for exploring Panama\'s diverse landscapes including beaches, mountains, rainforests, and coastlines.'
        }
      }
    ]
  };

  // Breadcrumb Schema
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
        
        {/* Geographic SEO */}
        <meta name="geo.region" content="PA" />
        <meta name="geo.placename" content="Panama City" />
        <meta name="geo.position" content="8.982379;-79.519870" />
        <meta name="ICBM" content="8.982379, -79.519870" />
        
        {/* Business Information */}
        <meta property="business:contact_data:street_address" content="Local 1 - Edificio Antigua Domingo, Plaza Santa Ana" />
        <meta property="business:contact_data:locality" content="Panama City" />
        <meta property="business:contact_data:country_name" content="Panama" />
        <meta property="business:contact_data:email" content="overlandmotorcycles@gmail.com" />
        <meta property="business:contact_data:phone_number" content="+507-6805-1100" />
        
        {/* Favicons and Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://wa.me" />
        
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        
        {/* Product Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        
        {/* Service Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        
        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
          <Analytics/>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}