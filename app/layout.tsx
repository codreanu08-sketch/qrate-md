import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Qrate.md - Recenzii prin QR',
  description: 'Platforma inteligentă de recenzii pentru afaceri',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}