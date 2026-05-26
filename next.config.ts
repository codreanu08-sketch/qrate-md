import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Ignoră erorile de TypeScript și ESLint în timpul build-ului pe Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Redirecționări pentru link-urile vechi (de la review la rate)
  async redirects() {
    return [
      {
        source: '/:locale/review/:slug*',
        destination: '/:locale/rate/:slug*',
        permanent: true, 
      },
    ];
  },
};

export default withNextIntl(nextConfig);