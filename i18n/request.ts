// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

const locales = ['ro', 'ru'];

export default getRequestConfig(async ({ locale }) => {
  // Îi garantăm lui TypeScript că rezultatul va fi STRICT un string din listă sau 'ro'
  const currentLocale = (locales.includes(locale) ? locale : 'ro') as string;

  return {
    locale: currentLocale,
    messages: (await import(`../messages/${currentLocale}.json`)).default
  };
});