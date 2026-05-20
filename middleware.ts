// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing'; // Sau '@/i18n/routing' dacă folosești alias-ul

export default createMiddleware(routing);

export const config = {
  // Matcher-ul tău excelent care prinde tot, mai puțin resursele statice
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};