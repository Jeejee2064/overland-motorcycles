import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { TOURS } from '@/lib/tours';
import TourCard from './TourCard';

// Teaser block linking to the tours hub. `tone` follows the background of the host page.
export default function ToursPromoSection({ tone = 'dark' }) {
  const t = useTranslations('Tours');
  const isDark = tone === 'dark';

  return (
    <section className={`py-20 ${isDark ? 'bg-background' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-500 mb-3">
            {t('promo.eyebrow')}
          </p>
          <h2
            className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDark
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 bg-clip-text text-transparent'
                : 'text-gray-900'
            }`}
          >
            {t('promo.title')}
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('promo.subtitle')}
          </p>
        </div>

        <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 ${isDark ? '' : 'bg-background rounded-[2rem] p-6'}`}>
          {TOURS.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/motorcycle-tours"
            className="inline-block px-8 py-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 font-bold text-lg rounded-full shadow-2xl hover:scale-105 transition-transform duration-300"
          >
            {t('promo.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
