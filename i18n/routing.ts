import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ro', 'ru'],
  defaultLocale: 'ro',
  localePrefix: 'as-needed', 
  
  // Eliminăm traducerile de rute pentru a folosi căile standard
  pathnames: {
    '/': '/',
    '/auth/login': '/auth/login',
    '/auth/register': '/auth/register'
  }
});

export default routing;

export const { Link, redirect, usePathname, useRouter, getPathname } = 
  createNavigation(routing);

export const locales = routing.locales;