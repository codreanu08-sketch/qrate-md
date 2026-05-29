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
  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/${locale}/auth/login`); // am corectat ruta
          return;
        }

        let { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, trial_ends_at, created_at')
          .eq('id', user.id)
          .maybeSingle();

        // Dacă nu există profil, îl creăm
        if (!profile) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              trial_ends_at: trialEnd.toISOString(),
              subscription_tier: 'free'
            })
            .select()
            .single();

          profile = newProfile;
        }

        if (profile) {
          const isPro = profile.subscription_tier === 'pro';
          let isTrialActive = false;
          let trialDays = 0;

          if (profile.trial_ends_at) {
            const endDate = new Date(profile.trial_ends_at);
            trialDays = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
            isTrialActive = trialDays > 0;
          } else if (profile.created_at) {
            const endDate = new Date(new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
            trialDays = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
            isTrialActive = trialDays > 0;
          }

          setHasAccess(isPro || isTrialActive);
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <RefreshCw className="animate-spin text-white" size={32} />
      </div>
    );
  }

  // Dacă trial-ul a expirat și nu e pe pagina de subscription
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
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      {/* Main Content - cu padding corect */}
      <div className="flex-1 md:ml-[260px]">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}