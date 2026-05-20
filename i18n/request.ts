// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

const locales = ['ro', 'ru'];

export default getRequestConfig(async ({ locale }) => {
  // Validăm limba
  const currentLocale = locales.includes(locale) ? locale : 'ro';

  return {
    // ADAUGĂM LINIA ASTA (TypeScript o cere neapărat):
    locale: currentLocale,
    messages: (await import(`../messages/${currentLocale}.json`)).default
  };
});