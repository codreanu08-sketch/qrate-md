// proxy.ts (în rădăcina proiectului)
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Limbile suportate de QRate.MD
  locales: ['ro', 'ru'],
  defaultLocale: 'ro'
});

export const config = {
  // Prinde rădăcina "/" și rutele dinamice, dar ignoră fișierele interne
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};