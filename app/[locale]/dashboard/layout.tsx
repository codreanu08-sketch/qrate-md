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
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);

  // === DETECTĂM UNDE SE AFLĂ UTILIZATORUL ===
  const isCreateCompanyPage = pathname?.endsWith('/dashboard/create-company');
  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  useEffect(() => {
    async function checkUserStatus() {
      try {
        // 1. Verificăm autentificarea
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/${locale}/login`);
          return;
        }

        // 2. Verificăm Subscription & Existența Companiei în paralel pentru viteză
        const [profileRes, companyRes] = await Promise.all([
          supabase.from('profiles').select('subscription_tier, trial_started_at').eq('id', user.id).single(),
          supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle()
        ]);

        // Verificare eroare profil
        if (profileRes.error || !profileRes.data) {
          console.error("Eroare la preluarea profilului:", profileRes.error);
          setHasAccess(false);
          return;
        }

        // Logică acces Premium / Trial
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

        const accessGranted = isPro || isTrial;
        setHasAccess(accessGranted);

        // Logică companie
        const companyExists = !!companyRes.data;
        setHasCompany(companyExists);

        // === REDIRECȚIONARE AUTOMATĂ PENTRU COMPANIE ===
        // Dacă are acces la dashboard, NU are companie și NU se află deja pe pagina de creare companie sau subscription
        if (accessGranted && !companyExists && !isCreateCompanyPage && !isSubscriptionPage) {
          router.push(`/${locale}/dashboard/create-company`);
        }

      } catch (err) {
        console.error("Eroare neprevăzută în layout:", err);
        setHasAccess(false);
      }
    }
    
    checkUserStatus();
  }, [router, locale, pathname, isCreateCompanyPage, isSubscriptionPage]);

  // Loading global până se prind stările din Supabase
  if (hasAccess === null || (hasAccess === true && hasCompany === null)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // Dacă nu are abonament activ și nu e pe pagina de subscription -> Blocat
  if (hasAccess === false && !isSubscriptionPage) {
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

  // === RENDER CURAT PENTRU CREARE COMPANIE (FĂRĂ SIDEBAR) ===
  if (isCreateCompanyPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // === RENDER NORMAL CU SIDEBAR PENTRU LOGAȚI + COMPANIE ACTIVĂ ===
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 w-full md:pl-72">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}