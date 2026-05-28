// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/auth/login': '/auth/login',
    '/auth/register': '/auth/register',
    '/auth/update-password': '/auth/update-password',
    '/dashboard': '/dashboard',
    '/dashboard/analytics': '/dashboard/analytics',
    '/dashboard/locations': '/dashboard/locations',
    '/dashboard/employees': '/dashboard/employees',
    '/dashboard/reviews': '/dashboard/reviews',
    '/dashboard/subscription': '/dashboard/subscription',
    '/dashboard/settings': '/dashboard/settings',
    '/terms': '/terms',
    '/privacy': '/privacy',
    '/refund': '/refund',
  }
});

export const { Link, redirect, usePathname, useRouter, getPathname } = 
  createNavigation(routing);

export const locales = routing.locales;
export default routing;