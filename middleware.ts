import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Limbile suportate de aplicație
  locales: ['ro', 'ru'],
  
  // Limba implicită dacă nu este specificată niciuna în URL
  defaultLocale: 'ro',
  
  // Forțează prefixul /ro sau /ru în browser
  localePrefix: 'always'
});

export const config = {
  // Matcher-ul oficial next-intl care acoperă perfect toate cazurile de producție
  matcher: ['/', '/(ro|ru)/:path*', '/((?!_next|_vercel|api|.*\\..*).*)']
};