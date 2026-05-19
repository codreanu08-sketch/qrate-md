import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const locales = ['ro', 'en'];
const defaultLocale = 'ro';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Inițializăm clientul Supabase în Middleware pentru actualizarea cookie-urilor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xtsecrskyoswwulkhgll.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0c2VjcnNreW9zd3d1bGtoZ2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE0MzUsImV4cCI6MjA5MzYyNzQzNX0.FdNFWdUPfrjTd1xTX_FdHuzcNtekh3SWXvGhjWvkn8E',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Reîmprospătăm sesiunea Supabase (important pentru login stabil)
  await supabase.auth.getUser();

  // 2. Logica de Redirecționare pentru Limbi (i18n)
  const { pathname } = request.nextUrl;
  
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Dacă lipsește /ro sau /en, îl redirecționăm adăugând limba implicită
    url.pathname = `/${defaultLocale}${pathname}`;
    
    // Păstrăm cookie-urile Supabase în timpul redirecționării
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  // Ignorăm fișierele statice, imaginile și rutele API
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest|.*\\..*).*)',
  ],
};