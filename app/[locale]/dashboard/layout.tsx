'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
  params: paramsPromise
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const pathname = usePathname();
  const locale = params?.locale || 'ro';

  const [loading, setLoading] = useState(true);
  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  useEffect(() => {
    // TEMPORAR: Dăm acces automat la toți
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // TEMPORAR: Permitem accesul la toată lumea (doar pentru test)
  if (!isSubscriptionPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 w-full md:pl-72">
          <main className="min-h-screen">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 w-full md:pl-72">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}