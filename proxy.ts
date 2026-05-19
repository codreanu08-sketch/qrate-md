import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Adăugăm și 'ru' pentru că ai pagini de privacy în rusă în proiect
const locales = ['ro', 'ru', 'en'];
const defaultLocale = 'ro';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xtsecrskyoswwulkhgll.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0c2VjcnNreW9zd3d1bGtoZ2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE0MzUsImV4cCI6MjA5MzYyNzQzNX0.FdNFWdUPfrjTd1xTX_FdHuzcNtekh3SWXvGhjWvkn8E',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const { pathname } = request.nextUrl;
  
  // Verificăm dacă URL-ul are deja o limbă setată corect
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Dacă utilizatorul a scris simplu qrate.md/privacy, îl redirecționăm automat la /ro/privacy
  if (!pathnameHasLocale) {
    url.pathname = `/${defaultLocale}${pathname}`;
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    // Rulează proxy-ul pe toate rutele, mai puțin pe fișiere statice și API-uri
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest|.*\\..*).*)',
  ],
};