import { getRequestConfig } from 'next-intl/server';
import { routing } from '../routing';
import { applyPublishedContent } from '@/lib/tours-content';

// Tours copy exists in en/es/fr/pt; unknown locales fall back to the English copy.
const TOURS_LOCALES = ['en', 'es', 'fr', 'pt'];

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  const toursLocale = TOURS_LOCALES.includes(locale) ? locale : 'en';
  const tours = (await import(`../messages/tours.${toursLocale}.json`)).default;

  return {
    locale,
    messages: {
      ...(await import(`../messages/${locale}.json`)).default,
      // Built-in tour copy + whatever was edited and published from /admin/lostoursdeclems.
      Tours: await applyPublishedContent(toursLocale, tours),
    }
  };
});
