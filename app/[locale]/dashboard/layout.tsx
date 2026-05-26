'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, RefreshCw } from 'lucide-react';
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
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  useEffect(() => {
    let isMounted = true;

    async function checkSecurity() {
      try {
        setLoading(true);

        // 1. Verificăm sesiunea
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          if (isMounted) router.push(`/${locale}/login`);
          return;
        }

        // 2. Verificăm doar profilul și dreptul de acces
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_tier, trial_started_at, trial_ends_at')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!isMounted) return;
        if (profileError) console.error("Eroare Supabase Profiles:", profileError);

        if (profile) {
          const isPro = profile.subscription_tier === 'pro';
          let isTrial = false;

          if (profile.trial_ends_at) {
            isTrial = new Date(profile.trial_ends_at).getTime() > Date.now();
          } else if (profile.trial_started_at) {
            const trialDate = new Date(profile.trial_started_at).getTime();
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            isTrial = (Date.now() - trialDate) < sevenDaysInMs;
          } else {
            isTrial = true; 
          }

          setHasAccess(isPro || isTrial);
        } else {
          setHasAccess(false);
        }

      } catch (err) {
        console.error("Eroare critică în DashboardLayout:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkSecurity();

    return () => {
      isMounted = false;
    };
  }, [pathname, locale, isSubscriptionPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!hasAccess && !isSubscriptionPage) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-2xl w-full">
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
              onClick={() => router.push(`/${locale}/dashboard/subscription`)} 
              className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg"
            >
              Upgrade la Planul Pro
            </button>
          </div>
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