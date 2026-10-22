import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock, MapPin, Bike, Flag, Check, X, Plus } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TourCard from '@/components/TourCard';
import TourMapLoader from '@/components/TourMapLoader';
import TourWhatsAppButton from '@/components/TourWhatsAppButton';
import { Link } from '@/navigation';
import { ROUTE_LEGS } from '@/lib/tour-routes';
import { TOUR_IMAGES } from '@/lib/tour-images';
import { TOURS, PLACES, getTourBySlug, formatPrice, whatsappLink } from '@/lib/tours';
import {
  BASE_URL,
  buildMetadata,
  breadcrumbSchema,
  faqSchema,
  localizedPath,
} from '@/lib/tours-seo';
import { routing } from '@/routing';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    TOURS.map((tour) => ({ locale, slug: tour.slug }))
  );
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) return {};

  const t = await getTranslations({ locale, namespace: 'Tours' });
  return buildMetadata({
    locale,
    path: `/motorcycle-tours/${tour.slug}`,
    title: t(`items.${tour.id}.metaTitle`),
    description: t(`items.${tour.id}.metaDescription`),
    keywords: t(`items.${tour.id}.keywords`),
    siteName: t('meta.siteName'),
    image: tour.image,
  });
}

export default async function TourPage({ params }) {
  const { locale, slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour || !routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Tours' });
  const item = (key) => t(`items.${tour.id}.${key}`);
  const name = item('name');
  const days = t.raw(`items.${tour.id}.days`);
  const highlights = t.raw(`items.${tour.id}.highlights`);
  const faq = t.raw(`items.${tour.id}.faq`);
  const included = t.raw('common.includedList').map((line) =>
    line.replace('{nights}', tour.nights)
  );
  const notIncluded = t.raw('common.notIncludedList');
  const optional = t.raw('common.optionalList');
  const waHref = whatsappLink(t('common.waMessage', { name, days: tour.days }));
  const gallery = TOUR_IMAGES[tour.id] ?? [];
  const pagePath = `/motorcycle-tours/${tour.slug}`;
  const pageUrl = `${BASE_URL}${localizedPath(locale, pagePath)}`;

  const tripSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: item('metaTitle'),
    description: item('metaDescription'),
    url: pageUrl,
    image: [tour.image, ...gallery.map((photo) => photo.src)].map((src) => `${BASE_URL}${src}`),
    touristType: 'Motorcycle adventure',
    inLanguage: locale,
    itinerary: {
      '@type': 'ItemList',
      itemListElement: days.map((day, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${t('common.day')} ${index + 1}: ${day.title}`,
        description: day.body,
      })),
    },
    provider: { '@type': 'Organization', name: 'Overland Motorcycles', url: BASE_URL },
    offers: {
      '@type': 'Offer',
      price: tour.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
  };
  const schemas = [
    tripSchema,
    faqSchema(faq),
    breadcrumbSchema([
      { name: t('common.breadcrumbHome'), path: localizedPath(locale, '/') },
      { name: t('common.breadcrumbTours'), path: localizedPath(locale, '/motorcycle-tours') },
      { name, path: localizedPath(locale, pagePath) },
    ]),
  ];

  const facts = [
    { icon: Clock, label: t('common.duration'), value: `${t('common.daysCount', { days: tour.days })} · ${t('common.nightsCount', { nights: tour.nights })}` },
    { icon: MapPin, label: t('common.route'), value: item('route') },
    { icon: Bike, label: t('common.motorcycle'), value: t('common.bike') },
    { icon: Flag, label: t('common.startEnd'), value: t('common.startEndValue') },
  ];
  const pins = [...new Set(tour.stops)].map((id) => ({
    id,
    label: String(tour.stops.indexOf(id) + 1),
    ...PLACES[id],
    name: t(`places.${id}.name`),
    highlights: t.raw(`places.${id}.highlights`),
  }));
  const legs = tour.stops.slice(1).map((id, index) => ROUTE_LEGS[`${tour.stops[index]}>${id}`]);
  const roads = legs.map((leg) => leg.road);
  const boats = legs.filter((leg) => leg.boat).map((leg) => leg.boat);
  const path = [...roads.flat(), ...boats.flat()];
  const otherTours = TOURS.filter((other) => other.id !== tour.id);

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
          src={tour.image}
          alt={item('metaTitle')}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-300 mb-6">
            <Link href="/motorcycle-tours" className="hover:text-yellow-400 transition-colors">
              {t('common.breadcrumbTours')}
            </Link>
            <span className="mx-2">/</span>
            <span>{t('common.daysCount', { days: tour.days })}</span>
          </nav>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent">
            {name}
          </h1>
          <p className="text-lg md:text-2xl text-white mb-10 max-w-3xl mx-auto">{item('tagline')}</p>
          <TourWhatsAppButton href={waHref} text={t('detail.heroCta')} />
        </div>
      </section>

      {/* Overview */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">{t('detail.overviewTitle')}</h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-10">{item('intro')}</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {facts.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-4 bg-gray-800/30 border border-gray-700/50 rounded-2xl p-5"
              >
                <Icon size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className="text-white font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 bg-gray-800/30 border border-yellow-400/40 rounded-2xl p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">{t('common.from')}</p>
              <p className="text-4xl font-bold text-yellow-400">{formatPrice(tour.price)}</p>
            </div>
            <p className="text-sm text-gray-300 flex-1">{t('common.priceNote')}</p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="pb-20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">{t('detail.galleryTitle')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {gallery.map((photo) => (
                <figure key={photo.src} className="overflow-hidden rounded-2xl bg-gray-800/30 border border-gray-700/50">
                  <div className="relative aspect-[3/2]">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="px-4 py-3 text-xs text-gray-400">
                    <span className="text-gray-200">{photo.alt}</span>
                    {' · '}
                    <a href={photo.url} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">
                      {t('detail.photoCredit', { author: photo.author, license: photo.license })}
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">{t('common.highlightsTitle')}</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-lg text-gray-700">
                <Check size={22} className="text-yellow-500 flex-shrink-0 mt-1" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Itinerary */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-white">{t('common.itineraryTitle')}</h2>
          <ol className="space-y-6">
            {days.map((day, index) => (
              <li key={day.title} className="flex gap-5">
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-xs uppercase text-gray-400">{t('common.day')}</p>
                  <p className="text-3xl font-bold text-yellow-400">{index + 1}</p>
                </div>
                <div className="flex-1 bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{day.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{day.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Map */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">{t('map.title')}</h2>
          <p className="text-gray-300 mb-6">{t('map.subtitle')}</p>
          <TourMapLoader pins={pins} roads={roads} boats={boats} path={path} />
          <p className="text-xs text-gray-400 mt-3">{t('map.note')}</p>
        </div>
      </section>

      {/* Included */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">{t('common.includedTitle')}</h2>
            <ul className="space-y-3">
              {included.map((line) => (
                <li key={line} className="flex items-start gap-3 text-gray-200">
                  <Check size={20} className="text-yellow-400 flex-shrink-0 mt-1" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">{t('common.notIncludedTitle')}</h2>
              <ul className="space-y-3">
                {notIncluded.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-gray-300">
                    <X size={20} className="text-red-400 flex-shrink-0 mt-1" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">{t('common.optionalTitle')}</h2>
              <ul className="space-y-3">
                {optional.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-gray-300">
                    <Plus size={20} className="text-yellow-400 flex-shrink-0 mt-1" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-white">{t('common.faqTitle')}</h2>
          <div className="space-y-6">
            {faq.map((entry) => (
              <div
                key={entry.q}
                className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-3">{entry.q}</h3>
                <p className="text-gray-300 leading-relaxed">{entry.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-yellow-400 to-yellow-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{t('detail.ctaTitle')}</h2>
          <p className="text-lg text-gray-800 mb-8">{t('detail.ctaBody')}</p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-gray-900 text-yellow-400 font-bold text-lg rounded-full shadow-2xl hover:scale-105 transition-transform duration-300"
          >
            {t('common.bookWhatsapp')}
          </a>
        </div>
      </section>

      {/* Other tours */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-white">
            {t('common.otherToursTitle')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTours.map((other) => (
              <TourCard key={other.id} tour={other} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
