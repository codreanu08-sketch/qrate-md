'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, RefreshCw } from 'lucide-react';

export default function DashboardLayout({
  children,
  params: paramsPromise
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const locale = params?.locale || 'ro';
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, created_at')
        .eq('id', user.id)
        .single();

      const isPro = profile?.subscription_tier === 'pro';
      const isTrial = (new Date().getTime() - new Date(profile?.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000);
      
      setHasAccess(isPro || isTrial);
    }
    checkSubscription();
  }, [router, locale]);

  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-2xl w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl mb-6 inline-block ring-8 ring-amber-50/50">
            <Lock size={40} className="stroke-[2.5]" />
          </div>
          <h1 className="font-black text-2xl md:text-3xl text-slate-900 mb-3 tracking-tight">
            Funcționalitate Premium Limitată
          </h1>
          <p className="text-slate-600 font-medium text-base mb-8 max-w-md mx-auto leading-relaxed">
            Accesul la secțiunile de analiză, gestionare angajați și setări avansate este disponibil doar în versiunea **PRO**.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => router.push(`/${locale}/subscription`)} 
              className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg active:scale-[0.98]"
            >
              Upgrade la Planul Pro
            </button>
            <button 
              onClick={() => router.push(`/${locale}/`)} 
              className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Înapoi la Pagina Principală
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}