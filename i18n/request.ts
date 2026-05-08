import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Poți defini aici limbile suportate pentru extra siguranță
const locales = ['ro', 'en'];

export default getRequestConfig(async ({ locale }) => {
  // Validăm dacă locale-ul primit este suportat
  if (!locale || !locales.includes(locale as string)) {
    notFound();
  }

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});