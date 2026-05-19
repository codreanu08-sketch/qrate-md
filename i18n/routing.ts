// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  localePrefix: 'always',                    // ← SCHIMBAT LA ALWAYS (oprește loop-ul)
  pathnames: {
    '/': '/',
    '/auth/login': '/auth/login',
    '/auth/register': '/auth/register',
    '/dashboard': '/dashboard'
  }
});

export const { 
  Link, 
  redirect, 
  usePathname, 
  useRouter, 
  getPathname 
} = createNavigation(routing);

export const locales = routing.locales;
export default routing;