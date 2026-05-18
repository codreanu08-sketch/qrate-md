// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro'
});

export const config = {
  // Prinde toate rutele pentru limbi, dar ignoră fișierele interne Next.js și imaginile
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};