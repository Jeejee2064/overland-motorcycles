import { getRequestConfig } from 'next-intl/server';
import { routing } from '../routing';

// Tours copy exists in en/es/fr; other locales (pt) fall back to the English copy.
const TOURS_LOCALES = ['en', 'es', 'fr', 'pt'];

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  const toursLocale = TOURS_LOCALES.includes(locale) ? locale : 'en';

  return {
    locale,
    messages: {
      ...(await import(`../messages/${locale}.json`)).default,
      Tours: (await import(`../messages/tours.${toursLocale}.json`)).default,
    }
  };
});
