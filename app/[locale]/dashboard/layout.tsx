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
  const [hasAccess, setHasAccess] = useState(false);
  const isSubscriptionPage = pathname?.endsWith('/dashboard/subscription');

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        const isPro = profile.subscription_tier === 'pro';
        
        // Verificare trial mai sigură
        let isTrial = false;
        if (profile.trial_ends_at) {
          const trialEnd = new Date(profile.trial_ends_at);
          const now = new Date();
          isTrial = trialEnd.getTime() > now.getTime();
        }

        console.log("Trial check:", { isPro, isTrial, trial_ends_at: profile.trial_ends_at });
        
        setHasAccess(isPro || isTrial);
      } else {
        setHasAccess(false);
      }
      setLoading(false);
    };

    checkAccess();
  }, [router, locale]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin" /></div>;
  }

  if (!hasAccess && !isSubscriptionPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md">
          <Lock className="mx-auto mb-4 text-amber-500" size={48} />
          <h2 className="text-2xl font-black mb-3">Acces Limitat</h2>
          <p className="text-slate-600 mb-6">Trebuie să fii în trial sau abonat PRO.</p>
          <button 
            onClick={() => router.push(`/${locale}/dashboard/subscription`)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black"
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
      <div className="flex-1 md:pl-72">
        <main>{children}</main>
      </div>
    </div>
  );
}