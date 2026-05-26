import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Lăsăm funcția goală. next-intl va căuta automat folderul i18n/
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* alte configurări native dacă ai nevoie */
  
  async redirects() {
    return [
      {
        // Interceptează link-urile vechi de pe QR code: /ro/review/id sau /ru/review/id
        source: '/:locale/review/:slug*',
        // Le trimite automat și transparent către folderul tău activ: /ro/rate/id sau /ru/rate/id
        destination: '/:locale/rate/:slug*',
        // permanent: true îi spune browserului (și Google-ului) că redirect-ul este definitiv (cod HTTP 308)
        permanent: true, 
      },
    ];
  },
};

export default withNextIntl(nextConfig);