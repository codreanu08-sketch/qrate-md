'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { 
  Home, MapPin, Users, MessageSquare, LogOut, CreditCard, 
  Sparkles, Zap, Settings, BarChart3, Menu, X, ChevronRight,
  Star, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import ru from '@/messages/ru.json'; 
import ro from '@/messages/ro.json'; 
import { useTrial } from '@/hooks/useTrial';

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';
  const messages = useMemo(() => (locale === 'ru' ? ru : ro), [locale]);
  const tDashboard = useMemo(() => (messages as any)?.Dashboard || {}, [messages]);

  const { trialDays, isPro, loading } = useTrial();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data } = await supabase
          .from('companies')
          .select('name')
          .eq('owner_id', session.user.id)
          .maybeSingle();
        if (data?.name) setCompanyName(data.name);
      } catch (e) {
        console.error('Error fetching company:', e);
      }
    };
    fetchCompany();
  }, []);

  useEffect(() => { setMounted(true); }, []);

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

  const trialUrgency = trialDays !== null
    ? trialDays <= 1 ? 'urgent'
    : trialDays <= 3 ? 'warning'
    : 'normal'
    : 'normal';

  if (!mounted) return <div className="h-16 md:h-screen md:w-[260px] shrink-0" />;

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-[260px] shrink-0 h-screen fixed left-0 top-0 z-50 p-3 select-none">
        {/* Premium dark slate — not pitch black, has depth */}
        <div className="flex flex-col w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60"
          style={{ background: 'linear-gradient(160deg, #1e2535 0%, #171e2e 60%, #141929 100%)' }}>

          {/* Subtle top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500/40 to-transparent rounded-t-3xl" />

          {/* LOGO */}
          <div className="px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-700/40">
                <Zap className="text-white fill-white" size={16} />
              </div>
              <div>
                <p className="text-white font-black text-base italic uppercase tracking-tight leading-none">
                  QRate<span className="text-blue-400">.md</span>
                </p>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">
                  {locale === 'ru' ? 'Платформа отзывов' : 'Platformă feedback'}
                </p>
              </div>
            </div>
          </div>

          {/* COMPANY + TRIAL — together, no scroll needed */}
          <div className="px-3 pb-3 shrink-0">
            {companyName && (
              <div className="px-3 py-2.5 rounded-2xl border border-slate-600/40 mb-2"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">
                  {locale === 'ru' ? 'Компания' : 'Companie'}
                </p>
                <p className="text-slate-200 text-xs font-black truncate mt-0.5">{companyName}</p>
              </div>
            )}

            {/* TRIAL inline — below company name, compact */}
            {!loading && !isPro && trialDays !== null && (
              <Link href={`/${locale}/dashboard/subscription`}
                className={`flex items-center justify-between px-3 py-2 rounded-2xl border transition-all group ${
                  trialUrgency === 'urgent'
                    ? 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15'
                    : trialUrgency === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15'
                    : 'border-blue-500/30 bg-blue-500/8 hover:bg-blue-500/12'
                }`}>
                <div className="flex items-center gap-2">
                  <Clock size={12} className={
                    trialUrgency === 'urgent' ? 'text-rose-400'
                    : trialUrgency === 'warning' ? 'text-amber-400'
                    : 'text-blue-400'
                  } />
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-wider leading-none ${
                      trialUrgency === 'urgent' ? 'text-rose-400'
                      : trialUrgency === 'warning' ? 'text-amber-400'
                      : 'text-blue-400'
                    }`}>
                      {locale === 'ru' ? 'Пробный период' : 'Trial gratuit'}
                    </p>
                    <p className="text-slate-400 text-[9px] mt-0.5">
                      {trialDays} {locale === 'ru'
                        ? (trialDays === 1 ? 'день' : trialDays <= 4 ? 'дня' : 'дней')
                        : (trialDays === 1 ? 'zi' : 'zile')} {locale === 'ru' ? 'осталось' : 'rămase'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Mini progress bar */}
                  <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${trialColor}`}
                      style={{ width: `${trialPercent}%` }}
                    />
                  </div>
                  <Sparkles size={11} className={
                    trialUrgency === 'urgent' ? 'text-rose-400'
                    : trialUrgency === 'warning' ? 'text-amber-400'
                    : 'text-blue-400'
                  } />
                </div>
              </Link>
            )}

            {/* PRO badge inline */}
            {!loading && isPro && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/8">
                <Star size={12} className="text-emerald-400 fill-emerald-400/50 shrink-0" />
                <div>
                  <p className="text-emerald-400 text-[9px] font-black uppercase tracking-wider leading-none">Pro Active</p>
                  <p className="text-slate-500 text-[9px] mt-0.5">{locale === 'ru' ? 'Все функции разблокированы' : 'Toate funcțiile active'}</p>
                </div>
              </div>
            )}
          </div>

          {/* SEPARATOR */}
          <div className="mx-4 h-px bg-slate-700/50 mb-3 shrink-0" />

          {/* MENU — takes remaining space */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden min-h-0">
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
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-700/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  style={!isActive ? { background: 'transparent' } : undefined}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2}
                      className={`shrink-0 transition-all ${
                        isActive ? 'text-white'
                        : item.isPro ? 'text-indigo-400'
                        : 'text-slate-500 group-hover:text-slate-200'
                      }`} />
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

          {/* LOGOUT */}
          <div className="px-3 pb-4 pt-3 shrink-0">
            <div className="h-px bg-slate-700/50 mb-3" />
            <button onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all group border border-slate-700/50 hover:border-rose-500/30 hover:text-rose-400"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <LogOut size={14} className="group-hover:text-rose-400 transition-colors" />
              {locale === 'ru' ? 'Выйти' : 'Ieșire'}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-slate-700/50"
        style={{ background: 'rgba(23,30,46,0.97)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-700/40">
            <Zap className="text-white fill-white" size={14} />
          </div>
          <span className="font-black text-base italic uppercase text-white">
            QRate<span className="text-blue-400">.md</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !isPro && trialDays !== null && trialDays <= 3 && (
            <Link href={`/${locale}/dashboard/subscription`}
              className={`text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl ${
                trialUrgency === 'urgent' ? 'bg-rose-600' : 'bg-amber-500'
              }`}>
              {trialDays}d trial
            </Link>
          )}
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <Menu size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl"
        style={{ background: 'rgba(20,25,41,0.98)' }}>
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
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full rounded-t-[2rem] shadow-2xl p-5 pb-10 animate-in slide-in-from-bottom duration-300 border-t border-slate-700/50"
            style={{ background: 'linear-gradient(160deg, #1e2535 0%, #171e2e 100%)' }}>

            <div className="w-8 h-1 bg-slate-600/60 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Zap className="text-white fill-white" size={14} />
                </div>
                <span className="font-black text-base italic uppercase text-white">
                  QRate<span className="text-blue-400">.md</span>
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl border border-slate-700/50"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Trial banner in overlay */}
            {!loading && !isPro && trialDays !== null && (
              <Link href={`/${locale}/dashboard/subscription`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border mb-4 ${
                  trialUrgency === 'urgent' ? 'border-rose-500/40 bg-rose-500/10'
                  : trialUrgency === 'warning' ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-blue-500/30 bg-blue-500/8'
                }`}>
                <div className="flex items-center gap-2">
                  <Clock size={14} className={trialUrgency === 'urgent' ? 'text-rose-400' : trialUrgency === 'warning' ? 'text-amber-400' : 'text-blue-400'} />
                  <div>
                    <p className="text-slate-300 text-xs font-black">
                      {locale === 'ru' ? 'Пробный период' : 'Trial activ'}
                    </p>
                    <p className={`text-[10px] font-bold ${trialUrgency === 'urgent' ? 'text-rose-400' : trialUrgency === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
                      {trialDays} {locale === 'ru' ? (trialDays === 1 ? 'день' : 'дней') : (trialDays === 1 ? 'zi' : 'zile')} {locale === 'ru' ? 'осталось' : 'rămase'}
                    </p>
                  </div>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                  <Sparkles size={10} /> PRO
                </span>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all border ${
                      isActive
                        ? 'bg-blue-600 border-blue-500'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                    style={!isActive ? { background: 'rgba(255,255,255,0.05)' } : undefined}>
                    <div className={`p-1.5 rounded-xl shrink-0 ${isActive ? 'bg-white/20' : item.isPro ? 'bg-indigo-500/20' : 'bg-white/8'}`}>
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

            <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-slate-400 hover:text-rose-400 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-slate-700/50 hover:border-rose-500/30"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <LogOut size={15} />
              {locale === 'ru' ? 'Выйти из аккаунта' : 'Ieșire din cont'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}