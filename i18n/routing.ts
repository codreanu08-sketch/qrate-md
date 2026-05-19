// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ro'],
  defaultLocale: 'ro',
  localePrefix: 'never',           // ← cea mai simplă variantă
});

export const { Link, redirect, usePathname, useRouter, getPathname } = 
  createNavigation(routing);

export const locales = routing.locales;
export default routing;