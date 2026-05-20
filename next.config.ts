import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Lăsăm funcția goală. next-intl va căuta automat folderul i18n/
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* alte configurări native dacă ai nevoie */
};

export default withNextIntl(nextConfig);