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

    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_ends_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profile) {
        const isPro = profile.subscription_tier === 'pro';
        const isTrial = profile.trial_ends_at 
          ? new Date(profile.trial_ends_at).getTime() > Date.now() 
          : false;

        setHasAccess(isPro || isTrial);
      } else {
        setHasAccess(false);
      }

      setLoading(false);
    }

    checkAccess();
    return () => { isMounted = false; };
  }, [router, locale]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin" /></div>;
  }

  if (!hasAccess && !isSubscriptionPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md">
          <Lock className="mx-auto mb-4 text-amber-500" size={48} />
          <h2 className="text-2xl font-black mb-3">Acces Limitat</h2>
          <p className="text-slate-600 mb-6">Trebuie să fii în trial sau abonat PRO pentru a accesa dashboard-ul.</p>
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