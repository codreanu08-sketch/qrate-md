'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, RefreshCw } from 'lucide-react';
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
  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) {
        router.push(`/${locale}/auth/login`);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const { hasAccess } = await res.json();
        setHasAccess(!!hasAccess);
      } catch {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <RefreshCw className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!hasAccess && !isSubscriptionPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md">
          <Lock className="mx-auto mb-4 text-amber-500" size={48} />
          <h2 className="text-2xl font-black mb-3">Trial Expirat</h2>
          <p className="text-slate-600 mb-6">Perioada de 7 zile gratuită s-a încheiat.</p>
          <button 
            onClick={() => router.push(`/${locale}/dashboard/subscription`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black transition-colors"
          >
            Vezi Planuri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="md:pl-[272px] pt-[60px] md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}