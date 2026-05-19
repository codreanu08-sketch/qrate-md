// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';   // ← Important: import din routing.ts

export default createMiddleware(routing);

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};