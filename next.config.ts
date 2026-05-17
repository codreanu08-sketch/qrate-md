import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Plugin-ul next-intl creează un wrapper peste configurația Next.js.
 * Calea trebuie să fie către 'i18n/request.ts' deoarece acesta este 
 * punctul de intrare pentru configurarea mesajelor pe server.
 */
const withNextIntl = createNextIntlPlugin(
  './i18n/request.ts' 
);

const nextConfig: NextConfig = {
  /* Opțiuni de configurare standard Next.js */
  reactStrictMode: true,
  // Dacă ai imagini externe (ex: de la Supabase storage), adaugă domeniile aici
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);