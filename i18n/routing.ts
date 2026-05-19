// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  localePrefix: 'as-needed',        // esențial pentru ca qrate.md să meargă direct
  pathnames: {
    '/': '/',
    '/auth/login': '/auth/login',
    '/auth/register': '/auth/register'
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