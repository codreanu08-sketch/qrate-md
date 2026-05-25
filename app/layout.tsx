// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QRate.md - Feedback Platform',
  description: 'Platformă de feedback și recenzii pentru afaceri',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}