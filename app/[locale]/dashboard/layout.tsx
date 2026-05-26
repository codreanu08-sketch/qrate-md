'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
     
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      // Acces automat pentru toți userii logați
      setLoading(false);
    };

    checkUser();
  }, [router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 md:pl-72">
        <main>{children}</main>
      </div>
    </div>
  );
}