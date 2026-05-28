'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Check, Mail, Trash2, Plus, Truck, QrCode, 
  Send, BarChart3, Globe, Cookie, ShieldCheck, LogOut, 
  LayoutDashboard, ShieldAlert, BellRing,
  Activity, Star, Trophy, Sparkles, Building,
  MessageCircle, TrendingUp, Shield, Clock, Users,
  Smartphone, MapPin, Bot, RefreshCw, ExternalLink,
  ChevronRight, Flame, Target, Award
} from 'lucide-react';
import { Link, usePathname, useRouter, locales } from '@/i18n/config'; 
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const PRICING_PLANS = [
  { id: 'START',      locations: 1, maxEmployees: 5,   price: 450,  label: 'START' },
  { id: 'GROW',       locations: 2, maxEmployees: 10,  price: 700,  label: 'GROW' },
  { id: 'SCALE',      locations: 3, maxEmployees: 15,  price: 1050, label: 'SCALE' },
  { id: 'PRO',        locations: 4, maxEmployees: 20,  price: 1300, label: 'PRO' },
  { id: 'PRO_PLUS',   locations: 5, maxEmployees: 25,  price: 1500, label: 'PRO+' },
  { id: 'ENTERPRISE', locations: 6, maxEmployees: 999, price: 1700, label: 'ENTERPRISE' },
];

// ✅ TOATE FUNCȚIILE PLATFORMEI
const FEATURES = [
  { icon: <QrCode size={24}/>, color: 'bg-blue-100 text-blue-600', title: 'QR Coduri Unice', desc: 'Cod QR pentru fiecare locație sau angajat. Clientul scanează și lasă recenzie în 2 click-uri.' },
  { icon: <Send size={24}/>, color: 'bg-indigo-100 text-indigo-600', title: 'Alerte Telegram', desc: 'Primești notificare instantanee pe Telegram la fiecare recenzie negativă nouă.' },
  { icon: <BarChart3 size={24}/>, color: 'bg-violet-100 text-violet-600', title: 'Analytics Avansat', desc: 'Heatmap orar, comparativ locații, leaderboard angajați, mood timeline și QRate Score 0-100.' },
  { icon: <Sparkles size={24}/>, color: 'bg-amber-100 text-amber-600', title: 'AI Predicții', desc: 'Pe baza trendului ultimelor 4 săptămâni, sistemul prezice nota medie pentru luna viitoare.' },
  { icon: <Flame size={24}/>, color: 'bg-rose-100 text-rose-600', title: 'Crisis Mode', desc: '3+ recenzii negative în 30 min → alertă roșie imediată pe Telegram cu mesaj de criză pregătit.' },
  { icon: <Trophy size={24}/>, color: 'bg-amber-100 text-amber-700', title: 'Recovery Win', desc: 'Clientul nemulțumit revine după 7+ zile și lasă 4-5 stele → notificare 🏆 automată.' },
  { icon: <Star size={24}/>, color: 'bg-emerald-100 text-emerald-600', title: 'Google Reviews', desc: 'Clienții fericiți (4-5★) sunt redirecționați automat spre pagina ta de Google Reviews.' },
  { icon: <Bot size={24}/>, color: 'bg-blue-100 text-blue-700', title: 'AI Răspuns Smart', desc: 'Generează instant răspunsuri personalizate pozitive sau negative. Copiezi sau trimiți pe WhatsApp.' },
  { icon: <Smartphone size={24}/>, color: 'bg-green-100 text-green-600', title: 'WhatsApp Follow-up', desc: 'Lista clienților nemulțumiți cu telefon. Trimiți mesaj de recuperare direct pe WhatsApp.' },
  { icon: <Shield size={24}/>, color: 'bg-slate-100 text-slate-600', title: 'QRate Verified Badge', desc: 'Widget embed pentru site-ul tău cu nota medie și numărul de recenzii. Ca TrustPilot, dar local.' },
  { icon: <Users size={24}/>, color: 'bg-purple-100 text-purple-600', title: 'Multi-Locații', desc: 'Gestionezi toate locațiile dintr-un singur panou. Fiecare cu QR, statistici și link Google propriu.' },
  { icon: <Target size={24}/>, color: 'bg-orange-100 text-orange-600', title: 'Keywords Negativi', desc: 'Detectare automată a cuvintelor problemă din recenzii. Alertă roșie dacă apar 3+ ori.' },
];

