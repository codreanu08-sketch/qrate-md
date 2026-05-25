'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const locale = params?.locale || 'ro';
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/${locale}/login`);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier, trial_started_at')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          console.error("Eroare la preluarea profilului:", error);
          setHasAccess(false);
          return;
        }

        // --- DEBUG LOGS DIRECT ÎN CONSOLĂ ---
        console.log("=== VERIFICARE ACCES QRATE ===");
        console.log("User ID:", user.id);
        console.log("Abonament:", profile.subscription_tier);
        console.log("Data Trial pornire (raw):", profile.trial_started_at);

        const isPro = profile.subscription_tier === 'pro';
        let isTrial = false;

        if (profile.trial_started_at) {
          const trialDate = new Date(profile.trial_started_at).getTime();
          const currentDate = new Date().getTime();

          console.log("Data trial transformata in Ms:", trialDate);
          console.log("Data curenta in Ms:", currentDate);

          if (!isNaN(trialDate)) {
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            const timpScurs = currentDate - trialDate;
            
            console.log("Timp scurs (milisecunde):", timpScurs);
            console.log("Zile scurse:", timpScurs / (1000 * 60 * 60 * 24));

            // Dacă timpul scurs de la activarea trialului este mai mic de 7 zile
            // SAU dacă timpul scurs este negativ (în caz că ai pus o dată din viitor pentru test)
            isTrial = timpScurs >= 0 && timpScurs < sevenDaysInMs;
          }
        }

        console.log("Rezultat calcul isTrial:", isTrial);
        console.log("Acces final:", isPro || isTrial);
        console.log("=============================");

        setHasAccess(isPro || isTrial);
      } catch (err) {
        console.error("Eroare neprevăzută în layout:", err);
        setHasAccess(false);
      }
    }
    
    checkSubscription();
  }, [router, locale, pathname]); // Re-verifică la schimbarea paginii pentru siguranță

  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  // Dacă nu are acces și NU se află pe pagina de subscription, îl blocăm
  if (hasAccess === false && !isSubscriptionPage) {
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
              onClick={() => router.push(`/${locale}/dashboard/subscription`)} 
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