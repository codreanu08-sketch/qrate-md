'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Check, Mail, Trash2, Plus, Truck, QrCode, 
  Send, BarChart3, Globe, Cookie, ShieldCheck, LogOut, 
  LayoutDashboard, ShieldAlert, BellRing
} from 'lucide-react';
import { Link, usePathname, useRouter, locales } from '@/i18n/config'; 
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const t = useTranslations('LandingPage');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [showNotification, setShowNotification] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- STATE-URI CONFIGURATOR ABONAMENTE ---
  const [locs, setLocs] = useState(1);
  const [stickerCount, setStickerCount] = useState(500);
  const [isStickersAdded, setIsStickersAdded] = useState(false);

  const handleLocChange = (val: number) => {
    setLocs(val);
  };

  const validateStickers = () => {
    if (stickerCount < 500) setStickerCount(500);
  };

  // Planul Start este strict pentru 1 singură locație
  const isStartPlan = locs === 1;
  // Planul Pro se activează automat dacă sunt mai multe locații
  const isProPlan = locs > 1;

  // Calcul tarife reflectând eliminarea angajaților extra
  const startBaseCost = 650;
  const proBaseCostPerLocation = 600;

  const currentSoftwareTotal = isStartPlan 
    ? startBaseCost 
    : (locs * proBaseCostPerLocation);

  const stickerTotal = isStickersAdded ? parseFloat((stickerCount * 0.33).toFixed(2)) : 0;
  const grandTotal = currentSoftwareTotal + stickerTotal;

  const switchLanguage = (newLocale: typeof locales[number]) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  // --- HOOK USER ȘI COOKIES ---
  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted) setIsLoggedIn(!!user);
    };
    checkUser();

   const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (isMounted) setIsLoggedIn(!!session);
    });

    const consent = localStorage.getItem('qrate_cookie_consent');
    let timer: NodeJS.Timeout;
    if (!consent) {
      timer = setTimeout(() => {
        if (isMounted) setShowCookieBanner(true);
      }, 1500);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('qrate_cookie_consent', 'accepted');
    setShowCookieBanner(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.refresh();
  };

  // --- HOOK NOTIFICĂRI OPTIMIZAT CU CLEANUP ---
  useEffect(() => {
    let notificationTimer: NodeJS.Timeout;
    
    const interval = setInterval(() => {
      setShowNotification(true);
      notificationTimer = setTimeout(() => setShowNotification(false), 3500);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (notificationTimer) clearTimeout(notificationTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 scroll-smooth">
      
      {/* HEADER SEMANTIC PENTRU SEO */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
        <nav className="max-w-7xl w-full bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] px-8 h-20 flex items-center justify-between transition-all" aria-label="Navigare Principală">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic text-slate-950">QRate<span className="text-blue-600">.MD</span></span>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              <a href="#servicii" className="hover:text-blue-600 hover:tracking-[0.3em] transition-all duration-300">{t('nav.services')}</a>
              <a href="#vizual-demo" className="hover:text-blue-600 hover:tracking-[0.3em] transition-all duration-300">{t('nav.demo')}</a>
              <a href="#preturi" className="hover:text-blue-600 hover:tracking-[0.3em] transition-all duration-300">{t('nav.pricing')}</a>
            </div>

            <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button type="button" onClick={() => switchLanguage('ro')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${locale === 'ro' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>RO</button>
              <button type="button" onClick={() => switchLanguage('ru')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${locale === 'ru' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>RU</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
                <Link href="/dashboard" className="flex items-center gap-2 bg-white hover:bg-blue-50 hover:text-blue-600 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 transition-all text-[10px] font-black uppercase tracking-wider">
                  <LayoutDashboard size={14} className="text-blue-600" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
                <button type="button" onClick={handleLogout} className="bg-white hover:bg-red-50 hover:text-red-600 p-2.5 rounded-xl border border-slate-200 text-slate-400 transition-all active:scale-95 flex items-center justify-center" title={t('nav.logout_title')}>
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 px-4 transition-colors">{t('nav.login')}</Link>
                <Link href="/auth/register" className="relative group overflow-hidden bg-slate-950 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-xl active:scale-95">
                  <span className="relative z-10">{t('nav.signup')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* --- HERO SECTION --- */}
        <section className="pt-36 pb-24 px-6 text-center">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 text-blue-700 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] animate-bounce">
              <Zap size={14} /> {t('hero.badge')}
            </div>
            <h1 className="text-6xl md:text-[100px] font-[900] tracking-tighter text-slate-950 uppercase leading-[0.8] mb-6">
              {t('hero.title_part1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-indigo-800 italic">{t('hero.title_part2')}</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic">{t('hero.description')}</p>
            <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="w-full sm:w-auto bg-blue-600 text-white px-14 py-8 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-all text-center">
                {isLoggedIn ? t('hero.btn_go_dashboard') : t('hero.btn_start')}
              </Link>
            </div>
          </div>
        </section>

        {/* --- SECȚIUNEA SERVICII --- */}
        <section id="servicii" className="py-24 px-6 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-blue-600 font-black uppercase text-[11px] tracking-[0.4em]">{t('services_section.badge')}</h2>
              <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{t('services_section.title')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              <article className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all"><QrCode size={32}/></div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic text-slate-950">{t('services.qr_employee.title')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{t('services.qr_employee.desc')}</p>
              </article>
              <article className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                <div className="bg-indigo-600 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all"><Send size={32}/></div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic text-slate-950">{t('services.telegram.title')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{t('services.telegram.desc')}</p>
              </article>
              <article className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                <div className="bg-slate-950 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all"><BarChart3 size={32}/></div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic text-slate-950">{t('services.management.title')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{t('services.management.desc')}</p>
              </article>
            </div>
          </div>
        </section>

        {/* --- DEMO VIZUAL --- */}
        <section id="vizual-demo" className="py-32 px-6 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-950 rounded-[4rem] p-8 md:p-20 overflow-hidden relative border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -mr-64 -mt-64 rounded-full"></div>
              <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10 text-left">
                <div className="space-y-10">
                  <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85]">
                    {t('demo.title_1')} <br /><span className="text-blue-500 italic">{t('demo.title_2')}</span>
                  </h2>
                  <div className="space-y-4">
                    {[
                      { icon: <Zap size={20}/>, t: t('demo.feature_1_t'), d: t('demo.feature_1_d') },
                      { icon: <ShieldAlert size={20}/>, t: t('demo.feature_2_t'), d: t('demo.feature_2_d') },
                      { icon: <Check size={20}/>, t: t('demo.feature_3_t'), d: t('demo.feature_3_d') }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-5 items-center bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-4 bg-white/10 text-blue-400 rounded-xl">{step.icon}</div>
                        <div>
                          <h4 className="text-white font-black uppercase text-xs tracking-widest">{step.t}</h4>
                          <p className="text-slate-400 text-sm font-medium">{step.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative flex justify-center scale-90 md:scale-100">
                  <div className="relative w-[340px] h-[680px] bg-slate-900 rounded-[4rem] border-[12px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="bg-white h-full w-full p-8 flex flex-col items-center text-center space-y-10 relative">
                      <div className={`absolute top-6 left-4 right-4 z-20 transition-all duration-700 transform ${showNotification ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'}`}>
                        <div className="bg-slate-950 text-white p-5 rounded-3xl shadow-2xl border border-white/10 flex items-start gap-4 text-left">
                          <div className="bg-red-500 p-2.5 rounded-xl animate-pulse"><BellRing size={18} className="text-white" /></div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">{t('demo.notification_badge')}</p>
                            <p className="text-[11px] font-bold text-slate-200">{t('demo.notification_text')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black italic text-2xl mt-12 shadow-xl shadow-blue-100">Q</div>
                      <div className="space-y-2 text-left w-full"><h4 className="font-black text-slate-950 text-2xl uppercase tracking-tighter leading-none">{t('demo.phone_title')}</h4></div>
                      <div className="flex gap-2.5 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-white flex items-center justify-center text-2xl shadow-lg shadow-yellow-100">★</div>
                        <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-white flex items-center justify-center text-2xl shadow-lg shadow-yellow-100">★</div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center text-2xl">★</div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center text-2xl">★</div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center text-2xl">★</div>
                      </div>
                      <div className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-xs text-slate-400 font-bold italic h-32 text-left">{t('demo.phone_placeholder')}</div>
                      <button type="button" className="w-full py-6 bg-red-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.25em] shadow-xl shadow-red-100">{t('demo.phone_btn')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECȚIUNEA CONFIGURATOR ȘI TARIFE --- */}
        <section id="preturi" className="py-32 px-6 scroll-mt-24 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-blue-600 font-black uppercase text-[11px] tracking-[0.4em] mb-3">{t('pricing.badge')}</h2>
              <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                {t('pricing.title_part1')} <span className="text-blue-600">{t('pricing.title_part2')}</span>
              </p>
            </div>

            {/* Configurator */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-around gap-8 mb-12">
              <div className="flex flex-col items-center w-full md:w-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{t('pricing.configurator.locations')}</span>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => handleLocChange(Math.max(1, locs - 1))} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">-</button>
                  <span className="text-4xl font-black w-12 text-center">{locs}</span>
                  <button type="button" onClick={() => handleLocChange(locs + 1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">+</button>
                </div>
              </div>

              <div className={`flex flex-col items-center transition-all duration-300 ${isProPlan ? 'opacity-100 scale-110 text-blue-600' : 'opacity-20 grayscale'}`}>
                 <ShieldCheck size={40} />
                 <span className="text-[9px] font-black uppercase mt-2 tracking-tighter">PRO PLAN ACTIVATED</span>
              </div>
            </div>

            {/* Stickere */}
            <div className={`transition-all duration-500 p-6 rounded-[2.5rem] shadow-lg flex flex-col md:flex-row items-center gap-6 mb-12 border-b-4 ${isStickersAdded ? 'bg-blue-600 text-white border-blue-800 scale-[1.01]' : 'bg-slate-900 text-white border-slate-700'}`}>
              <div className={`p-4 rounded-2xl ${isStickersAdded ? 'bg-white text-blue-600' : 'bg-blue-600'}`}><QrCode size={32} /></div>
              <div className="text-left flex-1">
                <h4 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2"><Truck size={20} /> {t('pricing.stickers.title')}</h4>
                <p className="text-[10px] font-bold opacity-70 italic uppercase tracking-wider text-blue-100">{t('pricing.stickers.subtitle')}</p>
              </div>
              <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
                <div className="flex flex-col items-center px-2">
                  <span className="text-[8px] uppercase opacity-50 font-bold mb-1">{t('pricing.stickers.quantity')}</span>
                  <input type="number" value={stickerCount} onChange={(e) => setStickerCount(parseInt(e.target.value) || 0)} onBlur={validateStickers} className="bg-transparent text-xl font-black w-20 text-center focus:outline-none border-b-2 border-white/20 text-white" />
                </div>
                <div className="text-right pr-4 border-l border-white/10 pl-4">
                  <div className="text-md font-black">{(stickerCount * 0.33).toFixed(2)} MDL</div>
                  <div className="text-[8px] uppercase opacity-50">{t('pricing.stickers.cost_production')}</div>
                </div>
                <button type="button" onClick={() => setIsStickersAdded(!isStickersAdded)} className={`p-3 rounded-lg transition-all ${isStickersAdded ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-400'}`}>
                  {isStickersAdded ? <Trash2 size={18} /> : <Plus size={18} />}
                </button>
              </div>
            </div>

            {/* Grid Planuri */}
            <div className="grid md:grid-cols-2 gap-10 items-stretch mb-16">
              
              {/* Card 1: Planul Start */}
              <article className={`p-12 rounded-[4rem] border-[4px] transition-all duration-500 bg-white relative flex flex-col justify-between ${isStartPlan ? 'border-blue-600 shadow-2xl scale-[1.02] z-10 opacity-100' : 'border-slate-100 opacity-60'}`}>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Zap size={32} /></div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{t('pricing.plans.license_monthly')}</p>
                      <p className="text-4xl font-black text-slate-950">650 MDL</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">1 {t('pricing.plans.one_location')}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-black uppercase tracking-widest mb-6 text-blue-600 italic">
                    {t('pricing.plans.start_name')}
                  </h3>

                  <ul className="space-y-4 mb-12 text-slate-700 font-medium text-xs font-black uppercase tracking-wider">
                    <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.start_feat_1')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.start_feat_2')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.start_feat_3')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.start_feat_4')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.start_feat_5')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.start_feat_6')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.start_feat_7')}</li>
                  </ul>
                </div>
                <Link 
  href={
    isLoggedIn 
      ? { 
          pathname: '/dashboard', 
          query: { 
            setup: 'start', 
            locs: '1', 
            stickers: isStickersAdded ? stickerCount : 0 
          } 
        } 
      : '/auth/register'
  } 
  className="block w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-lg shadow-blue-200 hover:bg-slate-950 transition-all text-center"
>
  {isLoggedIn ? t('pricing.plans.btn_activate_dashboard') : t('pricing.btn_register')}
</Link>
                  {isLoggedIn ? t('pricing.plans.btn_activate_dashboard') : t('pricing.btn_choose')}
                </Link>
              </article>

              {/* Card 2: Planul Pro */}
              <article className={`p-12 rounded-[4rem] border-[4px] transition-all duration-500 bg-slate-950 text-white relative flex flex-col justify-between ${isProPlan ? 'border-blue-500 shadow-2xl scale-[1.02] z-10 opacity-100' : 'border-transparent opacity-60'}`}>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400"><ShieldCheck size={32} /></div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase">{t('pricing.plans.license_monthly')}</p>
                      <p className="text-4xl font-black text-blue-400">
                        {isProPlan ? `${locs * proBaseCostPerLocation} MDL` : `600 MDL`}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                        {locs} {locs === 1 ? t('pricing.plans.one_location') : t('pricing.plans.more_locations')}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-black uppercase tracking-widest mb-6 text-blue-400 italic">
                    {t('pricing.plans.pro_name')}
                  </h3>

                  <ul className="space-y-4 mb-12 text-slate-300 font-medium text-xs font-black uppercase tracking-wider">
                    <li className="flex items-center gap-3 text-blue-400 italic"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_1')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_2')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_3')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_4')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_5')}</li>
                    <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_6')}</li>
                  </ul>
                </div>
                <Link href={isLoggedIn ? `/dashboard?setup=pro&locs=${locs}&stickers=${isStickersAdded ? stickerCount : 0}` : '/auth/register'} className="block w-full bg-white text-slate-950 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all text-center">
                  {isLoggedIn ? t('pricing.plans.btn_activate_dashboard') : t('pricing.btn_choose')}
                </Link>
              </article>
            </div>

            {/* Total Estimativ */}
            <div className="max-w-md mx-auto bg-slate-900 border-b-4 border-blue-600 rounded-[2rem] p-6 text-white text-center shadow-2xl">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">{t('pricing.total.estimated_total')}</span>
              <h3 className="text-4xl font-black text-white mt-1">{grandTotal.toFixed(2)} MDL</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2 italic">
                {isStickersAdded ? `${t('pricing.total.breakdown_part1')} ${currentSoftwareTotal} MDL + ${t('pricing.total.breakdown_part2')} ${stickerTotal} MDL)` : t('pricing.total.only_software')}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-2 rounded-xl"><Zap className="text-white fill-white" size={18} /></div>
                <span className="text-xl font-black uppercase tracking-tighter italic">QRate<span className="text-blue-600">.MD</span></span>
              </div>
              <address className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed italic not-italic">{t('footer.company_name')} <br />{t('footer.location')}</address>
            </div>
            <div className="space-y-8">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{t('footer.docs_title')}</h4>
              <nav aria-label="Documente Legale">
                <ul className="space-y-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <li><Link href="/legal/terms" className="hover:text-blue-600 transition-colors">{t('footer.terms')}</Link></li>
                  <li><Link href="/legal/privacy" className="hover:text-blue-600 transition-colors">{t('footer.privacy')}</Link></li>
                  <li><Link href="/legal/refund" className="hover:text-blue-600 transition-colors">{t('footer.refund_policy')}</Link></li>
                </ul>
              </nav>
            </div>
            <div className="space-y-8">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{t('footer.support_title')}</h4>
              <ul className="space-y-5 text-xs font-black text-slate-400 uppercase tracking-widest italic">
                <li className="flex items-center gap-3"><Mail size={16} className="text-blue-600"/> hello@qrate.md</li>
                <li className="flex items-center gap-3"><Globe size={16} className="text-blue-600"/> qrate.md</li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{t('footer.payments_title')}</h4>
              <div className="space-y-6 grayscale opacity-60">
                <div className="text-[14px] font-black text-slate-800 tracking-tighter">maib</div>
                <div className="flex gap-4"><span className="text-[10px] font-bold">VISA</span><span className="text-[10px] font-bold">MASTERCARD</span></div>
              </div>
            </div>
          </div>
          <div className="text-center pt-16 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">© 2026 QRate Moldova • {t('footer.rights')}</p>
          </div>
        </div>
      </footer>

      {/* --- COOKIE CONSENT BANNER --- */}
      {showCookieBanner && (
        <aside role="dialog" aria-live="polite" className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-slate-900 text-white p-6 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.25)] border border-slate-800 z-50">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600/20 p-2.5 rounded-xl text-blue-400 mt-1 shrink-0"><Cookie size={20} /></div>
            <div className="text-left w-full">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">{t('cookies.title')}</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">{t('cookies.description')}</p>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleAcceptCookies} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">{t('cookies.btn_accept')}</button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}