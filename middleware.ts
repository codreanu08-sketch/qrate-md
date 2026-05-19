import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Configurația pentru limbi (next-intl)
const intlMiddleware = createMiddleware({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  localePrefix: 'always' // Forțează prefixul /ro/ sau /ru/ în URL
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignoră fișierele statice, imaginile, api-ul și supabase ca să nu facă buclă
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Lasă next-intl să se ocupe de rutare și limbi
  return intlMiddleware(request);
}

// Configul obligatoriu pentru a intercepta toate rutele din aplicație
export const config = {
  matcher: ['/((?!_next|api|.*\\.).*)'],
};