// Ticker items
const TICKER_ITEMS = [
  '⭐ QRate Score 0-100',
  '🚨 Crisis Mode Telegram',
  '🏆 Recovery Win Tracking',
  '📊 Heatmap Orar',
  '🤖 AI Răspuns Smart',
  '📍 Multi-Locații',
  '💬 WhatsApp Follow-up',
  '🔵 Google Reviews Redirect',
  '🏅 Employee Leaderboard',
  '🔮 AI Predicții Luna Viitoare',
  '✅ QRate Verified Badge',
  '🎯 Keywords Negativi',
];

export default function LandingPage() {
  const t = useTranslations('LandingPage');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [showNotification, setShowNotification] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [stickerCount, setStickerCount] = useState(500);
  const [isStickersAdded, setIsStickersAdded] = useState(false);

  const currentPlan = PRICING_PLANS[selectedPlanIndex];
  const stickerTotal = isStickersAdded ? parseFloat((stickerCount * 0.33).toFixed(2)) : 0;
  const grandTotal = currentPlan.price + stickerTotal;

  const validateStickers = () => { if (stickerCount < 500) setStickerCount(500); };

  const switchLanguage = (newLocale: typeof locales[number]) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

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
    if (!consent) timer = setTimeout(() => { if (isMounted) setShowCookieBanner(true); }, 1500);
    return () => { isMounted = false; if (timer) clearTimeout(timer); subscription.unsubscribe(); };
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

  useEffect(() => {
    let notificationTimer: NodeJS.Timeout;
    const interval = setInterval(() => {
      setShowNotification(true);
      notificationTimer = setTimeout(() => setShowNotification(false), 3500);
    }, 5000);
    return () => { clearInterval(interval); if (notificationTimer) clearTimeout(notificationTimer); };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 scroll-smooth">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-2 md:p-4">
        <nav className="max-w-7xl w-full bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between transition-all">
          <div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer shrink-0">
            <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="text-white fill-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-lg md:text-xl font-black uppercase tracking-tighter italic text-slate-950">
              QRate<span className="text-blue-600 hidden sm:inline">.MD</span>
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              <a href="#servicii" className="hover:text-blue-600 transition-all duration-300">{t('nav.services')}</a>
              <a href="#functii" className="hover:text-blue-600 transition-all duration-300">{locale === 'ru' ? 'Функции' : 'Funcții'}</a>
              <a href="#vizual-demo" className="hover:text-blue-600 transition-all duration-300">{t('nav.demo')}</a>
              <a href="#preturi" className="hover:text-blue-600 transition-all duration-300">{t('nav.pricing')}</a>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-lg md:rounded-2xl border border-slate-200 shadow-inner">
              <button type="button" onClick={() => switchLanguage('ro')} className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black transition-all duration-300 ${locale === 'ro' ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>RO</button>
              <button type="button" onClick={() => switchLanguage('ru')} className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black transition-all duration-300 ${locale === 'ru' ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>RU</button>
            </div>
            {isLoggedIn ? (
              <div className="flex items-center gap-1 md:gap-2 bg-slate-50 p-1 md:p-1.5 rounded-lg md:rounded-2xl border border-slate-200/60 shadow-sm">
                <Link href="/dashboard" className="flex items-center gap-1.5 md:gap-2 bg-white hover:bg-blue-50 hover:text-blue-600 px-2 md:px-4 py-1.5 md:py-2.5 rounded-md md:rounded-xl border border-slate-200 text-slate-700 transition-all text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                  <LayoutDashboard size={14} className="text-blue-600" />
                  <span className="hidden sm:inline">{t('nav.dashboard')}</span>
                </Link>
                <button type="button" onClick={handleLogout} className="bg-white hover:bg-red-50 hover:text-red-600 p-1.5 md:p-2.5 rounded-md md:rounded-xl border border-slate-200 text-slate-400 transition-all active:scale-95 flex items-center justify-center" title={t('nav.logout_title')}>
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 px-1 md:px-2 transition-colors whitespace-nowrap">{t('nav.login')}</Link>
                <Link href="/auth/register" className="relative group overflow-hidden bg-slate-950 text-white px-3 py-2 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all hover:shadow-xl active:scale-95 whitespace-nowrap">
                  <span className="relative z-10">{t('nav.signup')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-20">

        {/* HERO */}
        <section className="pt-36 pb-16 px-6 text-center">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 text-blue-700 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] animate-bounce">
              <Zap size={14} /> {t('hero.badge')}
            </div>
            <h1 className="text-4xl md:text-6xl font-[900] tracking-tighter text-slate-950 uppercase leading-[0.9] mb-4">
              {t('hero.title_part1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-indigo-800 italic">{t('hero.title_part2')}</span>
            </h1>
            <div className="max-w-5xl mx-auto">
              <div className="bg-white border border-slate-200 shadow-2xl rounded-[3.5rem] p-8 md:p-14 text-left">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                    <Sparkles size={14} /> POWERED BY QRATE AI
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mt-4">{t('hero_banner.heading')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: <Activity size={28}/>, color: 'bg-emerald-100 text-emerald-600', title: t('hero_banner.feature1_title'), desc: t('hero_banner.feature1_desc') },
                    { icon: <Star size={28}/>, color: 'bg-amber-100 text-amber-600', title: t('hero_banner.feature2_title'), desc: t('hero_banner.feature2_desc') },
                    { icon: <Trophy size={28}/>, color: 'bg-indigo-100 text-indigo-600', title: t('hero_banner.feature3_title'), desc: t('hero_banner.feature3_desc') },
                    { icon: <Sparkles size={28}/>, color: 'bg-violet-100 text-violet-600', title: t('hero_banner.feature4_title'), desc: t('hero_banner.feature4_desc') },
                  ].map((f, i) => (
                    <div key={i} className="group flex gap-5 p-6 rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all">
                      <div className={`shrink-0 w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>{f.icon}</div>
                      <div><h4 className="font-black text-xl tracking-tight">{f.title}</h4><p className="text-slate-500 text-[15px] mt-2 leading-snug">{f.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic mt-6">{t('hero.description')}</p>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="w-full sm:w-auto bg-blue-600 text-white px-14 py-8 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-all text-center">
                {isLoggedIn ? t('hero.btn_go_dashboard') : t('hero.btn_start')}
              </Link>
            </div>
          </div>
        </section>

        {/* ✅ TICKER ANIMAT */}
        <div className="bg-slate-950 py-4 overflow-hidden border-y border-slate-800">
          <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-3 mx-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {item}
                <span className="text-blue-600 text-lg">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* SERVICII */}
        <section id="servicii" className="py-24 px-6 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-blue-600 font-black uppercase text-[11px] tracking-[0.4em]">{t('services_section.badge')}</h2>
              <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{t('services_section.title')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: <QrCode size={32}/>, color: 'bg-blue-600', title: t('services.qr_employee.title'), desc: t('services.qr_employee.desc') },
                { icon: <Send size={32}/>, color: 'bg-indigo-600', title: t('services.telegram.title'), desc: t('services.telegram.desc') },
                { icon: <BarChart3 size={32}/>, color: 'bg-slate-950', title: t('services.management.title'), desc: t('services.management.desc') },
              ].map((s, i) => (
                <article key={i} className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                  <div className={`${s.color} text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all`}>{s.icon}</div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic text-slate-950">{s.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ SECȚIUNEA FUNCȚII — CE PRIMEȘTI */}
        <section id="functii" className="py-32 px-6 bg-[#F8FAFC] scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <Award size={14} /> {locale === 'ru' ? 'Все функции платформы' : 'Tot ce primești în QRate'}
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                {locale === 'ru' ? '12 Funcții' : '12 Funcții'} <span className="text-blue-600 italic">{locale === 'ru' ? 'Puternice' : 'Puternice'}</span>
              </h2>
              <p className="text-slate-400 font-medium mt-4 max-w-xl mx-auto">
                {locale === 'ru' 
                  ? 'Tot ce are nevoie un antreprenor din Moldova pentru a gestiona reputația afacerii sale.'
                  : 'Tot ce are nevoie un antreprenor din Moldova pentru a gestiona reputația afacerii sale.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 group">
                  <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA după funcții */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-br from-slate-950 to-blue-950 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-8 text-white text-6xl">★</div>
                  <div className="absolute bottom-4 right-8 text-white text-4xl">★</div>
                  <div className="absolute top-1/2 left-1/4 text-white text-3xl">★</div>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4">
                    {locale === 'ru' ? '7 zile gratuit' : '7 zile gratuit'}
                  </p>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                    {locale === 'ru' ? 'Încearcă Gratuit' : 'Încearcă Gratuit'}
                  </h3>
                  <p className="text-slate-400 font-medium mb-8 max-w-md mx-auto">
                    {locale === 'ru'
                      ? 'Acces complet la toate funcțiile timp de 7 zile. Fără card bancar.'
                      : 'Acces complet la toate funcțiile timp de 7 zile. Fără card bancar.'}
                  </p>
                  <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all hover:scale-105 shadow-2xl shadow-blue-900/50">
                    {locale === 'ru' ? 'Începe Acum' : 'Începe Acum'} <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section id="vizual-demo" className="py-16 px-4 sm:px-6 md:py-24 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] px-5 py-12 sm:p-12 md:p-20 overflow-hidden relative border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -mr-64 -mt-64 rounded-full"></div>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 text-left">
                <div className="space-y-6 md:space-y-10">
                  <h2 className="text-3xl sm:text-4xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] sm:leading-[0.85] break-words">
                    {t('demo.title_1')} <br /><span className="text-blue-500 italic">{t('demo.title_2')}</span>
                  </h2>
                  <div className="space-y-4">
                    {[
                      { icon: <Zap size={20}/>, t: t('demo.feature_1_t'), d: t('demo.feature_1_d') },
                      { icon: <ShieldAlert size={20}/>, t: t('demo.feature_2_t'), d: t('demo.feature_2_d') },
                      { icon: <Check size={20}/>, t: t('demo.feature_3_t'), d: t('demo.feature_3_d') }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 sm:gap-5 items-center bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-3 sm:p-4 bg-white/10 text-blue-400 rounded-xl shrink-0">{step.icon}</div>
                        <div>
                          <h4 className="text-white font-black uppercase text-[10px] sm:text-xs tracking-widest">{step.t}</h4>
                          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">{step.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative flex justify-center w-full">
                  <div className="relative w-[270px] h-[550px] min-[400px]:w-[310px] min-[400px]:h-[620px] sm:w-[340px] sm:h-[680px] bg-slate-900 rounded-[2.5rem] sm:rounded-[4rem] border-[8px] sm:border-[12px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="bg-white h-full w-full p-5 sm:p-8 flex flex-col items-center text-center justify-between relative">
                      <div className={`absolute top-4 sm:top-6 left-3 right-3 sm:left-4 sm:right-4 z-20 transition-all duration-700 transform ${showNotification ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'}`}>
                        <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 flex items-start gap-3 sm:gap-4 text-left">
                          <div className="bg-red-500 p-2 sm:p-2.5 rounded-xl animate-pulse shrink-0"><BellRing size={16} className="text-white" /></div>
                          <div>
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-red-500">{t('demo.notification_badge')}</p>
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight mt-0.5">{t('demo.notification_text')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-950 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black italic text-xl sm:text-2xl mt-14 sm:mt-12 shadow-xl shrink-0">Q</div>
                      <div className="text-left w-full mt-2"><h4 className="font-black text-slate-950 text-xl sm:text-2xl uppercase tracking-tighter leading-none">{t('demo.phone_title')}</h4></div>
                      <div className="flex gap-1.5 sm:gap-2.5 my-2">
                        {[1,2,3,4,5].map((star) => (
                          <div key={star} className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl ${star <= 2 ? 'bg-yellow-400 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}>★</div>
                        ))}
                      </div>
                      <div className="w-full p-4 sm:p-5 bg-slate-50 rounded-2xl sm:rounded-[2rem] border border-slate-100 text-[11px] sm:text-xs text-slate-400 font-bold italic text-left flex-1 flex items-center min-h-[70px] sm:min-h-[110px] my-2">{t('demo.phone_placeholder')}</div>
                      <button type="button" className="w-full py-4 sm:py-6 bg-red-600 text-white rounded-xl sm:rounded-[1.5rem] text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] shadow-xl shrink-0 mt-auto">{t('demo.phone_btn')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PREȚURI */}
        <section id="preturi" className="py-32 px-6 scroll-mt-24 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-blue-600 font-black uppercase text-[11px] tracking-[0.4em] mb-3">{t('pricing.badge')}</h2>
              <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                {t('pricing.title_part1')} <span className="text-blue-600">{t('pricing.title_part2')}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {PRICING_PLANS.map((plan, index) => {
                const isSelected = selectedPlanIndex === index;
                return (
                  <article key={plan.id} onClick={() => setSelectedPlanIndex(index)}
                    className={`p-8 rounded-[2.5rem] bg-white border-4 cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-blue-600 shadow-2xl scale-[1.02] z-10' : 'border-slate-100 opacity-70 hover:opacity-100 hover:border-blue-200'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-100 rounded-2xl text-slate-700"><Building size={22} /></div>
                        {isSelected && <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Selectat</span>}
                      </div>
                      <h3 className="text-xl font-black italic text-slate-900 uppercase mb-1">{plan.label}</h3>
                      <div className="flex items-baseline gap-1 my-3">
                        <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                        <span className="text-xs font-bold text-slate-500">MDL / lună</span>
                      </div>
                      <ul className="space-y-2 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-4">
                        <li className="flex items-center gap-2"><Check size={14} className="text-blue-600 shrink-0" /> {plan.locations} locație{plan.locations > 1 ? 'i' : ''}</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-blue-600 shrink-0" /> Max {plan.maxEmployees === 999 ? 'nelimitat' : plan.maxEmployees} angajați</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-blue-600 shrink-0" /> QR Code + Notificări Telegram</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-blue-600 shrink-0" /> Dashboard + Analytics AI</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-blue-600 shrink-0" /> Google Reviews Redirect</li>
                        <li className="flex items-center gap-2"><Check size={14} className="text-blue-600 shrink-0" /> WhatsApp Follow-up</li>
                      </ul>
                    </div>
                    <Link href={isLoggedIn ? "/dashboard" as any : "/auth/register"}
                      className={`mt-6 block w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.3em] text-center transition-all ${isSelected ? 'bg-blue-600 text-white hover:bg-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'}`}
                      onClick={(e) => e.stopPropagation()}>
                      {isLoggedIn ? 'Activează' : t('pricing.btn_register')}
                    </Link>
                  </article>
                );
              })}
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

            {/* Total */}
            <div className="max-w-md mx-auto bg-slate-900 border-b-4 border-blue-600 rounded-[2rem] p-6 text-white text-center shadow-2xl">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">{t('pricing.total.estimated_total')}</span>
              <h3 className="text-4xl font-black text-white mt-1">{grandTotal.toFixed(2)} MDL</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2 italic">
                {isStickersAdded 
                  ? `(${t('pricing.total.breakdown_part1')} ${currentPlan.price} MDL + ${t('pricing.total.breakdown_part2')} ${stickerTotal} MDL)` 
                  : t('pricing.total.only_software')}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-2 rounded-xl"><Zap className="text-white fill-white" size={18} /></div>
                <span className="text-xl font-black uppercase tracking-tighter italic">QRate<span className="text-blue-600">.MD</span></span>
              </div>
              <address className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed not-italic">{t('footer.company_name')} <br />{t('footer.location')}</address>
            </div>
            <div className="space-y-8">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{t('footer.docs_title')}</h4>
              <nav>
                <ul className="space-y-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <li><a href={`/${locale}/terms`} className="hover:text-blue-600 transition-colors">{t('footer.terms')}</a></li>
                  <li><a href={`/${locale}/privacy`} className="hover:text-blue-600 transition-colors">{t('footer.privacy')}</a></li>
                  <li><a href={`/${locale}/refund`} className="hover:text-blue-600 transition-colors">{t('footer.refund_policy')}</a></li>
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

      {/* COOKIE BANNER */}
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