// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

const locales = ['ro', 'ru'];

export default getRequestConfig(async (params) => {
  // Extragem sigur locale și dacă e undefined punem direct 'ro'
  const localeParam = params?.locale || 'ro';
  
  // Verificăm dacă este o limbă validă din lista noastră
  const currentLocale = locales.includes(localeParam) ? localeParam : 'ro';

  return {
    locale: currentLocale,
    messages: (await import(`../messages/${currentLocale}.json`)).default
  };
});