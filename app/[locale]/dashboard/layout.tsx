import Sidebar from '@/components/Sidebar';
import { createClient } from '@supabase/supabase-js';
import { Lock, CreditCard, Settings } from 'lucide-react';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();

  let isActive = true;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, created_at')
      .eq('id', user.id)
      .single();

    const signupDate = new Date(profile?.created_at || '');
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 3600 * 24));

    const isPro = profile?.subscription_tier === 'pro';
    const isInTrial = diffInDays < 7;
    isActive = isPro || isInTrial;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 w-full min-w-0 flex flex-col pl-0 md:pl-72 pb-20 md:pb-0 overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
          
          {!isActive ? (
            // === PAGINĂ BLOCATĂ (cu Sidebar vizibil) ===
            <div className="flex items-center justify-center min-h-[70vh]">
              <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center border border-red-200 shadow-xl">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock size={44} className="text-red-500" />
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 mb-4">Abonament Expirat</h1>
                <p className="text-slate-600 mb-8">
                  Perioada de trial a expirat.<br />
                  Poți accesa doar <strong>Setări</strong> și <strong>Abonament</strong>.
                </p>

                <div className="space-y-3">
                  <a 
                    href={`/${locale}/dashboard/settings`}
                    className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Settings size={20} />
                    Mergi la Setări
                  </a>

                  <a 
                    href={`/${locale}/dashboard/subscription`}
                    className="flex items-center justify-center gap-2 w-full border border-slate-300 hover:bg-slate-50 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <CreditCard size={20} />
                    Vezi Abonamente
                  </a>
                </div>
              </div>
            </div>
          ) : (
            // === DASHBOARD NORMAL ===
            children
          )}
          
        </main>
      </div>
    </div>
  );
}