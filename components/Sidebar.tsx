'use client';

import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { 
  Home, MapPin, Users, MessageSquare, LogOut, CreditCard, 
  Sparkles, Zap, Settings, BarChart3, Menu, X, ChevronRight,
  Star, Clock, Shield
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

  const { trialDays, isPro, isAdmin, loading } = useTrial();

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
      } catch (e) { console.error(e); }
    };
    fetchCompany();
  }, []);

  useEffect(() => { setMounted(true); }, []);

  const menuItems = useMemo(() => [
    { name: tDashboard?.sidebar?.menu?.dashboard || (locale === 'ru' ? 'Панель' : 'Dashboard'), href: `/${locale}/dashboard`, icon: Home, mobileShow: true },
    { name: locale === 'ru' ? 'Аналитика' : 'Analytics', href: `/${locale}/dashboard/analytics`, icon: BarChart3, isPro: true, mobileShow: true },
    { name: tDashboard?.sidebar?.menu?.locations || (locale === 'ru' ? 'Локации' : 'Locații'), href: `/${locale}/dashboard/locations`, icon: MapPin, mobileShow: true },
    { name: tDashboard?.sidebar?.menu?.employees || (locale === 'ru' ? 'Сотрудники' : 'Angajați'), href: `/${locale}/dashboard/employees`, icon: Users, mobileShow: true },
    { name: tDashboard?.sidebar?.menu?.reviews || (locale === 'ru' ? 'Отзывы' : 'Recenzii'), href: `/${locale}/dashboard/reviews`, icon: MessageSquare, mobileShow: false },
    { name: tDashboard?.sidebar?.menu?.billing || (locale === 'ru' ? 'Абонемент' : 'Abonament'), href: `/${locale}/dashboard/subscription`, icon: CreditCard, mobileShow: false },
    { name: tDashboard?.sidebar?.menu?.settings || (locale === 'ru' ? 'Настройки' : 'Setări'), href: `/${locale}/dashboard/settings`, icon: Settings, mobileShow: false },
    ...(isAdmin ? [{ name: 'SuperAdmin', href: `/${locale}/dashboard/superadmin`, icon: Shield, mobileShow: false }] : []),
  ], [tDashboard, locale, isAdmin]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
  };

  const trialPercent = trialDays !== null ? Math.round((trialDays / 7) * 100) : 0;
  const trialUrgency = trialDays !== null
    ? trialDays <= 1 ? 'urgent' : trialDays <= 3 ? 'warning' : 'normal'
    : 'normal';

  if (!mounted) return <div className="h-16 md:h-screen md:w-[260px] shrink-0" />;

  return (
    <>
      {/* ══════════════════════════════════ */}
      {/* DESKTOP SIDEBAR — LIGHT           */}
      {/* ══════════════════════════════════ */}
      <aside className="hidden md:flex w-[260px] shrink-0 h-screen fixed left-0 top-0 z-50 p-3 select-none">
        <div className="flex flex-col w-full h-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white">

          {/* Top accent line */}
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 shrink-0"/>

          {/* LOGO */}
          <div className="px-5 pt-5 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-200">
                <Zap className="text-white fill-white" size={16}/>
              </div>
              <div>
                <p className="text-slate-900 font-black text-base italic uppercase tracking-tight leading-none">
                  QRate<span className="text-blue-600">.md</span>
                </p>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">
                  {locale === 'ru' ? 'Платформа отзывов' : 'Platformă feedback'}
                </p>
              </div>
            </div>
          </div>

          {/* COMPANY + STATUS */}
          <div className="px-3 pb-3 shrink-0">
            {companyName && (
              <div className="px-3 py-2.5 rounded-2xl border border-slate-100 bg-slate-50 mb-2">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                  {locale === 'ru' ? 'Компания' : 'Companie'}
                </p>
                <p className="text-slate-800 text-xs font-black truncate mt-0.5">{companyName}</p>
              </div>
            )}

            {/* Admin badge */}
            {!loading && isAdmin && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-violet-200 bg-violet-50 mb-2">
                <Shield size={12} className="text-violet-600 shrink-0"/>
                <div>
                  <p className="text-violet-700 text-[9px] font-black uppercase tracking-wider leading-none">Super Admin</p>
                  <p className="text-violet-500 text-[9px] mt-0.5">Acces complet</p>
                </div>
              </div>
            )}

            {/* PRO badge */}
            {!loading && isPro && !isAdmin && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-emerald-200 bg-emerald-50">
                <Star size={12} className="text-emerald-600 fill-emerald-400/50 shrink-0"/>
                <div>
                  <p className="text-emerald-700 text-[9px] font-black uppercase tracking-wider leading-none">Pro Active</p>
                  <p className="text-emerald-500 text-[9px] mt-0.5">{locale === 'ru' ? 'Toate funcțiile active' : 'Toate funcțiile active'}</p>
                </div>
              </div>
            )}

            {/* Trial countdown */}
            {!loading && !isPro && trialDays !== null && (
              <Link href={`/${locale}/dashboard/subscription`}
                className={`flex items-center justify-between px-3 py-2 rounded-2xl border transition-all group ${
                  trialUrgency === 'urgent' ? 'border-rose-200 bg-rose-50 hover:bg-rose-100'
                  : trialUrgency === 'warning' ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                }`}>
                <div className="flex items-center gap-2">
                  <Clock size={12} className={
                    trialUrgency === 'urgent' ? 'text-rose-500'
                    : trialUrgency === 'warning' ? 'text-amber-500'
                    : 'text-blue-500'
                  }/>
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-wider leading-none ${
                      trialUrgency === 'urgent' ? 'text-rose-600'
                      : trialUrgency === 'warning' ? 'text-amber-600'
                      : 'text-blue-600'
                    }`}>
                      {locale === 'ru' ? 'Пробный период' : 'Trial gratuit'}
                    </p>
                    <p className="text-slate-500 text-[9px] mt-0.5">
                      {trialDays} {locale === 'ru' ? (trialDays === 1 ? 'день' : 'дней') : (trialDays === 1 ? 'zi' : 'zile')} {locale === 'ru' ? 'осталось' : 'rămase'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      trialUrgency === 'urgent' ? 'bg-rose-500'
                      : trialUrgency === 'warning' ? 'bg-amber-500'
                      : 'bg-blue-500'
                    }`} style={{width:`${trialPercent}%`}}/>
                  </div>
                  <Sparkles size={11} className={
                    trialUrgency === 'urgent' ? 'text-rose-400'
                    : trialUrgency === 'warning' ? 'text-amber-400'
                    : 'text-blue-400'
                  }/>
                </div>
              </Link>
            )}

            {/* Trial expired */}
            {!loading && !isPro && trialDays === 0 && (
              <Link href={`/${locale}/dashboard/subscription`}
                className="flex items-center justify-between px-3 py-2 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-all">
                <div>
                  <p className="text-rose-600 text-[9px] font-black uppercase">Trial Expirat</p>
                  <p className="text-rose-400 text-[9px]">{locale === 'ru' ? 'Activează acum' : 'Activează acum'}</p>
                </div>
                <span className="bg-rose-600 text-white px-2 py-1 rounded-lg text-[9px] font-black">↑ PRO</span>
              </Link>
            )}
          </div>

          {/* SEPARATOR */}
          <div className="mx-4 h-px bg-slate-100 mb-3 shrink-0"/>

          {/* MENU */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden min-h-0">
            <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              {locale === 'ru' ? 'Навигация' : 'Navigare'}
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isSuper = item.href.includes('superadmin');
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-2xl font-black transition-all duration-150 group ${
                    isActive
                      ? isSuper ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : isSuper ? 'text-violet-600 hover:bg-violet-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2}
                      className={`shrink-0 transition-all ${
                        isActive ? 'text-white'
                        : isSuper ? 'text-violet-500'
                        : item.isPro ? 'text-indigo-500'
                        : 'text-slate-400 group-hover:text-slate-700'
                      }`}/>
                    <span className="text-[12px] uppercase tracking-wide">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.isPro && !isActive && (
                      <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md uppercase border border-indigo-200">PRO</span>
                    )}
                    {isActive && <ChevronRight size={13} className="text-white/70"/>}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* LOGOUT */}
          <div className="px-3 pb-4 pt-3 shrink-0">
            <div className="h-px bg-slate-100 mb-3"/>
            <button onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-400 hover:text-rose-500 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all border border-slate-200 hover:border-rose-200 hover:bg-rose-50">
              <LogOut size={14}/>
              {locale === 'ru' ? 'Выйти' : 'Ieșire'}
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════ */}
      {/* MOBILE TOP BAR — LIGHT            */}
      {/* ══════════════════════════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <Zap className="text-white fill-white" size={14}/>
          </div>
          <span className="font-black text-base italic uppercase text-slate-900">
            QRate<span className="text-blue-600">.md</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !isPro && trialDays !== null && trialDays <= 3 && (
            <Link href={`/${locale}/dashboard/subscription`}
              className={`text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl ${
                trialUrgency === 'urgent' ? 'bg-rose-500' : 'bg-amber-500'
              }`}>
              {trialDays}d trial
            </Link>
          )}
          {isAdmin && (
            <Link href={`/${locale}/dashboard/superadmin`}
              className="text-violet-600 bg-violet-100 text-[9px] font-black uppercase px-2 py-1.5 rounded-xl border border-violet-200">
              Admin
            </Link>
          )}
          <button onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <Menu size={18} className="text-slate-700"/>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════ */}
      {/* MOBILE BOTTOM NAV — LIGHT         */}
      {/* ══════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex items-center justify-around px-1 py-2">
          {menuItems.filter(i => i.mobileShow).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-w-[56px] ${
                  isActive ? 'bg-blue-600' : 'hover:bg-slate-50'
                }`}>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2}
                  className={`${isActive ? 'text-white' : item.isPro ? 'text-indigo-500' : 'text-slate-400'}`}/>
                <span className={`text-[8px] font-black uppercase tracking-tight mt-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
          <button onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[56px] hover:bg-slate-50">
            <Menu size={19} strokeWidth={2} className="text-slate-400"/>
            <span className="text-[8px] font-black uppercase tracking-tight mt-1 text-slate-400">
              {locale === 'ru' ? 'Ещё' : 'Mai mult'}
            </span>
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════ */}
      {/* MOBILE OVERLAY — LIGHT            */}
      {/* ══════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}/>
          <div className="relative w-full bg-white rounded-t-[2rem] shadow-2xl p-5 pb-10 border-t border-slate-100">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-5"/>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="text-white fill-white" size={14}/>
                </div>
                <span className="font-black text-base italic uppercase text-slate-900">
                  QRate<span className="text-blue-600">.md</span>
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                <X size={16} className="text-slate-600"/>
              </button>
            </div>

            {/* Status banner */}
            {!loading && !isPro && trialDays !== null && (
              <Link href={`/${locale}/dashboard/subscription`} onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border mb-4 ${
                  trialUrgency === 'urgent' ? 'border-rose-200 bg-rose-50'
                  : trialUrgency === 'warning' ? 'border-amber-200 bg-amber-50'
                  : 'border-blue-200 bg-blue-50'
                }`}>
                <div className="flex items-center gap-2">
                  <Clock size={14} className={trialUrgency === 'urgent' ? 'text-rose-500' : trialUrgency === 'warning' ? 'text-amber-500' : 'text-blue-500'}/>
                  <div>
                    <p className="text-slate-800 text-xs font-black">{locale === 'ru' ? 'Пробный период' : 'Trial activ'}</p>
                    <p className={`text-[10px] font-bold ${trialUrgency === 'urgent' ? 'text-rose-500' : trialUrgency === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}>
                      {trialDays} {locale === 'ru' ? 'дней осталось' : 'zile rămase'}
                    </p>
                  </div>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
                  <Sparkles size={10}/> PRO
                </span>
              </Link>
            )}

            {!loading && isPro && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 mb-4">
                <Star size={14} className="text-emerald-600 fill-emerald-400/50"/>
                <p className="text-emerald-700 text-xs font-black">{isAdmin ? '⚡ Super Admin — Acces complet' : '✅ Plan Pro activ — toate funcțiile'}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isSuper = item.href.includes('superadmin');
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all border ${
                      isActive
                        ? isSuper ? 'bg-violet-600 border-violet-500' : 'bg-blue-600 border-blue-500'
                        : isSuper ? 'border-violet-200 bg-violet-50 hover:bg-violet-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                    <div className={`p-1.5 rounded-xl shrink-0 ${
                      isActive ? 'bg-white/20'
                      : isSuper ? 'bg-violet-100'
                      : item.isPro ? 'bg-indigo-100' : 'bg-slate-100'
                    }`}>
                      <Icon size={16} strokeWidth={2}
                        className={`${
                          isActive ? 'text-white'
                          : isSuper ? 'text-violet-600'
                          : item.isPro ? 'text-indigo-500' : 'text-slate-500'
                        }`}/>
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-black uppercase tracking-wide block truncate ${
                        isActive ? 'text-white' : isSuper ? 'text-violet-700' : 'text-slate-700'
                      }`}>{item.name}</span>
                      {item.isPro && !isActive && <span className="text-[8px] font-black text-indigo-500 uppercase">PRO</span>}
                    </div>
                  </Link>
                );
              })}
            </div>

            <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-slate-500 hover:text-rose-500 rounded-2xl font-black text-xs uppercase tracking-wider border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-all">
              <LogOut size={15}/>
              {locale === 'ru' ? 'Выйти din аккаунт' : 'Ieșire din cont'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}