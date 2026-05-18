/** @type {import('next').NextConfig} */
const nextConfig = {
  // Forțăm Vercel să redirecționeze automat utilizatorii de pe rutele goale pe limba implicită
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ro',
        permanent: false, // Îl lăsăm fals pentru a nu bloca cache-ul browserului în timpul testelor
      },
    ];
  },
};

// Dacă folosești next-intl cu un wrapper (ex: withNextIntl), codul tău ar trebui să arate așa:
// const withNextIntl = require('next-intl/plugin')();
// module.exports = withNextIntl(nextConfig);

module.exports = nextConfig;