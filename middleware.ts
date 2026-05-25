import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Verificăm dacă e rută de dashboard (indiferent de limbă)
  const isDashboardRoute = pathname.includes('/dashboard');

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

  // Dacă e dashboard și nu e logat → login
  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL('/ro/auth/login', request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};