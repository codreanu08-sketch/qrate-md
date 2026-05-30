'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Check, Mail, QrCode, Send, BarChart3, Globe, Cookie,
  LogOut, LayoutDashboard, ShieldAlert, BellRing,
  Star, Trophy, Sparkles, Building, ChevronRight, Flame,
  Target, Award, Bot, Smartphone, Shield, Users, Phone,
  TrendingUp, Utensils, ShoppingBag, Car,
  Scissors, Package, ChevronDown, ArrowRight, Play
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

function ROICalculator({ locale }: { locale: string }) {
  const [reviews, setReviews] = useState(50);
  const [avgBill, setAvgBill] = useState(200);
  const newClients = Math.round(reviews * 0.15);
  const revenue = newClients * avgBill;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white border border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-xl"><TrendingUp size={18} className="text-blue-400"/></div>
        <h3 className="font-black text-base uppercase tracking-tight">Calculator ROI</h3>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recenzii / lună</label>
            <span className="text-blue-300 font-black text-sm">{reviews}</span>
          </div>
          <input type="range" min={10} max={500} value={reviews} onChange={e => setReviews(+e.target.value)}
            className="w-full accent-blue-500 h-1.5 rounded-full cursor-pointer"/>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bon mediu (MDL)</label>
            <span className="text-blue-300 font-black text-sm">{avgBill} MDL</span>
          </div>
          <input type="range" min={50} max={2000} step={50} value={avgBill} onChange={e => setAvgBill(+e.target.value)}
            className="w-full accent-blue-500 h-1.5 rounded-full cursor-pointer"/>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Clienți noi / lună</p>
            <p className="text-2xl font-black text-emerald-400">+{newClients}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Venit extra / lună</p>
            <p className="text-2xl font-black text-emerald-400">+{revenue.toLocaleString()} MDL</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 text-center">~15% din recenzii pozitive = client nou</p>
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

  const industries = [
    { icon: <Utensils size={18}/>, label: locale === 'ru' ? 'Restaurant' : 'Restaurant',
      pain: locale === 'ru' ? 'Клиент ушел недоволен — ты узнал только от негативного отзыва на Google.' : 'Clientul a plecat nemulțumit — ai aflat doar după recenzia negativă pe Google.',
      solution: locale === 'ru' ? 'QRate prinde recenzia ÎNAINTE să ajungă pe Google și o trimite direct la tine pe Telegram.' : 'QRate prinde recenzia negativă ÎNAINTE să ajungă pe Google și o trimite direct la tine pe Telegram.' },
    { icon: <ShoppingBag size={18}/>, label: locale === 'ru' ? 'Magazin' : 'Magazin',
      pain: locale === 'ru' ? 'Nu știi ce angajat are probleme cu clienții.' : 'Nu știi ce angajat are probleme cu clienții.',
      solution: locale === 'ru' ? 'QR individual per angajat. Leaderboard automat. Știi exact cine performează.' : 'QR individual per angajat. Leaderboard automat. Știi exact cine performează.' },
    { icon: <Car size={18}/>, label: 'Auto-service',
      pain: locale === 'ru' ? 'Clienții nu lasă recenzii pe Google deși sunt mulțumiți.' : 'Clienții nu lasă recenzii pe Google deși sunt mulțumiți.',
      solution: locale === 'ru' ? 'QRate redirectează automat clienții cu 4-5 stele spre Google Reviews.' : 'QRate redirectează automat clienții cu 4-5 stele spre Google Reviews. Fii mai vizibil.' },
    { icon: <Scissors size={18}/>, label: 'Salon / Spa',
      pain: locale === 'ru' ? 'Ai mai multe locații dar nu știi care performează.' : 'Ai mai multe locații dar nu știi care performează cel mai bine.',
      solution: locale === 'ru' ? 'Dashboard central. Comparativ locații în timp real.' : 'Dashboard central. Comparativ locații în timp real. Acționezi rapid.' },
    { icon: <Package size={18}/>, label: locale === 'ru' ? 'Livrare' : 'Livrare',
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_: any, session: any) => {
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

      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-slate-950 px-4 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-[60]">
        <div className="flex items-center gap-1.5">
          <div className="bg-blue-600 p-1 rounded-lg"><Zap className="text-white fill-white" size={12}/></div>
          <span className="text-white font-black text-sm italic uppercase">QRate<span className="text-blue-500">.MD</span></span>
        </div>
        <div className="flex items-center gap-2">
          <a href="tel:+37368688484" className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2.5 py-1.5 rounded-xl text-[10px] font-black">
            <Phone size={10}/> 068 688 484
          </a>
          {!isLoggedIn ? (
            <Link href="/auth/login" className="bg-white/10 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase">Login</Link>
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

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[42px] left-0 right-0 z-[59] bg-slate-950 border-b border-white/10 px-4 py-3 flex flex-wrap gap-3">
          {[
            { id: 'functii', label: locale === 'ru' ? 'Funcții' : 'Funcții' },
            { id: 'industrii', label: locale === 'ru' ? 'Industrii' : 'Industrii' },
            { id: 'demo', label: 'Demo' },
            { id: 'preturi', label: locale === 'ru' ? 'Prețuri' : 'Prețuri' },
            { id: 'contact', label: 'Contact' },
          ].map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-wider hover:text-white transition-colors">
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* DESKTOP HEADER */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 justify-center p-4">
        <nav className={`max-w-7xl w-full backdrop-blur-2xl border rounded-[2rem] px-8 h-20 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-slate-950/95 border-slate-800 shadow-2xl' : 'bg-white/90 border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]'}`}>
          <div className="flex items-center gap-2 group cursor-pointer shrink-0">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="text-white fill-white w-5 h-5" />
            </div>
            <span className={`text-xl font-black uppercase tracking-tighter italic ${scrolled ? 'text-white' : 'text-slate-950'}`}>
              QRate<span className="text-blue-500">.MD</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'functii', label: locale === 'ru' ? 'Функции' : 'Funcții' },
              { id: 'industrii', label: locale === 'ru' ? 'Industrii' : 'Industrii' },
              { id: 'demo', label: 'Demo' },
              { id: 'preturi', label: locale === 'ru' ? 'Цены' : 'Prețuri' },
            ].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className={`relative px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 group ${scrolled ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                {item.label}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-500 rounded-full group-hover:w-4 transition-all duration-200"/>
              </button>
            ))}
            <button onClick={() => scrollTo('contact')}
              className={`flex items-center gap-1.5 ml-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-900/20'}`}>
              <Phone size={12}/> Contact
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
                <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:shadow-lg active:scale-95">
                  {locale === 'ru' ? 'Начать бесплатно' : 'Încearcă Gratuit'}
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-[42px] md:pt-0">

        {/* HERO */}
        <section className="pt-24 md:pt-40 pb-16 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"/>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"/>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
              {locale === 'ru' ? 'Platforma #1 de recenzii din Moldova' : 'Platforma #1 de recenzii din Moldova'}
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
                ? 'QR → Recenzie → Telegram. Clienții nemulțumiți nu ajung pe Google. Cei fericiți — da.'
                : 'QR → Recenzie → Telegram. Clienții nemulțumiți nu ajung pe Google. Cei fericiți — da.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2">
                {isLoggedIn ? (locale === 'ru' ? 'Dashboard' : 'Dashboard') : (locale === 'ru' ? 'Начать бесплатно — 7 дней' : 'Încearcă Gratuit — 7 zile')}
                <ArrowRight size={14}/>
              </Link>
              <button onClick={() => scrollTo('demo-qr')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all hover:shadow-lg">
                <Play size={14} className="text-blue-600 fill-blue-600"/>
                {locale === 'ru' ? 'Scanează demo QR' : 'Scanează demo QR'}
              </button>
            </div>
          </div>
        </section>

        {/* CUM FUNCȚIONEAZĂ */}
        <section id="demo" className="py-20 px-6 scroll-mt-24 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Simplu ca 1-2-3</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                {locale === 'ru' ? 'Cum funcționează?' : 'Cum funcționează?'}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                { step: '01', icon: <QrCode size={28}/>, color: 'bg-blue-600', title: locale === 'ru' ? 'Client scanează QR' : 'Clientul scanează QR', desc: locale === 'ru' ? 'QR pe masă, la casă sau pe bon. Clientul scanează în 2 secunde.' : 'QR pe masă, la casă, pe bon sau pe perete. Clientul scanează în 2 secunde.' },
                { step: '02', icon: <Star size={28}/>, color: 'bg-amber-500', title: locale === 'ru' ? 'Lasă recenzia' : 'Lasă recenzia', desc: locale === 'ru' ? '5 stele → redirect automat pe Google. 1-3 stele → mesaj privat pe Telegram.' : '5 stele → redirect automat pe Google. 1-3 stele → mesaj privat direct pe Telegram.' },
                { step: '03', icon: <BellRing size={28}/>, color: 'bg-emerald-600', title: locale === 'ru' ? 'Tu acționezi instant' : 'Tu acționezi instant', desc: locale === 'ru' ? 'Primești notificare pe Telegram. Răspunzi cu un click. Google Reviews cresc.' : 'Notificare pe Telegram. Răspunzi cu un click. Clienți fideli. Google cresc.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-slate-100 font-black text-5xl leading-none">{item.step}</div>
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Phone + ROI */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <div className="relative w-[260px] h-[520px] bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden">
                  <div className="bg-white h-full w-full p-5 flex flex-col items-center text-center justify-between relative">
                    <div className={`absolute top-4 left-3 right-3 z-20 transition-all duration-700 ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                      <div className="bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-red-500 p-1 rounded-lg animate-pulse"><BellRing size={10} className="text-white"/></div>
                          <p className="text-red-400 text-[9px] font-black uppercase">Telegram Alert!</p>
                        </div>
                        <p className="text-slate-300 text-[10px]">2★ — Ion M. @ Central. "Așteptare prea lungă"</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black italic text-xl mt-12 shadow-xl">Q</div>
                    <h4 className="font-black text-slate-950 text-lg uppercase tracking-tighter">
                      {locale === 'ru' ? 'Experiența ta?' : 'Experiența ta?'}
                    </h4>
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
              <ROICalculator locale={locale}/>
            </div>
          </div>
        </section>

        {/* INDUSTRII */}
        <section id="industrii" className="py-20 px-6 scroll-mt-24 bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">
                {locale === 'ru' ? 'Pentru orice afacere' : 'Pentru orice afacere din Moldova'}
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                {locale === 'ru' ? 'Selectează tipul afacerii' : 'Selectează tipul afacerii tale'}
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {industries.map((ind, i) => (
                <button key={i} onClick={() => setSelectedIndustry(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${selectedIndustry === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'}`}>
                  {ind.icon} {ind.label}
                </button>
              ))}
            </div>
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
                {locale === 'ru' ? 'Testează gratuit' : 'Testează gratuit — 7 zile'} <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </section>

        {/* FUNCȚII */}
        <section id="functii" className="py-20 px-6 scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <Award size={12}/> 12 {locale === 'ru' ? 'funcții puternice' : 'Funcții Puternice'}
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                {locale === 'ru' ? 'Tot ce primești în QRate' : 'Tot ce primești în QRate'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
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
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 group">
                  <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{f.icon}</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DEMO QR LIVE */}
        <section id="demo-qr" className="py-20 px-6 scroll-mt-24 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">
                  {locale === 'ru' ? 'Testează acum — e gratuit' : 'Testează acum — e gratuit'}
                </p>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-950 mb-4">
                  {locale === 'ru' ? 'Scanează și vezi cum arată' : 'Scanează și vezi cum arată'}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {locale === 'ru'
                    ? 'Acesta e exact ce vede clientul tău când scanează QR-ul. Încearcă pe telefon acum.'
                    : 'Acesta e exact ce vede clientul tău când scanează QR-ul din locație. Încearcă pe telefon acum.'}
                </p>
                <div className="space-y-3">
                  {[
                    { icon: '📱', text: locale === 'ru' ? 'Deschide camera telefonului' : 'Deschide camera telefonului' },
                    { icon: '🎯', text: locale === 'ru' ? 'Scanează codul QR alăturat' : 'Scanează codul QR alăturat' },
                    { icon: '⭐', text: locale === 'ru' ? 'Lasă o recenzie demo — 10 secunde' : 'Lasă o recenzie demo — 10 secunde' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-sm font-bold text-slate-700">{s.text}</span>
                    </div>
                  ))}
                </div>
                <a href="/rate/demo" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-5 text-blue-600 hover:text-blue-700 font-black text-xs uppercase tracking-wider transition-colors">
                  {locale === 'ru' ? 'Deschide direct pe desktop →' : 'Sau deschide direct pe desktop →'}
                </a>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-2xl shadow-slate-200">
                  <div className="bg-slate-950 text-white text-center py-2 px-4 rounded-xl mb-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">QRate Demo</p>
                    <p className="text-xs font-black text-white">qrate.md/rate/demo</p>
                  </div>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.qrate.md/rate/demo&bgcolor=ffffff&color=0f172a&margin=10&qzone=1"
                    alt="QRate Demo QR"
                    width={180}
                    height={180}
                    className="rounded-2xl"
                  />
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Demo activ · Scanează acum</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-wider">
                  {locale === 'ru' ? 'Funcționează pe orice telefon' : 'Funcționează pe orice telefon cu cameră'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TABEL COMPARATIV */}
        <section className="py-20 px-6 bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">
                {locale === 'ru' ? 'De ce QRate?' : 'De ce QRate?'}
              </p>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-950">
                QRate vs {locale === 'ru' ? 'alte soluții' : 'alte soluții'}
              </h2>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[38%]">Funcționalitate</th>
                    <th className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                        <Zap size={11}/> QRate
                      </span>
                    </th>
                    <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase">Google Forms</th>
                    <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase hidden sm:table-cell">Fișe hârtie</th>
                    <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase hidden md:table-cell">Nimic</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Notificări instant Telegram', q: true, f: false, p: false, n: false },
                    { feature: 'Recenzii negative nu ajung pe Google', q: true, f: false, p: false, n: false },
                    { feature: 'Redirect automat Google (4-5★)', q: true, f: false, p: false, n: false },
                    { feature: 'AI răspunsuri + WhatsApp', q: true, f: false, p: false, n: false },
                    { feature: 'Analytics + Leaderboard angajați', q: true, f: '⚠️', p: false, n: false },
                    { feature: 'Crisis Mode (3+ recenzii negative)', q: true, f: false, p: false, n: false },
                    { feature: 'QR individualizat per angajat', q: true, f: false, p: false, n: false },
                    { feature: 'Setup în 5 minute', q: true, f: true, p: true, n: true },
                    { feature: 'Preț lunar', q: 'de la 450 MDL', f: 'Gratuit', p: '~500 MDL', n: '0 MDL 😬' },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/20 transition-colors`}>
                      <td className="p-4 text-xs font-bold text-slate-700">{row.feature}</td>
                      {[row.q, row.f, row.p, row.n].map((val, j) => (
                        <td key={j} className={`p-4 text-center ${j >= 2 ? (j === 2 ? 'hidden sm:table-cell' : 'hidden md:table-cell') : ''}`}>
                          {val === true ? <span className="text-emerald-500 text-lg font-black">✓</span>
                            : val === false ? <span className="text-rose-400 text-lg">✗</span>
                            : <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">{val}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-8">
              <Link href="/auth/register" className="inline-flex items-center gap-2 bg-slate-950 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-xl">
                {locale === 'ru' ? 'Încearcă QRate gratuit' : 'Încearcă QRate gratuit — 7 zile'} <ChevronRight size={14}/>
              </Link>
            </div>

            {/* WhatsApp CTA */}
            <div className="mt-10 flex justify-center">
              <a
                href="https://wa.me/37368688484?text=Buna%20ziua%2C%20vreau%20informatii%20despre%20QRate.md"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 bg-[#25D366] hover:bg-[#1dbb5a] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-green-500/40"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest leading-none">
                    {locale === 'ru' ? 'Scrie-ne pe WhatsApp' : 'Scrie-ne pe WhatsApp'}
                  </p>
                  <p className="text-green-200 text-[10px] font-bold mt-0.5">
                    {locale === 'ru' ? 'Răspundem în câteva minute' : 'Răspundem în câteva minute'}
                  </p>
                </div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-1"/>
              </a>
            </div>
          </div>
        </section>

        {/* PREȚURI */}
        <section id="preturi" className="py-20 px-6 scroll-mt-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-950">
                {locale === 'ru' ? 'Prețuri transparente' : 'Prețuri Transparente'}
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                {locale === 'ru' ? '7 zile gratuit · Fără card · Anulezi oricând' : '7 zile gratuit · Fără card bancar · Anulezi oricând'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* CONTACT */}
        <section id="contact" className="py-20 px-6 bg-slate-950 scroll-mt-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">Contact</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3">
              {locale === 'ru' ? 'Suntem la un apel distanță' : 'Suntem la un apel distanță'}
            </h2>
            <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto">
              {locale === 'ru' ? 'Te ajutăm să configurezi QRate în 15 minute.' : 'Te ajutăm să configurezi QRate pentru afacerea ta în 15 minute.'}
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
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Plăți securizate' : 'Plăți Securizate'}</h4>
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



      {/* COOKIE */}
      {showCookieBanner && (
        <aside className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-sm bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-slate-800 z-50">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400 shrink-0"><Cookie size={18}/></div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-1">
                {locale === 'ru' ? 'Cookie' : 'Politica Cookie'}
              </h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                {locale === 'ru' ? 'Folosim cookie-uri tehnice obligatorii.' : 'Folosim cookie-uri tehnice obligatorii pentru sesiunea ta.'}
              </p>
              <button onClick={() => { localStorage.setItem('qrate_cookie_consent', 'accepted'); setShowCookieBanner(false); }}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                {locale === 'ru' ? 'Принять' : 'Accept'}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}