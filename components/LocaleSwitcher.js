'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '../navigation';
import { useParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const locales = [
  { code: 'en', name: 'EN', fullName: 'English' },
  { code: 'es', name: 'ES', fullName: 'Español' },
  { code: 'pt', name: 'PT', fullName: 'Português' },
  { code: 'fr', name: 'FR', fullName: 'Français' }
];

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function handleChange(nextLocale) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-2">
      <Globe size={18} className="text-gray-400" aria-hidden="true" />
      <div className="flex gap-1" role="group" aria-label="Language">
        {locales.map((locale) => (
          <motion.button
            key={locale.code}
            type="button"
            onClick={() => handleChange(locale.code)}
            aria-pressed={params.locale === locale.code}
            aria-label={locale.fullName}
            lang={locale.code}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition duration-200 ${
              params.locale === locale.code
                ? 'bg-yellow-400 text-gray-900'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title={locale.fullName}
          >
            {locale.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}