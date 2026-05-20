import { getRequestConfig } from 'next-intl/server';

const locales = ['ro', 'ru'];

export default getRequestConfig(async ({ locale }) => {
  // Verificăm simplu dacă limba este în lista noastră
  const currentLocale = locales.includes(locale) ? locale : 'ro';

  return {
    messages: (await import(`../messages/${currentLocale}.json`)).default
  };
});