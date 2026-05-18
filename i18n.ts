import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = ['ro', 'ru'];

export default getRequestConfig(async (context) => {
  // Preluăm locale în siguranță sub formă de string
  const locale = context.locale as string;

  // Verificăm dacă limba din URL este ro sau ru, altfel dăm eroare 404
  if (!locales.includes(locale)) {
    notFound();
  }

  return {
    locale: locale, // Trimitem string-ul curat înapoi
    messages: (await import(`./messages/${locale}.json`)).default
  };
});