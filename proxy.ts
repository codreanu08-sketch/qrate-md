// proxy.ts (în rădăcina proiectului)
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Limbile oficiale suportate de QRate.MD
  locales: ['ro', 'ru'],
  
  // Limba implicită spre care va fi trimis utilizatorul
  defaultLocale: 'ro',

  // Forțăm adăugarea prefixului în URL (/ro) ca să nu existe confuzii de pagini statice
  localePrefix: 'always'
});

export const config = {
  // Un matcher mai robust care protejează fișierele statice, dar prinde absolut tot restul
  matcher: [
    // Prinde rădăcina site-ului
    '/',
    // Prinde toate rutele care încep cu /ro sau /ru
    '/(ro|ru)/:path*',
    // Prinde restul paginilor interne dar exclude folderele de sistem ale Next.js și Vercel
    '/((?!api|_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'
  ]
};