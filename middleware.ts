import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ✅ Exclude /badge și /rate/demo — fără intl redirect
  if (pathname.startsWith('/badge/') || pathname === '/rate/demo') {
    return NextResponse.next();
  }

  const isDashboardRoute = pathname.includes('/dashboard');

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL('/ro/auth/login', request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // ✅ Adăugat badge și rate la excluderi
  matcher: ['/', '/(ro|ru)/:path*', '/((?!api|badge|rate|_next|_vercel|.*\\..*).*)']
};