// middleware.ts (în rădăcina proiectului, lângă next.config.ts)
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Lista tuturor limbilor suportate de QRate
  locales: ['ro', 'ru'],
  
  // Limba implicită dacă cineva intră pe qrate.md direct
  defaultLocale: 'ro',

  // Nu adăuga prefixul de limbă dacă utilizatorul e deja pe limba implicită (opțional, dar curat)
  localePrefix: 'as-needed'
});

export const config = {
  // Matcher-ul oficial: prinde rădăcina și rutele, dar ignoră fișierele statice și API-ul
  matcher: [
    '/', 
    '/(ro|ru)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};