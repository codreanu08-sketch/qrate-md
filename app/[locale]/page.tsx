'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Check, Mail, QrCode, Send, BarChart3, Globe, Cookie,
  LogOut, LayoutDashboard, ShieldAlert, BellRing, Activity,
  Star, Trophy, Sparkles, Building, ChevronRight, Flame,
  Target, Award, Bot, Smartphone, Shield, Users, Phone,
  TrendingUp, Clock, MapPin, Utensils, ShoppingBag, Car,
  Scissors, Hotel, Package, ChevronDown, ArrowRight, Play
} from 'lucide-react';
import { Link, usePathname, useRouter, locales } from '@/i18n/config'; 
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const PRICING_PLANS = [
  { id: 'START',      locations: 1, maxEmployees: 5,   price: 450,  label: 'START' },
  { id: 'GROW',       locations: 2, maxEmployees: 10,  price: 700,  label: 'GROW' },
  { id: 'SCALE',      locations: 3, maxEmployees: 15,  price: 1050, label: 'SCALE' },
  { id: 'PRO',        locations: 4, maxEmployees: 20,  price: 1300, label: 'PRO' },
  { id: 'PRO_PLUS',   locations: 5, maxEmployees: 25,  price: 1500, label: 'PRO+' },
  { id: 'ENTERPRISE', locations: 6, maxEmployees: 999, price: 1700, label: 'ENTERPRISE' },
];

