'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from './Sidebar';
import { Lock, CreditCard } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ro';
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push(`/${locale}/auth/login`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, created_at')
        .eq('id', user.id)
        .single();

      const signupDate = new Date(profile?.created_at || '');
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 3600 * 24));

      const isPro = profile?.subscription_tier === 'pro';
      const isInTrial = diffInDays < 7; // strict mai puțin de 7 zile

      setHasAccess(isPro || isInTrial);
    };

    checkAccess();
  }, [locale]);

  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center border border-red-200 shadow-xl">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={44} className="text-red-500" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-4">Trial Expirat</h1>
          <p className="text-slate-600 mb-8">
            Perioada de 7 zile a expirat. Pentru a continua, te rugăm să activezi un abonament.
          </p>

          <button 
            onClick={() => router.push(`/${locale}/dashboard/subscription`)}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <CreditCard size={20} />
            Activează Abonament
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}