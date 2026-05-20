import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro'
});

export const config = {
  // Regex-ul acesta exclude doar resursele statice, restul trece prin el
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};