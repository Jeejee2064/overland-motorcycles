import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Clock, Moon, ArrowUpRight } from 'lucide-react';
import { Link } from '@/navigation';
import { formatPrice, whatsappLink } from '@/lib/tours';
import TourWhatsAppButton from './TourWhatsAppButton';

export default function TourCard({ tour, priority = false }) {
  const t = useTranslations('Tours');
  const name = t(`items.${tour.id}.name`);
  const href = `/motorcycle-tours/${tour.slug}`;
  const waHref = whatsappLink(t('common.waMessage', { name, days: tour.days }));

  return (
    <article className="group flex flex-col bg-gray-800/40 border border-gray-700/50 rounded-3xl overflow-hidden backdrop-blur-sm hover:border-yellow-400/60 transition-colors duration-300">
      <Link href={href} className="block relative aspect-[4/3] overflow-hidden">
        <Image
          src={tour.image}
          alt={t(`items.${tour.id}.metaTitle`)}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-yellow-400 text-gray-900 text-sm font-bold px-3 py-1 rounded-full">
          <Clock size={14} />
          {t('common.daysCount', { days: tour.days })}
        </span>
      </Link>

      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          <Link href={href} className="hover:text-yellow-400 transition-colors">
            {name}
          </Link>
        </h3>
        <p className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
          <Moon size={14} className="text-yellow-400" />
          {t('common.nightsCount', { nights: tour.nights })}
        </p>
        <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
          {t(`items.${tour.id}.route`)}
        </p>

        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{t('common.from')}</p>
            <p className="text-3xl font-bold text-yellow-400">{formatPrice(tour.price)}</p>
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-200 hover:text-yellow-400 transition-colors"
          >
            {t('common.viewTour')}
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <TourWhatsAppButton href={waHref} text={t('common.bookWhatsapp')} />
      </div>
    </article>
  );
}
