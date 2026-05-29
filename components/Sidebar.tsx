'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { 
  Home, MapPin, Users, MessageSquare, LogOut, CreditCard, 
  Sparkles, Zap, Settings, BarChart3, Menu, X, ChevronRight,
  Star, TrendingUp, Clock
} from 'lucide-react';
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
  const tDashboard = useMemo(() => (messages as any)?.Dashboard || {}, [messages]);

  const [loading, setLoading] = useState(true);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const initSidebar = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [profileRes, companyRes] = await Promise.all([
        supabase.from('profiles').select('subscription_tier, trial_ends_at, created_at').eq('id', session.user.id).maybeSingle(),
        supabase.from('companies').select('name').eq('owner_id', session.user.id).maybeSingle()
      ]);

      if (profileRes.data) {
        const pro = profileRes.data.subscription_tier === 'pro';
        setIsPro(pro);

        if (!pro) {
          // ✅ Fix: calculează corect din trial_ends_at sau created_at + 7 zile
          const endDate = profileRes.data.trial_ends_at
            ? new Date(profileRes.data.trial_ends_at)
            : new Date(new Date(profileRes.data.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);

          const remaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24));
          setTrialDays(remaining > 0 ? remaining : 0);
        }
      }

      if (companyRes.data?.name) setCompanyName(companyRes.data.name);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setMounted(true); initSidebar(); }, [initSidebar]);

  const menuItems = useMemo(() => [
    {
      name: tDashboard?.sidebar?.menu?.dashboard || (locale === 'ru' ? 'Панель' : 'Dashboard'),
      href: `/${locale}/dashboard`,
      icon: Home,
      mobileShow: true,
    },
    {
      name: locale === 'ru' ? 'Аналитика' : 'Analytics',
      href: `/${locale}/dashboard/analytics`,
      icon: BarChart3,
      isPro: true,
      mobileShow: true,
    },
    {
      name: tDashboard?.sidebar?.menu?.locations || (locale === 'ru' ? 'Локации' : 'Locații'),
      href: `/${locale}/dashboard/locations`,
      icon: MapPin,
      mobileShow: true,
    },
    {
      name: tDashboard?.sidebar?.menu?.employees || (locale === 'ru' ? 'Сотрудники' : 'Angajați'),
      href: `/${locale}/dashboard/employees`,
      icon: Users,
      mobileShow: true,
    },
    {
      name: tDashboard?.sidebar?.menu?.reviews || (locale === 'ru' ? 'Отзывы' : 'Recenzii'),
      href: `/${locale}/dashboard/reviews`,
      icon: MessageSquare,
      mobileShow: false,
    },
    {
      name: tDashboard?.sidebar?.menu?.billing || (locale === 'ru' ? 'Абонемент' : 'Abonament'),
      href: `/${locale}/dashboard/subscription`,
      icon: CreditCard,
      mobileShow: false,
    },
    {
      name: tDashboard?.sidebar?.menu?.settings || (locale === 'ru' ? 'Настройки' : 'Setări'),
      href: `/${locale}/dashboard/settings`,
      icon: Settings,
      mobileShow: false,
    },
  ], [tDashboard, locale]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
  };

  const trialPercent = trialDays !== null ? Math.round((trialDays / 7) * 100) : 0;
  const trialColor = trialDays !== null
    ? trialDays <= 1 ? 'from-rose-500 to-red-600'
    : trialDays <= 3 ? 'from-amber-500 to-orange-500'
    : 'from-blue-500 to-indigo-600'
    : 'from-blue-500 to-indigo-600';

  if (!mounted) return <div className="h-16 md:h-screen md:w-[260px] shrink-0" />;

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-[260px] shrink-0 h-screen fixed left-0 top-0 z-50 p-3 select-none">
        <div className="flex flex-col w-full h-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/50">

          {/* LOGO */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                <Zap className="text-white fill-white" size={16} />
              </div>
              <div>
                <p className="text-white font-black text-base italic uppercase tracking-tight leading-none">
                  QRate<span className="text-blue-500">.md</span>
                </p>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">
                  {locale === 'ru' ? 'Платформа отзывов' : 'Platformă feedback'}
                </p>
              </div>
            </div>

            {/* Compania */}
            {companyName && (
              <div className="mt-3 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{locale === 'ru' ? 'Компания' : 'Companie'}</p>
                <p className="text-white text-xs font-black truncate mt-0.5">{companyName}</p>
              </div>
            )}
          </div>

          {/* SEPARATOR */}
          <div className="mx-5 h-px bg-white/5 mb-3" />

          {/* MENIU */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-hidden">
            <p className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">
              {locale === 'ru' ? 'Навигация' : 'Navigare'}
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-2xl font-black transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}>
                  <div className="flex items-center gap-3">
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2}
                      className={`shrink-0 transition-all ${isActive ? 'text-white' : item.isPro ? 'text-indigo-400' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className="text-[12px] uppercase tracking-wide">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.isPro && !isActive && (
                      <span className="text-[8px] font-black bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md uppercase border border-indigo-500/20">PRO</span>
                    )}
                    {isActive && <ChevronRight size={13} className="text-white/60" />}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* TRIAL CARD sau PRO BADGE */}
          <div className="px-3 mb-3">
            {!loading && isPro && (
              <div className="px-3 py-2.5 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                <Star size={13} className="text-emerald-400 fill-emerald-400/30 shrink-0" />
                <div>
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">Pro Active</p>
                  <p className="text-slate-500 text-[9px]">{locale === 'ru' ? 'Все функции разблокированы' : 'Toate funcțiile active'}</p>
                </div>
              </div>
            )}

            {!loading && !isPro && trialDays !== null && (
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${
                trialDays <= 1 ? 'from-rose-500/10 to-transparent border border-rose-500/20'
                : trialDays <= 3 ? 'from-amber-500/10 to-transparent border border-amber-500/20'
                : 'from-blue-500/10 to-transparent border border-blue-500/20'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className={trialDays <= 1 ? 'text-rose-400' : trialDays <= 3 ? 'text-amber-400' : 'text-blue-400'} />
                    <p className={`text-[9px] font-black uppercase tracking-wider ${trialDays <= 1 ? 'text-rose-400' : trialDays <= 3 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {locale === 'ru' ? 'Пробный период' : 'Trial gratuit'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black ${trialDays <= 1 ? 'text-rose-300' : trialDays <= 3 ? 'text-amber-300' : 'text-blue-300'}`}>
                    {trialDays} {locale === 'ru' ? (trialDays === 1 ? 'день' : trialDays <= 4 ? 'дня' : 'дней') : (trialDays === 1 ? 'zi' : 'zile')}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${trialColor} transition-all`}
                    style={{ width: `${trialPercent}%` }}
                  />
                </div>

                <Link href={`/${locale}/dashboard/subscription`}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    trialDays <= 3
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  }`}>
                  <Sparkles size={11} />
                  {locale === 'ru' ? 'Активировать PRO' : 'Activează PRO'}
                </Link>
              </div>
            )}
          </div>

          {/* LOGOUT */}
          <div className="px-3 pb-3">
            <button onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all group border border-transparent hover:border-rose-500/20">
              <LogOut size={14} className="group-hover:text-rose-400 transition-colors" />
              {locale === 'ru' ? 'Выйти' : 'Ieșire'}
            </button>
          </div>
        </div>
      </aside>

      {/* SPACER desktop */}
      <div className="hidden md:block w-[260px] shrink-0" />

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30">
            <Zap className="text-white fill-white" size={14} />
          </div>
          <span className="font-black text-base italic uppercase text-white">
            QRate<span className="text-blue-500">.md</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !isPro && trialDays !== null && trialDays <= 3 && (
            <Link href={`/${locale}/dashboard/subscription`}
              className="bg-rose-600 text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl">
              {trialDays}d trial
            </Link>
          )}
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors">
            <Menu size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/98 backdrop-blur-xl border-t border-white/5 shadow-2xl">
        <div className="flex items-center justify-around px-1 py-2 pb-safe">
          {menuItems.filter(i => i.mobileShow).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all relative min-w-[56px] ${isActive ? 'bg-blue-600' : ''}`}>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2}
                  className={`${isActive ? 'text-white' : item.isPro ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className={`text-[8px] font-black uppercase tracking-tight mt-1 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {item.name.split(' ')[0]}
                </span>
                {item.isPro && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 text-[7px] font-black bg-indigo-500 text-white px-1 py-0.5 rounded-full leading-none">P</span>
                )}
              </Link>
            );
          })}
          <button onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[56px]">
            <Menu size={19} strokeWidth={2} className="text-slate-500" />
            <span className="text-[8px] font-black uppercase tracking-tight mt-1 text-slate-500">
              {locale === 'ru' ? 'Ещё' : 'Mai mult'}
            </span>
          </button>
        </div>
      </nav>

      {/* ===== MOBILE OVERLAY MENU ===== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full bg-slate-950 rounded-t-[2rem] shadow-2xl p-5 pb-10 animate-in slide-in-from-bottom duration-300 border-t border-white/5">

            {/* Handle */}
            <div className="w-8 h-1 bg-white/10 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="text-white fill-white" size={14} />
                </div>
                <span className="font-black text-base italic uppercase text-white">
                  QRate<span className="text-blue-500">.md</span>
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl bg-white/10">
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Grid items */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-blue-600 border border-blue-500'
                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                    }`}>
                    <div className={`p-1.5 rounded-xl shrink-0 ${isActive ? 'bg-white/20' : item.isPro ? 'bg-indigo-500/20' : 'bg-white/10'}`}>
                      <Icon size={16} strokeWidth={2}
                        className={`${isActive ? 'text-white' : item.isPro ? 'text-indigo-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-black uppercase tracking-wide block truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {item.name}
                      </span>
                      {item.isPro && !isActive && (
                        <span className="text-[8px] font-black text-indigo-400 uppercase">PRO</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Trial */}
            {!loading && !isPro && trialDays !== null && (
              <div className={`p-4 rounded-2xl mb-3 flex items-center justify-between ${
                trialDays <= 3 ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{locale === 'ru' ? 'Пробный период' : 'Trial activ'}</p>
                  <p className={`font-black text-sm ${trialDays <= 3 ? 'text-rose-400' : 'text-blue-400'}`}>
                    {trialDays} {locale === 'ru' ? (trialDays === 1 ? 'день' : 'дней') : (trialDays === 1 ? 'zi' : 'zile')} {locale === 'ru' ? 'осталось' : 'rămase'}
                  </p>
                </div>
                <Link href={`/${locale}/dashboard/subscription`} onClick={() => setMobileMenuOpen(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                  PRO
                </Link>
              </div>
            )}

            <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-white/5 hover:border-rose-500/20">
              <LogOut size={15} />
              {locale === 'ru' ? 'Выйти из аккаунта' : 'Ieșire din cont'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}