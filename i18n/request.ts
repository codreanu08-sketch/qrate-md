import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async (params: any) => {
  // Extragem dinamic oricare dintre cele două proprietăți folosite de next-intl în funcție de versiune
  const requestLocale = params?.requestLocale || params?.locale;
  
  // Așteptăm parametrul locale (deoarece poate fi un Promise în Next.js 15+)
  let locale = await requestLocale;

  // Dacă locale este invalid sau lipsește, folosim limba default din routing
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale, // Obligatoriu pentru compatibilitate
    messages: (await import(`../messages/${locale}.json`)).default
  };
});