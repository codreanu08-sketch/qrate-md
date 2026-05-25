import Sidebar from '@/components/Sidebar';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;   // ← CORECTAT
}) {
  const { locale } = await params;       // ← Așteptăm params-ul

  // === VERIFICARE SUBSCRIPTION (în profiles) ===
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Căutăm în tabelul profiles (nu companies)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at')
      .eq('id', user.id)
      .single();

    const isActive = profile?.subscription_status === 'active' && 
                    (!profile?.subscription_ends_at || new Date(profile.subscription_ends_at) > new Date());

    if (!isActive) {
      redirect(`/${locale}/dashboard/subscription`);
    }
  }

  // === LAYOUT NORMAL ===
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative bg-slate-50">
      {/* Componenta Sidebar adaptabilă */}
      <Sidebar />

      {/* Zona conținutului principal */}
      <div className="flex-1 w-full min-w-0 flex flex-col pl-0 md:pl-72 pb-20 md:pb-0 overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}