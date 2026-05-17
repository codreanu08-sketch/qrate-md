import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default async function middleware(request: NextRequest) {
  // 1. Rulăm mai întâi logica pentru limbi (next-intl)
  const handleI18nRouting = createMiddleware(routing);
  let response = handleI18nRouting(request);

  // 2. Creăm clientul Supabase într-un mod izolat, compatibil cu Edge
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          // Actualizăm cookie-urile în request ca să fie disponibile în Server Components
          request.cookies.set({ name, value, ...options });
          // Le injectăm și în răspunsul primit de la next-intl
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value, ...options });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // 3. Forțăm citirea sesiunii (actualizează token-urile expirate în fundal)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Un matcher curat care evită fișierele statice și rutele interne Next.js
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};