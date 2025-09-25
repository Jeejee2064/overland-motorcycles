import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'es', 'pt', 'fr'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `localePrefix` setting controls whether a locale prefix is shown for
  // the default locale. Setting this to `as-needed` will hide the prefix for
  // the default locale and only show it for other locales.
  localePrefix: 'as-needed'
});