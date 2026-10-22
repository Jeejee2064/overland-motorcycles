import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Users, Package, SlidersHorizontal, Compass } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TourCard from '@/components/TourCard';
import TourWhatsAppButton from '@/components/TourWhatsAppButton';
import { TOURS, whatsappLink } from '@/lib/tours';
import {
  BASE_URL,
  buildMetadata,
  breadcrumbSchema,
  faqSchema,
  localizedPath,
} from '@/lib/tours-seo';
import { routing } from '@/routing';

const HUB_PATH = '/motorcycle-tours';
const WHY_ICONS = [Users, Package, SlidersHorizontal, Compass];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Tours.meta' });

  return buildMetadata({
    locale,
    path: HUB_PATH,
    title: t('hubTitle'),
    description: t('hubDescription'),
    keywords: t('hubKeywords'),
    siteName: t('siteName'),
  });
}

export default async function MotorcycleToursPage({ params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Tours' });
  const faq = t.raw('hub.faq');
  const why = t.raw('hub.why');
  const steps = t.raw('hub.steps');

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('hub.heroTitle'),
    itemListElement: TOURS.map((tour, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: t(`items.${tour.id}.name`),
      url: `${BASE_URL}${localizedPath(locale, `${HUB_PATH}/${tour.slug}`)}`,
    })),
  };
  const schemas = [
    itemListSchema,
    faqSchema(faq),
    breadcrumbSchema([
      { name: t('common.breadcrumbHome'), path: localizedPath(locale, '/') },
      { name: t('common.breadcrumbTours'), path: localizedPath(locale, HUB_PATH) },
    ]),
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Navigation />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24">
        <Image
          src="/hero.webp"
          alt={t('hub.heroTitle')}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
            {t('hub.heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto">
            {t('hub.heroSubtitle')}
          </p>
          <TourWhatsAppButton
            href={whatsappLink(t('common.waMessageInfo'))}
            text={t('common.askWhatsapp')}
          />
        </div>
      </section>

      {/* Intro (SEO copy) */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">{t('hub.introTitle')}</h2>
          <p className="text-lg text-gray-300 leading-relaxed">{t('hub.introBody')}</p>
        </div>
      </section>

      {/* Tours */}
      <section id="tours" className="pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              {t('hub.toursTitle')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t('hub.toursSubtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOURS.map((tour, index) => (
              <TourCard key={tour.id} tour={tour} priority={index < 2} />
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8 max-w-2xl mx-auto">
            {t('common.priceNote')}
          </p>
        </div>
      </section>

      {/* Why Overland */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-gray-900">
            {t('hub.whyTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {why.map((item, index) => {
              const Icon = WHY_ICONS[index];
              return (
                <div key={item.title} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-yellow-400/20 flex items-center justify-center">
                    <Icon size={28} className="text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-white">
            {t('hub.stepsTitle')}
          </h2>
          <ol className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6"
              >
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-yellow-400 text-gray-900 font-bold mb-4">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-300">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Custom tour */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t('hub.customTitle')}</h2>
          <p className="text-lg text-gray-300 mb-8">{t('hub.customBody')}</p>
          <TourWhatsAppButton
            href={whatsappLink(t('common.waMessageCustom'))}
            text={t('hub.customCta')}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
            {t('hub.faqTitle')}
          </h2>
          <div className="space-y-6">
            {faq.map((item) => (
              <div
                key={item.q}
                className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-3">{item.q}</h3>
                <p className="text-gray-300 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
