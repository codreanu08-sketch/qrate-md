import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  // Păstrăm as-needed pentru ca RO să nu aibă prefix în URL
  localePrefix: 'as-needed', 
  
  // Am adăugat rutele permise pentru ca TypeScript să nu mai blocheze build-ul pe Vercel
  pathnames: {
    '/': '/',
    '/auth/login': '/auth/login',
    '/auth/register': '/auth/register',
    '/dashboard': '/dashboard',
    // Dacă pe viitor ai pagini ca /dashboard/locatii, le adaugi tot aici:
    // '/dashboard/locatii': '/dashboard/locatii'
  }
});

export default routing;

export const { Link, redirect, usePathname, useRouter, getPathname } = 
  createNavigation(routing);

export const locales = routing.locales;