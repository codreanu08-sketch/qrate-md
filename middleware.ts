import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Verificăm dacă ruta este protejată (ex: începe cu /ro/dashboard)
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/ro/dashboard'); // Ajustează după ruta ta
  
  // 2. Creăm clientul Supabase pentru a verifica sesiunea
  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // 3. Logică: Dacă e rută protejată și nu există sesiune -> Redirecționare
  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL('/ro/auth/login', request.url));
  }

  // 4. Dacă totul e ok, lăsăm i18n să își facă treaba
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};