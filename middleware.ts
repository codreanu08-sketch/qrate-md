import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. SEPARARE API: Dacă cererea este pentru o rută API, ignorăm next-intl ca să nu dea 404
  if (pathname.startsWith('/api')) {
    // Pentru API creăm doar un răspuns simplu, nu rulăm handleI18nRouting
    const response = NextResponse.next();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response.cookies.delete({ name, ...options });
          },
        },
      }
    );
    
    await supabase.auth.getUser();
    return response;
  }

  // 2. Rutele normale (Pagini vizuale): Rulăm mai întâi logica pentru limbi (next-intl)
  const handleI18nRouting = createMiddleware(routing);
  const response = handleI18nRouting(request);

  // 3. Creăm clientul Supabase pentru pagini
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // Forțăm citirea sesiunii pentru utilizator
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Un matcher optimizat care protejează rutele și permite rularea corectă pe Vercel
  matcher: [
    // Să se potrivească cu rădăcina site-ului
    '/',
    // Să se potrivească cu toate limbile configurate (ex: /ro, /ru)
    '/(ro|ru)/:path*',
    // Permitem rularea și pe rutele de API, dar fără să le punem prefix de limbă
    '/api/:path*',
    // Excludem fișierele statice
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};