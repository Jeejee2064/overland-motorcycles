'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '../navigation';
import { useParams } from 'next/navigation';

const locales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' }
];

export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function handleChange(event) {
    const nextLocale = event.target.value;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center">
      <label htmlFor="locale-switcher" className="text-sm font-medium text-gray-700">
        {t('label')}:
      </label>
      <select 
        id="locale-switcher"
        value={params.locale} 
        onChange={handleChange}
        className="ml-2 px-3 py-1 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {locales.map((locale) => (
          <option key={locale.code} value={locale.code}>
            {t(locale.code)}
          </option>
        ))}
      </select>
    </div>
  );
}