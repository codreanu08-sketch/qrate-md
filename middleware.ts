// middleware.ts (în rădăcina proiectului)
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Limbile pe care le folosește QRate.MD
  locales: ['ro', 'ru'],
  // Limba de bază
  defaultLocale: 'ro'
});

export const config = {
  // Acest matcher este cel oficial. El prinde rădăcina "/" și toate sub-rutele, 
  // dar lasă fișierele de sistem (imagini, api) în pace.
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|_next|.*\\..*).*)']
};