'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap, Check, Mail, QrCode, Send, BarChart3, Globe, Cookie,
  LogOut, LayoutDashboard, BellRing,
  Star, Building,
  Smartphone, Phone,
  Utensils, ShoppingBag, Car,
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
    { icon: <Utensils size={18}/>, label: locale === 'ru' ? 'Ресторан' : 'Restaurant',
      pain: locale === 'ru' ? 'Клиент ушёл недоволен — ты узнал только из негативного отзыва на Google.' : 'Clientul a plecat nemulțumit — ai aflat doar după recenzia negativă pe Google.',
      solution: locale === 'ru' ? 'QRate перехватывает отзыв до того, как он попадёт на Google, и отправляет его прямо в Telegram.' : 'QRate prinde recenzia negativă înainte să ajungă pe Google și o trimite direct la tine pe Telegram.' },
    { icon: <ShoppingBag size={18}/>, label: locale === 'ru' ? 'Магазин' : 'Magazin',
      pain: locale === 'ru' ? 'Не знаешь, у какого сотрудника проблемы с клиентами.' : 'Nu știi ce angajat are probleme cu clienții.',
      solution: locale === 'ru' ? 'Индивидуальный QR на каждого сотрудника. Автоматический рейтинг. Знаешь точно, кто работает лучше.' : 'QR individual per angajat. Leaderboard automat. Știi exact cine performează.' },
    { icon: <Car size={18}/>, label: locale === 'ru' ? 'Авто-сервис' : 'Auto-service',
      pain: locale === 'ru' ? 'Клиенты не оставляют отзывы на Google, даже если довольны.' : 'Clienții nu lasă recenzii pe Google deși sunt mulțumiți.',
      solution: locale === 'ru' ? 'QRate автоматически перенаправляет клиентов с оценкой 4–5 звёзд на Google Reviews. Стань заметнее.' : 'QRate redirectează automat clienții cu 4–5 stele spre Google Reviews. Fii mai vizibil.' },
    { icon: <Scissors size={18}/>, label: locale === 'ru' ? 'Салон / СПА' : 'Salon / Spa',
      pain: locale === 'ru' ? 'Несколько точек — и непонятно, какая работает лучше.' : 'Ai mai multe locații dar nu știi care performează cel mai bine.',
      solution: locale === 'ru' ? 'Единая панель управления. Сравнение локаций в реальном времени. Реагируешь быстро.' : 'Dashboard central. Comparativ locații în timp real. Acționezi rapid.' },
    { icon: <Package size={18}/>, label: locale === 'ru' ? 'Доставка' : 'Livrare',
      pain: locale === 'ru' ? 'Курьер создаёт проблемы, но клиенты молчат.' : 'Curierul are probleme dar clienții nu spun direct.',
      solution: locale === 'ru' ? 'QR для каждого курьера. Анонимные отзывы. Знаешь точно, кто виноват.' : 'QR per curier. Recenzii anonime. Știi exact cine creează probleme.' },
  ];

  const switchLanguage = (newLocale: typeof locales[number]) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      window.location.replace(`/${locale}/auth/confirm${window.location.hash}`);
    }
  }, []);

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
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white/10 p-0.5 rounded-lg gap-0.5">
            <button onClick={() => switchLanguage('ro')}
              className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${locale === 'ro' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              RO
            </button>
            <button onClick={() => switchLanguage('ru')}
              className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${locale === 'ru' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              RU
            </button>
          </div>
          <a href="tel:+37368688484" className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2 py-1.5 rounded-xl text-[9px] font-black">
            <Phone size={9}/> 068 688 484
          </a>
          {!isLoggedIn ? (
            <Link href="/auth/login" className="bg-white/10 text-white px-2 py-1.5 rounded-xl text-[9px] font-black uppercase">Login</Link>
          ) : (
            <Link href="/dashboard" className="bg-blue-600 text-white px-2 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1">
              <LayoutDashboard size={9}/> App
            </Link>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 bg-white/10 rounded-xl">
            <ChevronDown size={13} className={`text-white transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[42px] left-0 right-0 z-[59] bg-slate-950 border-b border-white/10 px-4 py-3 flex flex-wrap gap-3">
          {[
            { id: 'functii', label: locale === 'ru' ? 'Функции' : 'Funcții' },
            { id: 'industrii', label: locale === 'ru' ? 'Отрасли' : 'Industrii' },
            { id: 'demo', label: 'Demo' },
            { id: 'preturi', label: locale === 'ru' ? 'Цены' : 'Prețuri' },
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
              { id: 'industrii', label: locale === 'ru' ? 'Отрасли' : 'Industrii' },
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
        <section className="pt-24 md:pt-32 pb-16 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"/>
          <div className="absolute top-20 left-0 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"/>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* LEFT — text */}
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                  {locale === 'ru' ? 'Платформа №1 отзывов в Молдове' : 'Platforma #1 de recenzii din Moldova'}
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-[900] tracking-tighter text-slate-950 uppercase leading-[0.88] mb-6">
                  {locale === 'ru' ? (
                    <>Репутация которая<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">продаёт за тебя</span></>
                  ) : (
                    <>Reputația care<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">vinde în locul tău</span></>
                  )}
                </h1>

                <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-lg">
                  {locale === 'ru'
                    ? 'QR — Отзыв — Telegram. Недовольные клиенты не попадают на Google. Довольные — да.'
                    : 'QR — Recenzie — Telegram. Clienții nemulțumiți nu ajung pe Google. Cei fericiți — da.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2">
                    {isLoggedIn ? 'Dashboard' : (locale === 'ru' ? 'Начать бесплатно — 7 дней' : 'Încearcă Gratuit — 7 zile')}
                    <ArrowRight size={14}/>
                  </Link>
                  <button onClick={() => scrollTo('demo')}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 px-7 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:shadow-lg">
                    <Play size={13} className="text-blue-600 fill-blue-600"/>
                    {locale === 'ru' ? 'Как это работает' : 'Cum funcționează'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    locale === 'ru' ? '7 дней бесплатно' : '7 zile gratuit',
                    locale === 'ru' ? 'Без банковской карты' : 'Fără card bancar',
                    locale === 'ru' ? 'Настройка за 5 минут' : 'Configurare în 5 minute',
                  ].map((prop, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"/>{prop}
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT — dashboard preview */}
              <div className="hidden lg:block">
                <div className="bg-slate-950 rounded-3xl p-5 shadow-2xl border border-white/10 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 p-1.5 rounded-lg"><Zap className="text-white fill-white" size={12}/></div>
                      <span className="text-white font-black text-sm italic uppercase">QRate<span className="text-blue-400">.MD</span></span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-black uppercase bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                      {locale === 'ru' ? 'Live' : 'Live'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { val: '4.8', label: locale === 'ru' ? 'Рейтинг' : 'Rating mediu', color: 'text-white' },
                      { val: '+23', label: locale === 'ru' ? 'Отзывов/мес' : 'Recenzii/lună', color: 'text-emerald-400' },
                      { val: '87', label: locale === 'ru' ? 'QRate Score' : 'QRate Score', color: 'text-blue-400' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-2xl p-3 text-center">
                        <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>
                      <p className="text-[9px] text-red-400 font-black uppercase">{locale === 'ru' ? 'Новый отзыв — 2 звезды' : 'Recenzie nouă — 2 stele'}</p>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {locale === 'ru' ? '"Ожидание слишком долгое за столом 3"' : '"Așteptare prea lungă la masa 3"'}
                    </p>
                    <p className="text-slate-500 text-[9px] mt-1">Ion M. • {locale === 'ru' ? '2 минуты назад' : 'acum 2 minute'}</p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>
                      <p className="text-[9px] text-emerald-400 font-black uppercase">{locale === 'ru' ? 'Перенаправлен на Google' : 'Redirectat pe Google'}</p>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {locale === 'ru' ? '"Лучшее обслуживание в Кишинёве!"' : '"Cel mai bun serviciu din Chișinău!"'}
                    </p>
                    <p className="text-slate-500 text-[9px] mt-1">Maria P. • 5★ • {locale === 'ru' ? '8 минут назад' : 'acum 8 minute'}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 font-black uppercase">{locale === 'ru' ? 'Сегодня' : 'Astăzi'}: 7 {locale === 'ru' ? 'отзывов' : 'recenzii'}</p>
                    <div className="flex items-center gap-1">
                      {[5,4,4,5,2,3,5].map((r,i) => (
                        <div key={i} className={`w-5 h-5 rounded-lg text-[8px] font-black flex items-center justify-center ${r>=4?'bg-emerald-500/20 text-emerald-400':r===3?'bg-amber-500/20 text-amber-400':'bg-red-500/20 text-red-400'}`}>{r}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CUM FUNCTIONEAZA */}
        <section id="demo" className="py-20 px-6 scroll-mt-24 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">{locale === 'ru' ? 'Просто как 1-2-3' : 'Simplu ca 1-2-3'}</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                {locale === 'ru' ? 'Как это работает?' : 'Cum funcționează?'}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                { step: '01', icon: <QrCode size={28}/>, color: 'bg-blue-600',
                  title: locale === 'ru' ? 'Клиент сканирует QR' : 'Clientul scanează QR',
                  desc: locale === 'ru' ? 'QR на столе, у кассы или на чеке. Клиент сканирует за 2 секунды.' : 'QR pe masă, la casă, pe bon sau pe perete. Clientul scanează în 2 secunde.' },
                { step: '02', icon: <Star size={28}/>, color: 'bg-amber-500',
                  title: locale === 'ru' ? 'Оставляет отзыв' : 'Lasă recenzia',
                  desc: locale === 'ru' ? '5 звёзд — автоматический редирект на Google. 1–3 звезды — личное сообщение в Telegram.' : '5 stele — redirect automat pe Google. 1–3 stele — mesaj privat pe Telegram.' },
                { step: '03', icon: <BellRing size={28}/>, color: 'bg-emerald-600',
                  title: locale === 'ru' ? 'Ты реагируешь сразу' : 'Tu acționezi instant',
                  desc: locale === 'ru' ? 'Получаешь уведомление в Telegram. Отвечаешь в один клик. Рейтинг на Google растёт.' : 'Notificare pe Telegram. Răspunzi cu un click. Clienți fideli. Google cresc.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-slate-100 font-black text-5xl leading-none">{item.step}</div>
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Phone + 6 Features */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <div className="relative w-[260px] h-[520px] bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden">
                  <div className="bg-white h-full w-full p-5 flex flex-col items-center text-center justify-between relative">
                    <div className={`absolute top-4 left-3 right-3 z-20 transition-all duration-700 ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                      <div className="bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-red-500 p-1 rounded-lg animate-pulse"><BellRing size={10} className="text-white"/></div>
                          <p className="text-red-400 text-[9px] font-black uppercase">Telegram Alert</p>
                        </div>
                        <p className="text-slate-300 text-[10px]">
                          {locale === 'ru' ? '2 — Ion M. @ Central. "Asteptare prea lunga"' : '2 — Ion M. @ Central. "Așteptare prea lungă"'}
                        </p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black italic text-xl mt-12 shadow-xl">Q</div>
                    <h4 className="font-black text-slate-950 text-lg uppercase tracking-tighter">
                      {locale === 'ru' ? 'Ваш отзыв?' : 'Experiența ta?'}
                    </h4>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <div key={star} className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${star <= 4 ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}>★</div>
                      ))}
                    </div>
                    <div className="w-full p-3 bg-slate-50 rounded-xl border text-[10px] text-slate-400 italic text-left min-h-[60px] flex items-center">
                      {locale === 'ru' ? 'Быстрое обслуживание, рекомендую!' : 'Serviciu rapid, recomand!'}
                    </div>
                    <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider">
                      {locale === 'ru' ? 'Отправить отзыв' : 'Trimite Recenzia'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Feature cards mari */}
              <div id="functii" className="space-y-4 scroll-mt-24">
                {[
                  {
                    icon: <Send size={24}/>,
                    color: 'bg-blue-600',
                    title: locale === 'ru' ? 'Мгновенные уведомления в Telegram' : 'Notificări instant pe Telegram',
                    desc: locale === 'ru'
                      ? 'Клиент сканирует QR и оставляет отзыв за 10 секунд. Ты получаешь сообщение в Telegram сразу — включая Crisis Mode при 3+ негативных за 30 минут.'
                      : 'Clientul scanează QR-ul și lasă recenzia în 10 secunde. Tu primești mesajul pe Telegram imediat — inclusiv Crisis Mode la 3+ negative în 30 de minute.',
                    points: locale === 'ru'
                      ? ['Индивидуальный QR для каждого сотрудника или локации', 'Crisis Mode — красная тревога при волне негативных отзывов', 'Анонимные отзывы без лишних усилий для клиента']
                      : ['QR individual per angajat sau locație', 'Crisis Mode — alertă roșie la val de recenzii negative', 'Recenzii anonime fără fricțiune pentru client'],
                  },
                  {
                    icon: <BarChart3 size={24}/>,
                    color: 'bg-violet-600',
                    title: locale === 'ru' ? 'Репутация на Google в автопилоте' : 'Reputație Google în pilotaj automat',
                    desc: locale === 'ru'
                      ? 'Довольные клиенты (4–5 звёзд) автоматически перенаправляются на Google Reviews. Недовольные остаются приватными. Рейтинг растёт без усилий.'
                      : 'Clienții mulțumiți (4–5 stele) sunt redirecționați automat spre Google Reviews. Cei nemulțumiți rămân privați. Ratingul crește fără efort.',
                    points: locale === 'ru'
                      ? ['Dashboard с тепловой картой по часам и QRate Score 0–100', 'Рейтинг сотрудников — знаешь точно кто лучший', 'Виджет для вставки на твой сайт']
                      : ['Dashboard cu heatmap orar și QRate Score 0–100', 'Leaderboard angajați — știi cine performează', 'Widget embed pentru site-ul tău'],
                  },
                  {
                    icon: <Smartphone size={24}/>,
                    color: 'bg-emerald-600',
                    title: locale === 'ru' ? 'Прямой контакт с недовольным клиентом' : 'Contact direct cu clientul nemulțumit',
                    desc: locale === 'ru'
                      ? 'Кнопка WhatsApp прямо в уведомлении. Персонализированный ответ готов к отправке. Recovery Win — уведомление когда недовольный клиент возвращается с 5 звёздами.'
                      : 'Un buton WhatsApp direct în notificare. Răspuns personalizat gata de trimis. Recovery Win — alertă când un client nemulțumit revine cu 5 stele.',
                    points: locale === 'ru'
                      ? ['WhatsApp Follow-up в один клик', 'Обнаружение проблемных слов в отзывах', 'Все локации в одной панели управления']
                      : ['WhatsApp Follow-up cu un singur click', 'Detectare cuvinte problemă în recenzii', 'Toate locațiile dintr-un singur panou'],
                  },
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg`}>{f.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 mb-1">{f.title}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed mb-3">{f.desc}</p>
                        <ul className="space-y-1">
                          {f.points.map((p, j) => (
                            <li key={j} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                              <Check size={10} className="text-blue-500 shrink-0"/>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* INDUSTRII */}
        <section id="industrii" className="py-20 px-6 scroll-mt-24 bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">
                {locale === 'ru' ? 'Для любого бизнеса' : 'Pentru orice afacere din Moldova'}
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                {locale === 'ru' ? 'Выбери тип своего бизнеса' : 'Selectează tipul afacerii tale'}
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
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">
                  {locale === 'ru' ? 'Без QRate' : 'Fara QRate'}
                </p>
                <p className="text-white font-bold text-base leading-relaxed">{industries[selectedIndustry].pain}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">
                  {locale === 'ru' ? 'С QRate' : 'Cu QRate'}
                </p>
                <p className="text-white font-bold text-base leading-relaxed">{industries[selectedIndustry].solution}</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link href="/auth/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all">
                {locale === 'ru' ? 'Попробуй бесплатно — 7 дней' : 'Testează gratuit — 7 zile'} <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </section>

        {/* PRETURI */}
        <section id="preturi" className="py-20 px-6 scroll-mt-24 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">
                {locale === 'ru' ? 'Тарифы' : 'Planuri si Preturi'}
              </p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-950">
                {locale === 'ru' ? 'Прозрачные цены' : 'Preturi Transparente'}
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                {locale === 'ru' ? '7 дней бесплатно · Без банковской карты · Отмена в любой момент' : '7 zile gratuit · Fara card bancar · Anulezi oricand'}
              </p>
              <p className="text-slate-500 mt-3 text-xs max-w-xl mx-auto">
                {locale === 'ru'
                  ? 'Все планы включают: QR-коды, уведомления Telegram, панель управления, Google Reviews, Crisis Mode и WhatsApp. Разница — только в количестве локаций и сотрудников.'
                  : 'Toate planurile includ: coduri QR, alerte Telegram, panou de control, Google Reviews, Crisis Mode si WhatsApp. Diferenta — doar numarul de locatii si angajati.'}
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
                      {isSelected && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{locale === 'ru' ? 'Выбран' : 'Selectat'}</span>}
                    </div>
                    <h3 className="text-lg font-black italic uppercase text-slate-900">{plan.label}</h3>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-black">{plan.price}</span>
                      <span className="text-slate-400 text-xs font-bold">MDL/{locale === 'ru' ? 'мес' : 'luna'}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4 flex-1">
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>{plan.locations} {locale === 'ru' ? (plan.locations === 1 ? 'локация' : 'локации') : (plan.locations === 1 ? 'locatie' : 'locatii')}</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>{plan.maxEmployees === 999 ? 'Nelimitat' : plan.maxEmployees} {locale === 'ru' ? 'сотрудников' : 'angajati'}</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>QR + Telegram + {locale === 'ru' ? 'Аналитика' : 'Analytics'}</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>Google Reviews + {locale === 'ru' ? 'Виджет' : 'Widget'}</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>Crisis Mode + {locale === 'ru' ? 'Ключевые слова' : 'Cuvinte cheie'}</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>WhatsApp Follow-up</li>
                      <li className="flex items-center gap-1.5"><Check size={11} className="text-blue-500 shrink-0"/>{locale === 'ru' ? '7 дней бесплатно' : '7 zile gratuit'}</li>
                    </ul>
                    <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}
                      className={`block w-full py-3 rounded-2xl font-black uppercase text-xs tracking-wider text-center transition-all ${isSelected ? 'bg-blue-600 text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'}`}
                      onClick={e => e.stopPropagation()}>
                      {isLoggedIn ? (locale === 'ru' ? 'Активировать' : 'Activeaza') : (locale === 'ru' ? 'Выбрать план' : 'Alege Planul')}
                    </Link>
                  </article>
                );
              })}
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
                    {locale === 'ru' ? 'Напишите нам в WhatsApp' : 'Scrie-ne pe WhatsApp'}
                  </p>
                  <p className="text-green-200 text-[10px] font-bold mt-0.5">
                    {locale === 'ru' ? 'Ответим за несколько минут' : 'Raspundem in cateva minute'}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-20 px-6 bg-slate-950 scroll-mt-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">Contact</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3">
              {locale === 'ru' ? 'На расстоянии одного звонка' : 'Suntem la un apel distanta'}
            </h2>
            <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto">
              {locale === 'ru' ? 'Помогаем настроить QRate для вашего бизнеса за 15 минут.' : 'Te ajutam sa configurezi QRate pentru afacerea ta in 15 minute.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <a href="tel:+37368688484" className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 p-6 rounded-3xl transition-all duration-300">
                <div className="w-12 h-12 bg-blue-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <Phone size={20} className="text-white group-hover:text-blue-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-200 uppercase tracking-widest mb-0.5 transition-colors">{locale === 'ru' ? 'Телефон' : 'Telefon'}</p>
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
                  <p className="text-slate-500 group-hover:text-indigo-200 text-[10px] font-bold mt-0.5 transition-colors">{locale === 'ru' ? 'Поддержка' : 'Suport'}</p>
                </div>
              </a>
              <div className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-500 p-6 rounded-3xl transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <Globe size={20} className="text-white group-hover:text-emerald-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-emerald-200 uppercase tracking-widest mb-0.5 transition-colors">{locale === 'ru' ? 'Сайт' : 'Web'}</p>
                  <p className="text-white font-black text-sm">www.qrate.md</p>
                  <p className="text-slate-500 group-hover:text-emerald-200 text-[10px] font-bold mt-0.5 transition-colors">{locale === 'ru' ? 'Республика Молдова' : 'Republica Moldova'}</p>
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
                <p>mun. Orhei, str. Salciilor 75</p>
                <p>Republica Moldova</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Документы' : 'Documente'}</h4>
              <ul className="space-y-2.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                <li><a href={`/${locale}/terms`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Условия использования' : 'Termeni si conditii'}</a></li>
                <li><a href={`/${locale}/privacy`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Конфиденциальность' : 'Confidentialitate'}</a></li>
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
              <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Безопасные платежи' : 'Plati Securizate'}</h4>
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
                {locale === 'ru' ? 'Политика Cookie' : 'Politica Cookie'}
              </h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                {locale === 'ru' ? 'Мы используем обязательные технические cookie для вашей сессии.' : 'Folosim cookie-uri tehnice obligatorii pentru sesiunea ta.'}
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
