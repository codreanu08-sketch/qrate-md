'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Home, MapPin, Users, MessageSquare, LogOut, CreditCard, Sparkles, Zap, Settings, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback, useMemo } from 'react';

import ru from '@/messages/ru.json'; 
import ro from '@/messages/ro.json'; 

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';

  const messages = useMemo(() => (locale === 'ru' ? ru : ro), [locale]);
  const tDashboard = useMemo(() => messages?.Dashboard || {}, [messages]);

  const [loading, setLoading] = useState(true);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const initSidebar = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, created_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        const signupDate = new Date(profile.created_at);
        const now = new Date();
        const diffInDays = (now.getTime() - signupDate.getTime()) / (1000 * 3600 * 24);
        const remaining = Math.ceil(7 - diffInDays);
        const isPro = profile.subscription_tier === 'pro';
        
        setTrialDays(!isPro && diffInDays < 7 ? remaining : null);
      }
    } catch (error) {
      console.error("Error loading sidebar data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    setMounted(true);
    initSidebar(); 
  }, [initSidebar]);

  const getTrialDaysText = useCallback((days: number) => {
    if (locale === 'ru') {
      const mod10 = days % 10;
      const mod100 = days % 100;
      if (mod10 === 1 && mod100 !== 11) return `${days} день`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${days} дня`;
      return `${days} дней`;
    } else {
      if (days === 1) return 'o zi';
      const remainder = days % 100;
      if (remainder >= 1 && remainder <= 19) return `${days} zile`;
      return `${days} de zile`;
    }
  }, [locale]);

  const menuItems = useMemo(() => [
    { name: tDashboard?.sidebar?.menu?.dashboard || 'Dashboard', href: `/${locale}/dashboard`, icon: Home },
    { name: tDashboard?.sidebar?.menu?.locations || 'Locații', href: `/${locale}/dashboard/locations`, icon: MapPin },
    { name: tDashboard?.sidebar?.menu?.employees || 'Angajați', href: `/${locale}/dashboard/employees`, icon: Users },
    { name: tDashboard?.sidebar?.menu?.reviews || 'Recenzii', href: `/${locale}/dashboard/reviews`, icon: MessageSquare },
    { name: tDashboard?.sidebar?.menu?.billing || 'Abonament', href: `/${locale}/dashboard/subscription`, icon: CreditCard },
    { name: tDashboard?.sidebar?.menu?.settings || 'Setări', href: `/${locale}/dashboard/settings`, icon: Settings },
  ], [tDashboard, locale]);

  if (!mounted) return <aside className="w-72 bg-slate-50 h-screen fixed left-0 top-0 z-50 p-4" />;

  return (
    <aside className="w-72 bg-slate-50 h-screen fixed left-0 top-0 flex flex-col z-50 p-4 select-none">
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 shadow-xl shadow-slate-100/40 flex flex-col h-full overflow-hidden">
        
        {/* SECTION 1: HEADER & BRAND LOGO */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Zap className="text-white fill-white" size={15} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none italic uppercase">
                QRate<span className="text-blue-500 not-italic lowercase font-semibold">.md</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                {locale === 'ru' ? 'ФИДБЕК ПЛАТФОРМА' : 'PLATFORMĂ FEEDBACK'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: NAVIGATION */}
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
          <p className="px-3 text-[9px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3">
            {locale === 'ru' ? 'Меню управления' : 'Meniu de navigare'}
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-black transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500/[0.08] to-transparent text-blue-600' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon 
                      size={18} 
                      className={`transition-all duration-200 ${
                        isActive 
                          ? 'text-blue-500 scale-110' 
                          : 'text-slate-400 group-hover:text-blue-500 group-hover:scale-105'
                      }`} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                    <span className="text-[13px] uppercase tracking-wide font-black">
                      {item.name}
                    </span>
                  </div>

                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* SECTION 3: SEPARATE PREMIUM TRIAL CARD */}
        {!loading && trialDays !== null && trialDays > 0 && (
          <div className="mx-4 mb-2 p-3.5 rounded-2xl bg-gradient-to-b from-rose-500/[0.03] to-transparent border border-rose-500/10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                <Sparkles size={11} className="text-rose-500 fill-rose-500/20" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'ru' ? 'Пробный период' : 'Perioadă de probă'}
              </p>
            </div>
            
            <div className="flex items-center justify-between items-baseline mt-0.5">
              <span className="text-[13px] font-black text-rose-600 uppercase tracking-wide">
                {getTrialDaysText(trialDays)} {locale === 'ru' ? 'осталось' : 'rămase'}
              </span>
              <Link 
                href={`/${locale}/dashboard/subscription`}
                className="flex items-center gap-1 text-[10px] font-black text-slate-900 hover:text-blue-500 uppercase tracking-wider transition-colors group/btn"
              >
                <span>{locale === 'ru' ? 'Активировать' : 'Activează'}</span>
                <ArrowRight size={10} className="transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </div>
          </div>
        )}

        {/* SECTION 4: FOOTER / LOGOUT */}
        <div className="p-4 border-t border-slate-100/80 bg-slate-50/30">
          <button 
            onClick={async () => { 
              await supabase.auth.signOut(); 
              router.push(`/${locale}/auth/login`); 
            }} 
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/50 hover:border-rose-100 hover:bg-rose-50/20 text-slate-500 hover:text-rose-600 rounded-xl font-black transition-all duration-200 active:scale-[0.98] w-full shadow-xs group"
          >
            <LogOut size={14} className="text-slate-400 group-hover:text-rose-500 transition-colors" strokeWidth={2} />
            <span className="text-[11px] uppercase tracking-wider font-black">
              {locale === 'ru' ? 'Выйти из аккаунта' : 'Ieșire din cont'}
            </span>
          </button>
        </div>

      </div>
    </aside>
  );
}