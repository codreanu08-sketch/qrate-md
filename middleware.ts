import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  localePrefix: 'always'        // rămânem cu always cum ai tu
});

export const config = {
  // Matcher îmbunătățit - asta rezolvă majoritatea problemelor pe Vercel
  matcher: [
    // Match all pathnames except for
    // - … (files with a dot in the name, e.g. favicon.ico)
    // - … (Next.js internal paths)
    '/((?!_next|_vercel|api|.*\\..*).*)'
  ]
};