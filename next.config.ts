import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Specificăm explicit calea către i18n.ts din rădăcină ca să fie citit corect la build
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  /* Aici poți lăsa alte configurări native dacă ai nevoie (ex: images, reactStrictMode etc.) */
};

export default withNextIntl(nextConfig);