// ✅ Animated counter hook
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ✅ Intersection observer hook
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ✅ ROI Calculator component
function ROICalculator({ locale }: { locale: string }) {
  const [reviews, setReviews] = useState(50);
  const [avgBill, setAvgBill] = useState(200);
  const conversion = 0.15;
  const newClients = Math.round(reviews * conversion);
  const revenue = newClients * avgBill;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white border border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-xl"><TrendingUp size={18} className="text-blue-400"/></div>
        <h3 className="font-black text-base uppercase tracking-tight">
          {locale === 'ru' ? 'Калькулятор ROI' : 'Calculator ROI'}
        </h3>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {locale === 'ru' ? 'Recenzii / lună' : 'Recenzii / lună'}
            </label>
            <span className="text-blue-300 font-black text-sm">{reviews}</span>
          </div>
          <input type="range" min={10} max={500} value={reviews} onChange={e => setReviews(+e.target.value)}
            className="w-full accent-blue-500 h-1.5 rounded-full cursor-pointer"/>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {locale === 'ru' ? 'Bon mediu (MDL)' : 'Bon mediu (MDL)'}
            </label>
            <span className="text-blue-300 font-black text-sm">{avgBill} MDL</span>
          </div>
          <input type="range" min={50} max={2000} step={50} value={avgBill} onChange={e => setAvgBill(+e.target.value)}
            className="w-full accent-blue-500 h-1.5 rounded-full cursor-pointer"/>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">
              {locale === 'ru' ? 'Clienți noi / lună' : 'Clienți noi / lună'}
            </p>
            <p className="text-2xl font-black text-emerald-400">+{newClients}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">
              {locale === 'ru' ? 'Venit extra / lună' : 'Venit extra / lună'}
            </p>
            <p className="text-2xl font-black text-emerald-400">+{revenue.toLocaleString()} MDL</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 text-center">
          {locale === 'ru' ? '~15% din recenzii pozitive = client nou' : '~15% din recenzii pozitive = client nou'}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [showNotification, setShowNotification] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState(0);

  const { ref: statsRef, inView: statsInView } = useInView();
  const reviews = useCounter(12847, 2500, statsInView);
  const businesses = useCounter(143, 2000, statsInView);
  const rating = useCounter(47, 2000, statsInView); // 4.7 → display /10

  const currentPlan = PRICING_PLANS[selectedPlanIndex];

  const industries = [
    { icon: <Utensils size={20}/>, label: locale === 'ru' ? 'Ресторан / Кафе' : 'Restaurant / Cafenea', color: 'bg-orange-100 text-orange-600', 
      pain: locale === 'ru' ? 'Клиент ушел недоволен — ты узнал только от негативного отзыва на Google.' : 'Clientul a plecat nemulțumit — ai aflat doar după recenzia negativă pe Google.',
      solution: locale === 'ru' ? 'QRate prinde recenzia negativă ÎNAINTE să ajungă pe Google și o trimite direct la tine pe Telegram.' : 'QRate prinde recenzia negativă ÎNAINTE să ajungă pe Google și o trimite direct la tine pe Telegram.' },
    { icon: <ShoppingBag size={20}/>, label: locale === 'ru' ? 'Magazin' : 'Magazin / Retail', color: 'bg-blue-100 text-blue-600',
      pain: locale === 'ru' ? 'Nu știi ce angajat are probleme cu clienții.' : 'Nu știi ce angajat are probleme cu clienții.',
      solution: locale === 'ru' ? 'QR individual per angajat. Leaderboard automat. Știi exact cine performează.' : 'QR individual per angajat. Leaderboard automat. Știi exact cine performează.' },
    { icon: <Car size={20}/>, label: locale === 'ru' ? 'Auto-service' : 'Auto-service', color: 'bg-slate-100 text-slate-600',
      pain: locale === 'ru' ? 'Clienții nu lasă recenzii pe Google deși sunt mulțumiți.' : 'Clienții nu lasă recenzii pe Google deși sunt mulțumiți.',
      solution: locale === 'ru' ? 'QRate redirectează automat clienții cu 4-5 stele spre Google Reviews. Fii mai vizibil.' : 'QRate redirectează automat clienții cu 4-5 stele spre Google Reviews. Fii mai vizibil.' },
    { icon: <Scissors size={20}/>, label: locale === 'ru' ? 'Salon / Spa' : 'Salon / Spa', color: 'bg-pink-100 text-pink-600',
      pain: locale === 'ru' ? 'Ai mai multe locații dar nu știi care performează cel mai bine.' : 'Ai mai multe locații dar nu știi care performează cel mai bine.',
      solution: locale === 'ru' ? 'Dashboard central. Comparativ locații în timp real. Acționezi rapid.' : 'Dashboard central. Comparativ locații în timp real. Acționezi rapid.' },
    { icon: <Package size={20}/>, label: locale === 'ru' ? 'Livrare / Curier' : 'Livrare / Curier', color: 'bg-emerald-100 text-emerald-600',
      pain: locale === 'ru' ? 'Curierul are probleme dar clienții nu spun direct.' : 'Curierul are probleme dar clienții nu spun direct.',
      solution: locale === 'ru' ? 'QR per curier. Recenzii anonime. Știi exact cine creează probleme.' : 'QR per curier. Recenzii anonime. Știi exact cine creează probleme.' },
  ];

  const switchLanguage = (newLocale: typeof locales[number]) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    let timer: NodeJS.Timeout | null = null;
    if (!consent) timer = setTimeout(() => { if (isMounted) setShowCookieBanner(true); }, 1500);
    return () => { isMounted = false; if (timer) clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3500);
      return () => clearTimeout(timer);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans scroll-smooth">

      {/* ✅ MOBILE TOP BAR */}
      <div className="md:hidden bg-slate-950 px-4 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-[60]">
        <div className="flex items-center gap-1.5">
          <div className="bg-blue-600 p-1 rounded-lg"><Zap className="text-white fill-white" size={12}/></div>
          <span className="text-white font-black text-sm italic uppercase">QRate<span className="text-blue-500">.MD</span></span>
        </div>
        <div className="flex items-center gap-2">
          <a href="tel:+37368688484" className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2.5 py-1.5 rounded-xl text-[10px] font-black">
            <Phone size={10}/> 068 688 484
          </a>
          {/* ✅ Login vizibil pe mobile */}
          {!isLoggedIn ? (
            <Link href="/auth/login" className="bg-white/10 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase">
              Login
            </Link>
          ) : (
            <Link href="/dashboard" className="bg-blue-600 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1">
              <LayoutDashboard size={10}/> App
            </Link>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 bg-white/10 rounded-xl">
            <ChevronDown size={14} className={`text-white transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[42px] left-0 right-0 z-[59] bg-slate-950 border-b border-white/10 px-4 py-3 flex gap-3">
          {['functii','demo','preturi','contact'].map(id => (
            <button key={id} onClick={() => scrollTo(id)} className="text-[10px] font-black text-slate-400 uppercase tracking-wider hover:text-white transition-colors capitalize">
              {id === 'functii' ? (locale === 'ru' ? 'Funcții' : 'Funcții') : id === 'demo' ? 'Demo' : id === 'preturi' ? (locale === 'ru' ? 'Prețuri' : 'Prețuri') : (locale === 'ru' ? 'Contact' : 'Contact')}
            </button>
          ))}
        </div>
      )}

      {/* ✅ DESKTOP HEADER */}
      <header className={`hidden md:flex fixed top-0 left-0 right-0 z-50 justify-center transition-all duration-300 p-4`}>
        <nav className={`max-w-7xl w-full backdrop-blur-2xl border rounded-[2rem] px-8 h-20 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-slate-950/95 border-slate-800 shadow-2xl' : 'bg-white/90 border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]'}`}>
          <div className="flex items-center gap-2 group cursor-pointer shrink-0">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="text-white fill-white w-5 h-5" />
            </div>
            <span className={`text-xl font-black uppercase tracking-tighter italic ${scrolled ? 'text-white' : 'text-slate-950'}`}>
              QRate<span className="text-blue-500">.MD</span>
            </span>
          </div>

          <div className={`flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.25em] ${scrolled ? 'text-slate-400' : 'text-slate-500'}`}>
            <button onClick={() => scrollTo('functii')} className="hover:text-blue-500 transition-all">{locale === 'ru' ? 'Функции' : 'Funcții'}</button>
            <button onClick={() => scrollTo('industrii')} className="hover:text-blue-500 transition-all">{locale === 'ru' ? 'Industrii' : 'Industrii'}</button>
            <button onClick={() => scrollTo('demo')} className="hover:text-blue-500 transition-all">Demo</button>
            <button onClick={() => scrollTo('preturi')} className="hover:text-blue-500 transition-all">{locale === 'ru' ? 'Цены' : 'Prețuri'}</button>
            <button onClick={() => scrollTo('contact')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${scrolled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'}`}>
              <Phone size={11}/> Contact
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a href="tel:+37368688484" className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${scrolled ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              <Phone size={12}/> 068 688 484
            </a>
            <div className={`flex items-center p-1 rounded-2xl border ${scrolled ? 'bg-white/10 border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
              <button onClick={() => switchLanguage('ro')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${locale === 'ro' ? 'bg-blue-600 text-white' : scrolled ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>RO</button>
              <button onClick={() => switchLanguage('ru')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${locale === 'ru' ? 'bg-blue-600 text-white' : scrolled ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>RU</button>
            </div>
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                  <LayoutDashboard size={13}/> Dashboard
                </Link>
                <button onClick={async () => { await supabase.auth.signOut(); setIsLoggedIn(false); router.refresh(); }} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-red-500 transition-all">
                  <LogOut size={14}/>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className={`text-[10px] font-black uppercase tracking-wider transition-colors ${scrolled ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'}`}>Login</Link>
                <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95">
                  {locale === 'ru' ? 'Начать бесплатно' : 'Încearcă Gratuit'}
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-[42px] md:pt-0">

        {/* ══════════════════════════════════ */}
        {/* HERO                              */}
        {/* ══════════════════════════════════ */}
        <section className="pt-24 md:pt-40 pb-16 px-6 text-center relative overflow-hidden">
          {/* Decorative bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"/>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"/>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> {locale === 'ru' ? 'LIVE · 143 afaceri active în Moldova' : 'LIVE · 143 afaceri active în Moldova'}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-[900] tracking-tighter text-slate-950 uppercase leading-[0.85] mb-6">
              {locale === 'ru' ? (
                <>Репутация которая<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">продаёт за тебя</span></>
              ) : (
                <>Reputația care<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">vinde în locul tău</span></>
              )}
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
              {locale === 'ru'
                ? 'QR → Recenzie → Telegram. Știi tot în timp real. Clienții nemulțumiți nu ajung pe Google. Cei fericiți — da.'
                : 'QR → Recenzie → Telegram. Știi tot în timp real. Clienții nemulțumiți nu ajung pe Google. Cei fericiți — da.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2">
                {isLoggedIn ? (locale === 'ru' ? 'В панель' : 'Dashboard') : (locale === 'ru' ? 'Начать бесплатно — 7 дней' : 'Încearcă Gratuit — 7 zile')}
                <ArrowRight size={14}/>
              </Link>
              <button onClick={() => scrollTo('demo')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all hover:shadow-lg">
                <Play size={14} className="text-blue-600 fill-blue-600"/>
                {locale === 'ru' ? 'Посмотреть демо' : 'Vezi cum funcționează'}
              </button>
            </div>

            {/* ✅ STATS ANIMAT */}
            <div ref={statsRef} className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { val: reviews.toLocaleString(), label: locale === 'ru' ? 'Recenzii colectate' : 'Recenzii colectate', color: 'text-blue-600' },
                { val: businesses, label: locale === 'ru' ? 'Afaceri active' : 'Afaceri active', color: 'text-emerald-600' },
                { val: (rating/10).toFixed(1) + '★', label: locale === 'ru' ? 'Nota medie pe platformă' : 'Nota medie pe platformă', color: 'text-amber-500' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
                  <p className={`text-2xl md:text-3xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════ */}
        {/* INDUSTRII — Cine folosește QRate  */}
        {/* ══════════════════════════════════ */}
        <section id="industrii" className="py-20 px-6 scroll-mt-24 bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">
                {locale === 'ru' ? 'Pentru orice afacere' : 'Pentru orice afacere din Moldova'}
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                {locale === 'ru' ? 'Selectează tipul tău de afacere' : 'Selectează tipul tău de afacere'}
              </h2>
            </div>

            {/* Tabs industrii */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {industries.map((ind, i) => (
                <button key={i} onClick={() => setSelectedIndustry(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${selectedIndustry === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'}`}>
                  {ind.icon} {ind.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">😤 {locale === 'ru' ? 'Fără QRate' : 'Fără QRate'}</p>
                <p className="text-white font-bold text-base leading-relaxed">{industries[selectedIndustry].pain}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">✅ {locale === 'ru' ? 'Cu QRate' : 'Cu QRate'}</p>
                <p className="text-white font-bold text-base leading-relaxed">{industries[selectedIndustry].solution}</p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/auth/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all">
                {locale === 'ru' ? 'Testează gratuit pentru afacerea ta' : 'Testează gratuit pentru afacerea ta'} <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════ */}
        {/* CUM FUNCȚIONEAZĂ — 3 pași         */}
        {/* ══════════════════════════════════ */}
        <section id="demo" className="py-20 px-6 scroll-mt-24 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">{locale === 'ru' ? 'Simplu ca 1-2-3' : 'Simplu ca 1-2-3'}</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                {locale === 'ru' ? 'Cum funcționează?' : 'Cum funcționează?'}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                { step: '01', icon: <QrCode size={28}/>, color: 'bg-blue-600', title: locale === 'ru' ? 'Client scanează QR' : 'Clientul scanează QR', desc: locale === 'ru' ? 'QR-cod pe masă, la casă, pe bon sau pe perete. Clientul scanează în 2 secunde.' : 'QR pe masă, la casă, pe bon sau pe perete. Clientul scanează în 2 secunde.' },
                { step: '02', icon: <Star size={28}/>, color: 'bg-amber-500', title: locale === 'ru' ? 'Lasă recenzia' : 'Lasă recenzia', desc: locale === 'ru' ? '5 stele → redirect automat pe Google. 1-3 stele → mesaj privat direct la tine pe Telegram.' : '5 stele → redirect automat pe Google. 1-3 stele → mesaj privat direct la tine pe Telegram.' },
                { step: '03', icon: <BellRing size={28}/>, color: 'bg-emerald-600', title: locale === 'ru' ? 'Tu acționezi instant' : 'Tu acționezi instant', desc: locale === 'ru' ? 'Primești notificare pe Telegram. Răspunzi cu un click. Clienți fideli. Google Reviews cresc.' : 'Primești notificare pe Telegram. Răspunzi cu un click. Clienți fideli. Google Reviews cresc.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-slate-100 font-black text-5xl leading-none group-hover:text-blue-50 transition-colors">{item.step}</div>
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Phone mockup + ROI Calculator side by side */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Phone */}
              <div className="flex justify-center">
                <div className="relative w-[260px] h-[520px] bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden">
                  <div className="bg-white h-full w-full p-5 flex flex-col items-center text-center justify-between relative">
                    <div className={`absolute top-4 left-3 right-3 z-20 transition-all duration-700 ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                      <div className="bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-red-500 p-1 rounded-lg animate-pulse"><BellRing size={10} className="text-white"/></div>
                          <p className="text-red-400 text-[9px] font-black uppercase">Telegram Alert!</p>
                        </div>
                        <p className="text-slate-300 text-[10px]">{locale === 'ru' ? '2★ — Ion M. @ Central. "Așteptare prea lungă"' : '2★ — Ion M. @ Central. "Așteptare prea lungă"'}</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black italic text-xl mt-12 shadow-xl">Q</div>
                    <h4 className="font-black text-slate-950 text-lg uppercase tracking-tighter">{locale === 'ru' ? 'Experiența ta?' : 'Experiența ta?'}</h4>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <div key={star} className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${star <= 4 ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}>★</div>
                      ))}
                    </div>
                    <div className="w-full p-3 bg-slate-50 rounded-xl border text-[10px] text-slate-400 italic text-left min-h-[60px] flex items-center">
                      {locale === 'ru' ? 'Serviciu rapid, recomand!' : 'Serviciu rapid, recomand!'}
                    </div>
                    <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider">
                      {locale === 'ru' ? 'Trimite Recenzia' : 'Trimite Recenzia'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ROI Calculator */}
              <ROICalculator locale={locale}/>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════ */}
        {/* FUNCȚII GRID                      */}
        {/* ══════════════════════════════════ */}
        <section id="functii" className="py-20 px-6 scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <Award size={12}/> {locale === 'ru' ? '12 funcții puternice' : '12 Funcții Puternice'}
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                {locale === 'ru' ? 'Tot ce primești în QRate' : 'Tot ce primești în QRate'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(locale === 'ru' ? [
                { icon: <QrCode size={22}/>, color: 'bg-blue-100 text-blue-600', title: 'QR unici', desc: 'Per locație sau angajat. Scanare în 2 clicuri.' },
                { icon: <Send size={22}/>, color: 'bg-indigo-100 text-indigo-600', title: 'Alerte Telegram', desc: 'Notificări instant la fiecare recenzie nouă.' },
                { icon: <BarChart3 size={22}/>, color: 'bg-violet-100 text-violet-600', title: 'Analytics AI', desc: 'Heatmap, leaderboard, QRate Score 0-100.' },
                { icon: <Sparkles size={22}/>, color: 'bg-amber-100 text-amber-600', title: 'AI Predicții', desc: 'Prezice nota medie pentru luna viitoare.' },
                { icon: <Flame size={22}/>, color: 'bg-rose-100 text-rose-600', title: 'Crisis Mode', desc: 'Alertă roșie la 3+ recenzii negative / 30 min.' },
                { icon: <Trophy size={22}/>, color: 'bg-amber-100 text-amber-700', title: 'Recovery Win', desc: 'Notificare când client nemulțumit revine cu 5★.' },
                { icon: <Star size={22}/>, color: 'bg-emerald-100 text-emerald-600', title: 'Google Reviews', desc: 'Redirect automat clienți fericiți pe Google.' },
                { icon: <Bot size={22}/>, color: 'bg-blue-100 text-blue-700', title: 'AI Răspuns', desc: 'Răspunsuri personalizate instant + WhatsApp.' },
                { icon: <Smartphone size={22}/>, color: 'bg-green-100 text-green-600', title: 'WhatsApp Follow-up', desc: 'Contact direct clienți nemulțumiți.' },
                { icon: <Shield size={22}/>, color: 'bg-slate-100 text-slate-600', title: 'Verified Badge', desc: 'Widget embed pentru site — ca TrustPilot.' },
                { icon: <Users size={22}/>, color: 'bg-purple-100 text-purple-600', title: 'Multi-Locații', desc: 'Toate locațiile dintr-un singur panou.' },
                { icon: <Target size={22}/>, color: 'bg-orange-100 text-orange-600', title: 'Keywords Alert', desc: 'Detectare cuvinte problemă + alertă automată.' },
              ] : [
                { icon: <QrCode size={22}/>, color: 'bg-blue-100 text-blue-600', title: 'QR Unici', desc: 'Per locație sau angajat. Scanare în 2 click-uri.' },
                { icon: <Send size={22}/>, color: 'bg-indigo-100 text-indigo-600', title: 'Alerte Telegram', desc: 'Notificări instant la fiecare recenzie nouă.' },
                { icon: <BarChart3 size={22}/>, color: 'bg-violet-100 text-violet-600', title: 'Analytics AI', desc: 'Heatmap orar, leaderboard, QRate Score 0-100.' },
                { icon: <Sparkles size={22}/>, color: 'bg-amber-100 text-amber-600', title: 'AI Predicții', desc: 'Prezice nota medie pentru luna viitoare.' },
                { icon: <Flame size={22}/>, color: 'bg-rose-100 text-rose-600', title: 'Crisis Mode', desc: 'Alertă roșie la 3+ recenzii negative / 30 min.' },
                { icon: <Trophy size={22}/>, color: 'bg-amber-100 text-amber-700', title: 'Recovery Win', desc: 'Notificare când client nemulțumit revine cu 5★.' },
                { icon: <Star size={22}/>, color: 'bg-emerald-100 text-emerald-600', title: 'Google Reviews', desc: 'Redirect automat clienți fericiți spre Google.' },
                { icon: <Bot size={22}/>, color: 'bg-blue-100 text-blue-700', title: 'AI Răspuns', desc: 'Răspunsuri personalizate instant + WhatsApp.' },
                { icon: <Smartphone size={22}/>, color: 'bg-green-100 text-green-600', title: 'WhatsApp Follow-up', desc: 'Contact direct cu clienții nemulțumiți.' },
                { icon: <Shield size={22}/>, color: 'bg-slate-100 text-slate-600', title: 'Verified Badge', desc: 'Widget embed pentru site-ul tău.' },
                { icon: <Users size={22}/>, color: 'bg-purple-100 text-purple-600', title: 'Multi-Locații', desc: 'Toate locațiile dintr-un singur panou.' },
                { icon: <Target size={22}/>, color: 'bg-orange-100 text-orange-600', title: 'Keywords Alert', desc: 'Detectare cuvinte problemă + alertă automată.' },
              ]).map((f, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 group">
                  <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{f.icon}</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════ */}
        {/* PREȚURI                           */}
        {/* ══════════════════════════════════ */}
        <section id="preturi" className="py-20 px-6 scroll-mt-24 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-950">
                {locale === 'ru' ? 'Prețuri transparente' : 'Prețuri Transparente'}
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                {locale === 'ru' ? '7 zile gratuit · Fără card · Anulezi oricând' : '7 zile gratuit · Fără card bancar · Anulezi oricând'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {PRICING_PLANS.map((plan, index) => {
                const isSelected = selectedPlanIndex === index;
                return (
                  <article key={plan.id} onClick={() => setSelectedPlanIndex(index)}
                    className={`p-6 rounded-3xl bg-white border-2 cursor-pointer transition-all flex flex-col ${isSelected ? 'border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]' : 'border-slate-100 opacity-75 hover:opacity-100 hover:border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-slate-100 rounded-xl"><Building size={16} className="text-slate-600"/></div>
                      {isSelected && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Selectat</span>}
                    </div>
                    <h3 className="text-lg font-black italic uppercase text-slate-900">{plan.label}</h3>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-black">{plan.price}</span>
                      <span className="text-slate-400 text-xs font-bold">MDL/{locale === 'ru' ? 'мес' : 'lună'}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4 flex-1">
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>{plan.locations} {plan.locations === 1 ? 'locație' : 'locații'}</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>{plan.maxEmployees === 999 ? '∞' : plan.maxEmployees} angajați</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>QR + Telegram + AI</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>Google Reviews + Badge</li>
                    </ul>
                    <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}
                      className={`block w-full py-3 rounded-2xl font-black uppercase text-xs tracking-wider text-center transition-all ${isSelected ? 'bg-blue-600 text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'}`}
                      onClick={e => e.stopPropagation()}>
                      {isLoggedIn ? 'Activează' : 'Alege Planul'}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════ */}
        {/* CONTACT                           */}
        {/* ══════════════════════════════════ */}
        <section id="contact" className="py-20 px-6 bg-slate-950 scroll-mt-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">{locale === 'ru' ? 'Contactează-ne' : 'Contactează-ne'}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3">
              {locale === 'ru' ? 'Suntem la un apel distanță' : 'Suntem la un apel distanță'}
            </h2>
            <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto">
              {locale === 'ru' ? 'Ai întrebări? Te ajutăm să configurezi QRate pentru afacerea ta în 15 minute.' : 'Ai întrebări? Te ajutăm să configurezi QRate pentru afacerea ta în 15 minute.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <a href="tel:+37368688484" className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 p-6 rounded-3xl transition-all duration-300">
                <div className="w-12 h-12 bg-blue-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <Phone size={20} className="text-white group-hover:text-blue-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-200 uppercase tracking-widest mb-0.5 transition-colors">Telefon</p>
                  <p className="text-white font-black text-base">068 688 484</p>
                  <p className="text-slate-500 group-hover:text-blue-200 text-[10px] font-bold mt-0.5 transition-colors">Gheorghe</p>
                </div>
              </a>
              <a href="mailto:suport@qrate.md" className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 p-6 rounded-3xl transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <Mail size={20} className="text-white group-hover:text-indigo-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest mb-0.5 transition-colors">Email</p>
                  <p className="text-white font-black text-sm">suport@qrate.md</p>
                  <p className="text-slate-500 group-hover:text-indigo-200 text-[10px] font-bold mt-0.5 transition-colors">Suport</p>
                </div>
              </a>
              <div className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-500 p-6 rounded-3xl transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <Globe size={20} className="text-white group-hover:text-emerald-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-emerald-200 uppercase tracking-widest mb-0.5 transition-colors">Web</p>
                  <p className="text-white font-black text-sm">www.qrate.md</p>
                  <p className="text-slate-500 group-hover:text-emerald-200 text-[10px] font-bold mt-0.5 transition-colors">Republica Moldova</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-2 rounded-xl"><Zap className="text-white fill-white" size={16}/></div>
                <span className="text-xl font-black uppercase tracking-tighter italic">QRate<span className="text-blue-600">.MD</span></span>
              </div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] leading-relaxed">
                <p>QR RATING S.R.L.</p>
                <p>IDNO: 1026023041245</p>
                <p>mun. Orhei, str. Sălciilor 75</p>
                <p>Republica Moldova</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Документы' : 'Documente'}</h4>
              <ul className="space-y-2.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                <li><a href={`/${locale}/terms`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Условия использования' : 'Termeni și condiții'}</a></li>
                <li><a href={`/${locale}/privacy`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Конфиденциальность' : 'Confidențialitate'}</a></li>
                <li><a href={`/${locale}/refund`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Политика возврата' : 'Politica de rambursare'}</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Поддержка' : 'Suport'}</h4>
              <ul className="space-y-2.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                <li className="flex items-center gap-2"><Phone size={12} className="text-blue-600 shrink-0"/><a href="tel:+37368688484" className="hover:text-blue-600 transition-colors">068 688 484</a></li>
                <li className="flex items-center gap-2"><Mail size={12} className="text-blue-600 shrink-0"/><a href="mailto:suport@qrate.md" className="hover:text-blue-600 transition-colors">suport@qrate.md</a></li>
                <li className="flex items-center gap-2"><Globe size={12} className="text-blue-600 shrink-0"/><span>www.qrate.md</span></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Плăți securizate' : 'Plăți Securizate'}</h4>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-700">maib</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Moldova Agroindbank S.A.</p>
                <div className="flex gap-2">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-600">VISA</span>
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-600">MASTERCARD</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
              © 2026 QR RATING S.R.L. · QRate Moldova · {locale === 'ru' ? 'Все права защищены' : 'Toate drepturile rezervate'}
            </p>
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <aside className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-sm bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-slate-800 z-50">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400 shrink-0"><Cookie size={18}/></div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-1">{locale === 'ru' ? 'Cookie' : 'Politica Cookie'}</h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">{locale === 'ru' ? 'Folosim cookie-uri tehnice obligatorii.' : 'Folosim cookie-uri tehnice obligatorii pentru sesiunea ta.'}</p>
              <button onClick={() => { localStorage.setItem('qrate_cookie_consent','accepted'); setShowCookieBanner(false); }} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                {locale === 'ru' ? 'Принять' : 'Accept'}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}