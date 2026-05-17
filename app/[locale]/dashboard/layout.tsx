'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar'; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'ro';
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
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
        
        const signupDate = new Date(profile?.created_at || new Date());
        const diffInDays = (new Date().getTime() - signupDate.getTime()) / (1000 * 3600 * 24);
        
        setHasAccess(profile?.subscription_tier === 'pro' || diffInDays < 7);
      } catch (e) {
        setHasAccess(false);
      }
    };
    checkAccess();
  }, [locale, router]);

  // Loading state pentru a preveni "flicker"
  if (hasAccess === null) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-72 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-72 min-h-screen">
        <div className="p-8 lg:p-12">
          {hasAccess ? (
            <div className="animate-in fade-in duration-500">
              {children}
            </div>
          ) : (
            <div className="h-[80vh] flex items-center justify-center">
              <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center max-w-md border border-red-50">
                <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="text-red-500" size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Acces Limitat</h2>
                <p className="text-gray-500 mb-8 font-medium">Trial-ul tău de 7 zile a expirat. Abonează-te pentru a continua.</p>
                <button 
                  onClick={() => router.push(`/${locale}/pricing`)}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all"
                >
                  Vezi Planuri Pro
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}