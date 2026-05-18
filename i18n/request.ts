import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['ro', 'ru'];

export default getRequestConfig(async (request) => {
  // Așteptăm rezolvarea request-ului și extragem proprietatea locale ca string garantat
  const currentLocale = (await request).locale as string;

  // Dacă limba detectată nu se află în lista noastră, aruncăm 404
  if (!locales.includes(currentLocale)) {
    notFound();
  }

  return {
    locale: currentLocale,
    messages: (await import(`../messages/${currentLocale}.json`)).default
  };
});