// app/page.tsx (Direct în folderul app)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Împingem utilizatorul pe varianta în română direct din browser
    router.replace('/ro');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>Se încarcă QRate.MD...</p>
    </div>
  );
}