'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Check, Mail, Trash2, Plus, Truck, QrCode, 
  Send, BarChart3, Globe, Cookie, LogOut, 
  LayoutDashboard, ShieldAlert, BellRing,
  Activity, Star, Trophy, Sparkles, Building,
  ChevronRight, Flame, Target, Award,
  Bot, Smartphone, Shield, Users
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

const FEATURES = [
  { icon: <QrCode size={24}/>, color: 'bg-blue-100 text-blue-600', title: 'QR Coduri Unice', desc: 'Cod QR pentru fiecare locație sau angajat. Clientul scanează și lasă recenzie în 2 click-uri.' },
  { icon: <Send size={24}/>, color: 'bg-indigo-100 text-indigo-600', title: 'Alerte Telegram', desc: 'Primești notificare instantanee pe Telegram la fiecare recenzie negativă nouă.' },
  { icon: <BarChart3 size={24}/>, color: 'bg-violet-100 text-violet-600', title: 'Analytics Avansat', desc: 'Heatmap orar, comparativ locații, leaderboard angajați și QRate Score 0-100.' },
  { icon: <Sparkles size={24}/>, color: 'bg-amber-100 text-amber-600', title: 'AI Predicții', desc: 'Sistemul prezice nota medie pentru luna viitoare.' },
  { icon: <Flame size={24}/>, color: 'bg-rose-100 text-rose-600', title: 'Crisis Mode', desc: 'Alertă roșie imediată la 3+ recenzii negative.' },
  { icon: <Trophy size={24}/>, color: 'bg-amber-100 text-amber-700', title: 'Recovery Win', desc: 'Notificare automată la recuperarea unui client.' },
  { icon: <Star size={24}/>, color: 'bg-emerald-100 text-emerald-600', title: 'Google Reviews', desc: 'Redirecționare automată către Google Reviews.' },
  { icon: <Bot size={24}/>, color: 'bg-blue-100 text-blue-700', title: 'AI Răspuns Smart', desc: 'Generează răspunsuri inteligente instant.' },
  { icon: <Smartphone size={24}/>, color: 'bg-green-100 text-green-600', title: 'WhatsApp Follow-up', desc: 'Mesaje de recuperare direct pe WhatsApp.' },
  { icon: <Shield size={24}/>, color: 'bg-slate-100 text-slate-600', title: 'QRate Verified Badge', desc: 'Widget de încredere pentru site-ul tău.' },
  { icon: <Users size={24}/>, color: 'bg-purple-100 text-purple-600', title: 'Multi-Locații', desc: 'Gestionează toate locațiile dintr-un panou.' },
  { icon: <Target size={24}/>, color: 'bg-orange-100 text-orange-600', title: 'Keywords Negativi', desc: 'Detectare automată cuvinte problemă.' },
];

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
  '🔮 AI Predicții',
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

  const validateStickers = () => {
    if (stickerCount < 500) setStickerCount(500);
  };

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (isMounted) setIsLoggedIn(!!session);
      }
    );

    const consent = localStorage.getItem('qrate_cookie_consent');
    let timer: NodeJS.Timeout | null = null;
    if (!consent) {
      timer = setTimeout(() => {
        if (isMounted) setShowCookieBanner(true);
      }, 1500);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (subscription) subscription.unsubscribe();
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

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3500);
      return () => clearTimeout(timer);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 scroll-smooth">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-2 md:p-4">
        <nav className="max-w-7xl w-full bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
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
              <a href="#functii" className="hover:text-blue-600 transition-all duration-300">Funcții</a>
              <a href="#vizual-demo" className="hover:text-blue-600 transition-all duration-300">Demo</a>
              <a href="#preturi" className="hover:text-blue-600 transition-all duration-300">Prețuri</a>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-lg md:rounded-2xl border border-slate-200 shadow-inner">
              <button onClick={() => switchLanguage('ro')} className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black transition-all duration-300 ${locale === 'ro' ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>RO</button>
              <button onClick={() => switchLanguage('ru')} className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black transition-all duration-300 ${locale === 'ru' ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>RU</button>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-1 md:gap-2 bg-slate-50 p-1 md:p-1.5 rounded-lg md:rounded-2xl border border-slate-200/60 shadow-sm">
                <Link href="/dashboard" className="flex items-center gap-1.5 md:gap-2 bg-white hover:bg-blue-50 hover:text-blue-600 px-2 md:px-4 py-1.5 md:py-2.5 rounded-md md:rounded-xl border border-slate-200 text-slate-700 transition-all text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                  <LayoutDashboard size={14} className="text-blue-600" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="bg-white hover:bg-red-50 hover:text-red-600 p-1.5 md:p-2.5 rounded-md md:rounded-xl border border-slate-200 text-slate-400 transition-all active:scale-95">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 px-1 md:px-2 transition-colors whitespace-nowrap">Login</Link>
                <Link href="/auth/register" className="relative group overflow-hidden bg-slate-950 text-white px-3 py-2 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all hover:shadow-xl active:scale-95 whitespace-nowrap">
                  <span className="relative z-10">Începe Gratuit</span>
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
              <Zap size={14} /> {t('hero.badge') || 'Platforma #1 de recenzii din Moldova'}
            </div>
            <h1 className="text-4xl md:text-6xl font-[900] tracking-tighter text-slate-950 uppercase leading-[0.9] mb-4">
              {t('hero.title_part1') || 'Recenzii care'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-indigo-800 italic">{t('hero.title_part2') || 'fac business-ul să crească'}</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic mt-6">{t('hero.description') || 'Transformă feedback-ul clienților în creștere reală.'}</p>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="w-full sm:w-auto bg-blue-600 text-white px-14 py-8 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-all text-center">
                {isLoggedIn ? 'Mergi la Dashboard' : 'Începe Gratuit'}
              </Link>
            </div>
          </div>
        </section>

        {/* TICKER ANIMAT */}
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

        {/* FUNCȚII */}
        <section id="functii" className="py-32 px-6 bg-[#F8FAFC] scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <Award size={14} /> 12 Funcții Puternice
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                Tot ce primești în QRate
              </h2>
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
          </div>
        </section>

        {/* DEMO */}
        <section id="vizual-demo" className="py-16 px-4 sm:px-6 md:py-24 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] px-5 py-12 sm:p-12 md:p-20 overflow-hidden relative border border-white/5 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 text-left">
                <div className="space-y-6 md:space-y-10">
                  <h2 className="text-3xl sm:text-4xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                    Vezi cum funcționează <br /><span className="text-blue-500 italic">în practică</span>
                  </h2>
                  <div className="space-y-4">
                    {[
                      { icon: <Zap size={20}/>, title: "Scanare Rapidă", desc: "Clientul scanează QR-ul și lasă recenzia în mai puțin de 10 secunde" },
                      { icon: <ShieldAlert size={20}/>, title: "Alerte Instant", desc: "Primești notificare pe Telegram imediat ce apare o recenzie negativă" },
                      { icon: <Check size={20}/>, title: "Răspunsuri AI", desc: "Generezi răspunsuri profesionale automat cu un singur click" }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 sm:gap-5 items-center bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-3 sm:p-4 bg-white/10 text-blue-400 rounded-xl shrink-0">{step.icon}</div>
                        <div>
                          <h4 className="text-white font-black uppercase text-xs tracking-widest">{step.title}</h4>
                          <p className="text-slate-400 text-sm font-medium mt-1">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Phone Mockup */}
                <div className="relative flex justify-center w-full">
                  <div className="relative w-[270px] h-[550px] sm:w-[340px] sm:h-[680px] bg-slate-900 rounded-[2.5rem] sm:rounded-[4rem] border-[12px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="bg-white h-full w-full p-5 sm:p-8 flex flex-col items-center text-center justify-between relative">
                      <div className={`absolute top-6 left-4 right-4 z-20 transition-all duration-700 ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                        <div className="bg-slate-950 text-white p-5 rounded-3xl shadow-2xl border border-white/10">
                          <p className="text-red-500 text-xs font-black">RECENZIE NEGATIVĂ</p>
                          <p className="text-sm mt-1">Un client a lăsat 2 stele la locația Central.</p>
                        </div>
                      </div>
                      <div className="text-6xl mt-16">Q</div>
                      <h4 className="font-black text-2xl mt-6">Cum a fost experiența?</h4>
                      <button className="w-full mt-auto py-6 bg-red-600 text-white rounded-2xl font-black text-sm">TRIMITE RECENZIA</button>
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
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-950">
                Prețuri Simple și Transparente
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {PRICING_PLANS.map((plan, index) => {
                const isSelected = selectedPlanIndex === index;
                return (
                  <article key={plan.id} onClick={() => setSelectedPlanIndex(index)}
                    className={`p-8 rounded-[2.5rem] bg-white border-4 cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-blue-600 shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-blue-200'}`}>
                    <div>
                      <h3 className="text-2xl font-black italic text-slate-900">{plan.label}</h3>
                      <div className="flex items-baseline gap-1 my-4">
                        <span className="text-4xl font-black">{plan.price}</span>
                        <span className="text-slate-500">MDL / lună</span>
                      </div>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> {plan.locations} locații</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Max {plan.maxEmployees === 999 ? 'nelimitat' : plan.maxEmployees} angajați</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> QR + Alerte Telegram</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Analytics + AI</li>
                      </ul>
                    </div>
                    <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="mt-8 block w-full py-4 rounded-2xl font-black text-center bg-slate-900 text-white hover:bg-blue-600 transition-all">
                      {isLoggedIn ? 'Activează' : 'Alege Planul'}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black text-slate-400">© 2026 QRate Moldova • Toate drepturile rezervate</p>
        </div>
      </footer>

      {/* COOKIE BANNER */}
      {showCookieBanner && (
        <aside className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-slate-900 text-white p-6 rounded-3xl shadow-2xl z-50">
          <div className="flex gap-4">
            <Cookie className="text-blue-400 mt-1" size={24} />
            <div>
              <h3 className="font-bold">Utilizăm cookie-uri</h3>
              <p className="text-sm text-slate-400 mt-1">Pentru o experiență mai bună pe site.</p>
              <button onClick={handleAcceptCookies} className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-2xl text-sm font-semibold">
                Accept
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}