import Sidebar from '@/components/Sidebar';
import { createClient } from '@supabase/supabase-js';
import { Lock, CreditCard } from 'lucide-react';

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

  if (user) {
    let isActive = false;

    // === 1. Verificăm în PROFILES ===
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, created_at, is_subscribed, subscription_end')
      .eq('id', user.id)
      .single();

    if (profile) {
      const signupDate = new Date(profile.created_at || '');
      const now = new Date();
      const diffInDays = (now.getTime() - signupDate.getTime()) / (1000 * 3600 * 24);

      const isPro = profile.subscription_tier === 'pro';
      const isInTrial = diffInDays < 7;
      const hasActiveSub = profile.is_subscribed === true || 
                          (profile.subscription_end && new Date(profile.subscription_end) > now);

      isActive = isPro || isInTrial || hasActiveSub;
    }

    // === 2. Dacă nu am găsit în profiles, verificăm în COMPANIES ===
    if (!isActive) {
      const { data: company } = await supabase
        .from('companies')
        .select('subscription_status, subscription_ends_at')
        .eq('owner_id', user.id)
        .single();

      if (company) {
        isActive = company.subscription_status === 'active' && 
                  (!company.subscription_ends_at || new Date(company.subscription_ends_at) > new Date());
      }
    }

    // === DACĂ NU E ACTIV → BLOCHEZĂ ===
    if (!isActive) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center border border-red-200 shadow-xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={44} className="text-red-500" />
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-4">Acces Blocat</h1>
            <p className="text-slate-600 mb-8">
              Abonamentul tău a expirat. Pentru a continua să folosești QRate, te rugăm să reînnoiești.
            </p>

            <a 
              href={`/${locale}/dashboard/subscription`}
              className="inline-flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <CreditCard size={20} />
              Mergi la pagina de Abonament
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative bg-slate-50">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 flex flex-col pl-0 md:pl-72 pb-20 md:pb-0 overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}