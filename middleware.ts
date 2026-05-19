import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Configurația de bază pentru next-intl
const intlMiddleware = createMiddleware({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  localePrefix: 'always' // Forțează prefixul /ro/ sau /ru/ în URL-ul din browser
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. Ignoră fișierele statice, rutele API și procesele interne ca să eviți buclele infinite (infinite loops)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 3. Permite next-intl să gestioneze redirecționarea de limbă pentru restul paginilor
  return intlMiddleware(request);
}

// 4. Matcher-ul obligatoriu pentru a intercepta toate rutele din aplicație
export const config = {
  matcher: ['/((?!_next|api|.*\\.).*)'],
};