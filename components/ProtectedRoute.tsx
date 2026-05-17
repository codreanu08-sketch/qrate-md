'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from './Sidebar'; // Importă Sidebar-ul tău aici
import { Lock } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'ro';
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/auth/login`);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      const signupDate = new Date(profile?.created_at || new Date());
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 3600 * 24));
      
      setHasAccess(profile?.subscription_tier === 'pro' || diffInDays <= 7);
    };
    check();
  }, [locale]);

  if (hasAccess === null) return <div className="p-10">Se verifică...</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {hasAccess ? (
          children
        ) : (
          <div className="h-full flex items-center justify-center">
             <div className="text-center bg-white p-10 rounded-3xl shadow-lg border border-red-100">
                <Lock className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold">Trial Expirat</h2>
                <button onClick={() => router.push(`/${locale}/pricing`)} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl">
                  Vezi Planuri
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}