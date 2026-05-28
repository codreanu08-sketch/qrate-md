'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Home, MapPin, Users, MessageSquare, LogOut, CreditCard, Sparkles, Zap, Settings, ArrowRight, BarChart3, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initSidebar = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from('profiles').select('subscription_tier, trial_started_at, trial_ends_at').eq('id', session.user.id).maybeSingle();
      if (profile) {
        const isPro = profile.subscription_tier === 'pro';
        let remaining = 0;
        if (profile.trial_ends_at) {
          remaining = Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 3600 * 24));
        } else if (profile.trial_started_at) {
          const end = new Date(new Date(profile.trial_started_at).getTime() + 7*24*60*60*1000);
          remaining = Math.ceil((end.getTime() - Date.now()) / (1000 * 3600 * 24));
        }
        setTrialDays(!isPro && remaining > 0 ? remaining : null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setMounted(true); initSidebar(); }, [initSidebar]);

  const getTrialText = useCallback((days: number) => {
    if (locale === 'ru') {
      const m10 = days % 10, m100 = days % 100;
      if (m10 === 1 && m100 !== 11) return `${days} день`;
      if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${days} дня`;
      return `${days} дней`;
    }
    if (days === 1) return 'o zi';
    return days % 100 >= 1 && days % 100 <= 19 ? `${days} zile` : `${days} de zile`;
  }, [locale]);

  const menuItems = useMemo(() => [
    { name: tDashboard?.sidebar?.menu?.dashboard || 'Dashboard', href: `/${locale}/dashboard`, icon: Home, mobileShow: true },
    { name: locale === 'ru' ? 'Аналитика' : 'Analytics', href: `/${locale}/dashboard/analytics`, icon: BarChart3, isPro: true, mobileShow: true },
    { name: tDashboard?.sidebar?.menu?.locations || 'Locații', href: `/${locale}/dashboard/locations`, icon: MapPin, mobileShow: true },
    { name: tDashboard?.sidebar?.menu?.employees || 'Angajați', href: `/${locale}/dashboard/employees`, icon: Users, mobileShow: true },
    { name: tDashboard?.sidebar?.menu?.reviews || 'Recenzii', href: `/${locale}/dashboard/reviews`, icon: MessageSquare, mobileShow: false },
    { name: tDashboard?.sidebar?.menu?.billing || 'Abonament', href: `/${locale}/dashboard/subscription`, icon: CreditCard, mobileShow: false },
    { name: tDashboard?.sidebar?.menu?.settings || 'Setări', href: `/${locale}/dashboard/settings`, icon: Settings, mobileShow: false },
  ], [tDashboard, locale]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
  };

  if (!mounted) return <div className="h-16 md:h-screen md:w-72 shrink-0 bg-slate-50" />;

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-72 bg-slate-50 h-screen fixed left-0 top-0 flex-col z-50 p-4 select-none">
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 shadow-xl flex flex-col h-full overflow-hidden">
          
          {/* LOGO */}
          <div className="p-6 pb-4 flex items-center gap-3 border-b border-slate-100/60">
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

          {/* MENIU */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <p className="px-3 text-[9px] font-bold text-slate-400/80 uppercase tracking-[0.2em] mb-3">
              {locale === 'ru' ? 'Меню управления' : 'Navigare'}
            </p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-black transition-all duration-200 group ${isActive ? 'bg-gradient-to-r from-blue-500/[0.08] to-transparent text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                    <div className="flex items-center gap-3.5">
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-all ${isActive ? 'text-blue-500 scale-110' : item.isPro ? 'text-indigo-400 group-hover:text-indigo-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                      <span className="text-[13px] uppercase tracking-wide">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.isPro && !isActive && <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md uppercase">PRO</span>}
                      {isActive && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* TRIAL */}
          {!loading && trialDays !== null && trialDays > 0 && (
            <div className="mx-4 mb-2 p-3.5 rounded-2xl bg-gradient-to-b from-rose-500/[0.03] to-transparent border border-rose-500/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={11} className="text-rose-500 fill-rose-500/20" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{locale === 'ru' ? 'Пробный период' : 'Perioadă de probă'}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-rose-600 uppercase">{getTrialText(trialDays)} {locale === 'ru' ? 'осталось' : 'rămase'}</span>
                <Link href={`/${locale}/dashboard/subscription`} className="flex items-center gap-1 text-[10px] font-black text-slate-900 hover:text-blue-500 uppercase tracking-wider transition-colors">
                  {locale === 'ru' ? 'Активировать' : 'Activează'} <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          )}

          {/* LOGOUT */}
          <div className="p-4 border-t border-slate-100/80">
            <button onClick={handleSignOut} className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/50 hover:border-rose-100 hover:bg-rose-50/20 text-slate-500 hover:text-rose-600 rounded-xl font-black transition-all w-full group">
              <LogOut size={14} className="text-slate-400 group-hover:text-rose-500" strokeWidth={2} />
              <span className="text-[11px] uppercase tracking-wider">{locale === 'ru' ? 'Выйти из аккаунта' : 'Ieșire din cont'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="text-white fill-white" size={14} />
          </div>
          <span className="font-black text-base italic uppercase text-slate-900">
            QRate<span className="text-blue-500 not-italic lowercase font-semibold">.md</span>
          </span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <Menu size={20} className="text-slate-700" />
        </button>
      </div>

      {/* ===== MOBILE BOTTOM NAV (4 butoane principale) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.filter(i => i.mobileShow).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all relative min-w-[60px] ${isActive ? 'bg-blue-50' : ''}`}>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-600' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2}
                    className={`${isActive ? 'text-white' : item.isPro ? 'text-indigo-400' : 'text-slate-400'}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tight mt-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                  {item.name.split(' ')[0]}
                </span>
                {item.isPro && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 text-[7px] font-black bg-indigo-500 text-white px-1 py-0.5 rounded-full">PRO</span>
                )}
              </Link>
            );
          })}
          {/* Buton Mai mult */}
          <button onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[60px]">
            <div className="p-1.5 rounded-xl">
              <Menu size={20} strokeWidth={2} className="text-slate-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight mt-1 text-slate-400">
              {locale === 'ru' ? 'Ещё' : 'Mai mult'}
            </span>
          </button>
        </div>
      </nav>

      {/* ===== MOBILE FULL MENU OVERLAY ===== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex flex-col">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          {/* Sheet de jos */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            
            {/* Handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            
            {/* Logo + Close */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Zap className="text-white fill-white" size={14} />
                </div>
                <span className="font-black text-base italic uppercase">QRate<span className="text-blue-500 not-italic lowercase font-semibold">.md</span></span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl bg-slate-100">
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            {/* Toate item-urile */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-blue-200'}`}>
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-blue-600' : item.isPro ? 'bg-indigo-100' : 'bg-white'}`}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2}
                        className={`${isActive ? 'text-white' : item.isPro ? 'text-indigo-500' : 'text-slate-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-black uppercase tracking-wide block truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>{item.name}</span>
                      {item.isPro && <span className="text-[8px] font-black text-indigo-500 uppercase">PRO</span>}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Trial + Logout */}
            {!loading && trialDays !== null && trialDays > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{locale === 'ru' ? 'Пробный период' : 'Trial activ'}</p>
                  <p className="font-black text-rose-600 text-sm">{getTrialText(trialDays)} {locale === 'ru' ? 'осталось' : 'rămase'}</p>
                </div>
                <Link href={`/${locale}/dashboard/subscription`} onClick={() => setMobileMenuOpen(false)}
                  className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                  Upgrade
                </Link>
              </div>
            )}

            <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-wider transition-all">
              <LogOut size={16} />
              {locale === 'ru' ? 'Выйти из аккаунта' : 'Ieșire din cont'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}