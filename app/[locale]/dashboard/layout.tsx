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
  const [hasCompany, setHasCompany] = useState<boolean>(false);

  const isCreateCompanyPage = pathname?.endsWith('/dashboard/create-company');
  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  useEffect(() => {
    async function checkSecurityAndCompany() {
      try {
        setLoading(true);

        // 1. Verificăm autentificarea
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push(`/${locale}/login`);
          return;
        }

        // 2. Interogăm Supabase (folosim maybeSingle ca să nu crape codul)
        const [profileRes, companyRes] = await Promise.all([
          supabase.from('profiles').select('subscription_tier, trial_started_at').eq('id', user.id).maybeSingle(),
          supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle()
        ]);

        if (profileRes.error) console.error("Eroare Supabase Profiles:", profileRes.error);
        if (companyRes.error) console.error("Eroare Supabase Companies:", companyRes.error);

        // 3. Verificăm Planul / Trial-ul
        if (profileRes.data) {
          const profile = profileRes.data;
          const isPro = profile.subscription_tier === 'pro';
          let isTrial = false;

          if (profile.trial_started_at) {
            const trialDate = new Date(profile.trial_started_at).getTime();
            const currentDate = new Date().getTime();
            if (!isNaN(trialDate)) {
              const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
              const timpScurs = currentDate - trialDate;
              isTrial = timpScurs >= 0 && timpScurs < sevenDaysInMs;
            }
          }
          setHasAccess(isPro || isTrial);
        } else {
          setHasAccess(false);
        }

        // 4. Verificăm existența companiei
        const companyExists = !!companyRes.data;
        setHasCompany(companyExists);

        // === LOGICA CRITICĂ DE REDIRECȚIONARE + REFRESH ANTI-CACHE ===
        if (!companyExists && !isCreateCompanyPage && !isSubscriptionPage) {
          router.refresh(); // Șterge cache-ul vechi al rutelor Next.js
          router.push(`/${locale}/dashboard/create-company`);
          return;
        }

        if (companyExists && isCreateCompanyPage) {
          router.refresh(); // Forțează layout-ul să vadă că firma s-a creat
          router.push(`/${locale}/dashboard`);
          return;
        }

      } catch (err) {
        console.error("Eroare critică în DashboardLayout:", err);
      } finally {
        setLoading(false);
      }
    }

    checkSecurityAndCompany();
  }, [pathname, locale, isCreateCompanyPage, isSubscriptionPage, router]);

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

  if (isCreateCompanyPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="min-h-screen">{children}</main>
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