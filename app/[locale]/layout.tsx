import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "@/app/globals.css";

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Așteptăm parametrul locale din URL
  const { locale } = await params;

  // Verificăm dacă limba din URL este acceptată de aplicație
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Încărcăm fișierul JSON corespunzător (ro.json sau ru.json)
  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}