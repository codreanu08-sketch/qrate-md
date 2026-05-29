'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Check, Mail, QrCode, Send, BarChart3, Globe, Cookie,
  LogOut, LayoutDashboard, ShieldAlert, BellRing, Activity,
  Star, Trophy, Sparkles, Building, ChevronRight, Flame,
  Target, Award, Bot, Smartphone, Shield, Users, Phone
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

const FEATURES_RO = [
  { icon: <QrCode size={24}/>, color: 'bg-blue-100 text-blue-600', title: 'QR Coduri Unice', desc: 'Cod QR pentru fiecare locație sau angajat. Clientul scanează și lasă recenzie în 2 click-uri.' },
  { icon: <Send size={24}/>, color: 'bg-indigo-100 text-indigo-600', title: 'Alerte Telegram', desc: 'Primești notificare instantanee pe Telegram la fiecare recenzie negativă nouă.' },
  { icon: <BarChart3 size={24}/>, color: 'bg-violet-100 text-violet-600', title: 'Analytics Avansat', desc: 'Heatmap orar, comparativ locații, leaderboard angajați și QRate Score 0-100.' },
  { icon: <Sparkles size={24}/>, color: 'bg-amber-100 text-amber-600', title: 'AI Predicții', desc: 'Sistemul prezice nota medie pentru luna viitoare.' },
  { icon: <Flame size={24}/>, color: 'bg-rose-100 text-rose-600', title: 'Crisis Mode', desc: 'Alertă roșie imediată la 3+ recenzii negative în 30 min.' },
  { icon: <Trophy size={24}/>, color: 'bg-amber-100 text-amber-700', title: 'Recovery Win', desc: 'Notificare automată când un client nemulțumit revine cu 5 stele.' },
  { icon: <Star size={24}/>, color: 'bg-emerald-100 text-emerald-600', title: 'Google Reviews', desc: 'Redirecționare automată a clienților fericiți spre Google Reviews.' },
  { icon: <Bot size={24}/>, color: 'bg-blue-100 text-blue-700', title: 'AI Răspuns Smart', desc: 'Generează răspunsuri personalizate instant. Trimite pe WhatsApp cu un click.' },
  { icon: <Smartphone size={24}/>, color: 'bg-green-100 text-green-600', title: 'WhatsApp Follow-up', desc: 'Lista clienților nemulțumiți cu telefon. Trimite mesaje de recuperare direct.' },
  { icon: <Shield size={24}/>, color: 'bg-slate-100 text-slate-600', title: 'QRate Verified Badge', desc: 'Widget embed pentru site-ul tău — ca TrustPilot, dar pentru Moldova.' },
  { icon: <Users size={24}/>, color: 'bg-purple-100 text-purple-600', title: 'Multi-Locații', desc: 'Gestionează toate locațiile dintr-un singur panou de control.' },
  { icon: <Target size={24}/>, color: 'bg-orange-100 text-orange-600', title: 'Keywords Negativi', desc: 'Detectare automată a cuvintelor problemă din recenzii. Alertă la 3+ apariții.' },
];

const FEATURES_RU = [
  { icon: <QrCode size={24}/>, color: 'bg-blue-100 text-blue-600', title: 'Уникальные QR-коды', desc: 'QR-код для каждой локации или сотрудника. Клиент сканирует и оставляет отзыв за 2 клика.' },
  { icon: <Send size={24}/>, color: 'bg-indigo-100 text-indigo-600', title: 'Telegram-уведомления', desc: 'Мгновенное уведомление в Telegram при каждом новом негативном отзыве.' },
  { icon: <BarChart3 size={24}/>, color: 'bg-violet-100 text-violet-600', title: 'Расширенная аналитика', desc: 'Почасовая тепловая карта, сравнение локаций, рейтинг сотрудников и QRate Score 0-100.' },
  { icon: <Sparkles size={24}/>, color: 'bg-amber-100 text-amber-600', title: 'AI-прогнозы', desc: 'Система прогнозирует средний балл на следующий месяц.' },
  { icon: <Flame size={24}/>, color: 'bg-rose-100 text-rose-600', title: 'Режим кризиса', desc: 'Красное оповещение при 3+ негативных отзывах за 30 минут.' },
  { icon: <Trophy size={24}/>, color: 'bg-amber-100 text-amber-700', title: 'Recovery Win', desc: 'Автоматическое уведомление когда недовольный клиент возвращается с 5 звёздами.' },
  { icon: <Star size={24}/>, color: 'bg-emerald-100 text-emerald-600', title: 'Google Reviews', desc: 'Автоматический редирект довольных клиентов на Google Reviews.' },
  { icon: <Bot size={24}/>, color: 'bg-blue-100 text-blue-700', title: 'AI-ответы', desc: 'Генерация персонализированных ответов мгновенно. Отправка в WhatsApp одним кликом.' },
  { icon: <Smartphone size={24}/>, color: 'bg-green-100 text-green-600', title: 'WhatsApp Follow-up', desc: 'Список недовольных клиентов с телефоном. Отправка сообщений о восстановлении напрямую.' },
  { icon: <Shield size={24}/>, color: 'bg-slate-100 text-slate-600', title: 'QRate Verified Badge', desc: 'Виджет для вашего сайта — как TrustPilot, но для Молдовы.' },
  { icon: <Users size={24}/>, color: 'bg-purple-100 text-purple-600', title: 'Мультилокации', desc: 'Управляйте всеми локациями из единой панели управления.' },
  { icon: <Target size={24}/>, color: 'bg-orange-100 text-orange-600', title: 'Негативные ключевые слова', desc: 'Автоматическое обнаружение проблемных слов в отзывах. Оповещение при 3+ появлениях.' },
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
  const [scrolled, setScrolled] = useState(false);

  const currentPlan = PRICING_PLANS[selectedPlanIndex];
  const FEATURES = locale === 'ru' ? FEATURES_RU : FEATURES_RO;

  const switchLanguage = (newLocale: typeof locales[number]) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  // Scroll detection pentru header
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

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 scroll-smooth">
      
      {/* ✅ MOBILE TOP BAR — telefon vizibil pe mobil */}
      <div className="md:hidden bg-slate-950 text-white px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QRate.MD</span>
        <a href="tel:+37368688484" className="flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black text-white">
          <Phone size={11}/> 068 688 484
        </a>
      </div>

      {/* ✅ HEADER ACCENTUAT */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${scrolled ? 'top-0 p-2 md:p-3' : 'top-7 md:top-0 p-2 md:p-4'}`}>
        <nav className={`max-w-7xl w-full backdrop-blur-2xl border rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-slate-950/95 border-slate-800 shadow-2xl' : 'bg-white/90 border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]'}`}>
          
          {/* Logo */}
          <div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer shrink-0">
            <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="text-white fill-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className={`text-lg md:text-xl font-black uppercase tracking-tighter italic ${scrolled ? 'text-white' : 'text-slate-950'}`}>
              QRate<span className="text-blue-500 hidden sm:inline">.MD</span>
            </span>
          </div>

          {/* Nav links desktop */}
          <div className={`hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] ${scrolled ? 'text-slate-400' : 'text-slate-500'}`}>
            <a href="#functii" className="hover:text-blue-500 transition-all">{locale === 'ru' ? 'Функции' : 'Funcții'}</a>
            <a href="#vizual-demo" className="hover:text-blue-500 transition-all">{locale === 'ru' ? 'Демо' : 'Demo'}</a>
            <a href="#preturi" className="hover:text-blue-500 transition-all">{locale === 'ru' ? 'Цены' : 'Prețuri'}</a>
            {/* ✅ Buton Contact in nav */}
            <button onClick={scrollToContact} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${scrolled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600'}`}>
              <Phone size={12}/> {locale === 'ru' ? 'Контакт' : 'Contact'}
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Telefon desktop — vizibil în header */}
            <a href="tel:+37368688484" className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}>
              <Phone size={12}/> 068 688 484
            </a>

            {/* Language switcher */}
            <div className={`flex items-center p-1 rounded-lg md:rounded-2xl border shadow-inner ${scrolled ? 'bg-white/10 border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
              <button onClick={() => switchLanguage('ro')} className={`px-2 md:px-3 py-1.5 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${locale === 'ro' ? 'bg-blue-600 text-white shadow-sm' : scrolled ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>RO</button>
              <button onClick={() => switchLanguage('ru')} className={`px-2 md:px-3 py-1.5 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${locale === 'ru' ? 'bg-blue-600 text-white shadow-sm' : scrolled ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>RU</button>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-1 md:gap-2">
                <Link href="/dashboard" className={`flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                  <LayoutDashboard size={13}/>
                  <span className="hidden sm:inline">{locale === 'ru' ? 'Панель' : 'Dashboard'}</span>
                </Link>
                <button onClick={async () => { await supabase.auth.signOut(); setIsLoggedIn(false); router.refresh(); }} className={`p-2 rounded-xl transition-all ${scrolled ? 'bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`}>
                  <LogOut size={14}/>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className={`hidden sm:block text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-colors ${scrolled ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'}`}>
                  {locale === 'ru' ? 'Войти' : 'Login'}
                </Link>
                <Link href="/auth/register" className="relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 md:px-6 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 whitespace-nowrap">
                  {locale === 'ru' ? 'Начать' : 'Încearcă Gratuit'}
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-20">

        {/* HERO */}
        <section className="pt-28 md:pt-36 pb-16 px-6 text-center">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 text-blue-700 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">
              <Zap size={14} />
              {locale === 'ru' ? 'Платформа №1 отзывов в Молдове' : 'Platforma #1 de recenzii din Moldova'}
            </div>
            <h1 className="text-4xl md:text-6xl font-[900] tracking-tighter text-slate-950 uppercase leading-[0.9]">
              {locale === 'ru' ? 'Умная система отзывов' : 'Recenzii care'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-indigo-800 italic">
                {locale === 'ru' ? 'для вашего бизнеса' : 'fac business-ul să crească'}
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic">
              {locale === 'ru'
                ? 'Собирайте реальные отзывы, отслеживайте эффективность команды и управляйте репутацией в реальном времени.'
                : 'Transformă feedback-ul clienților în creștere reală. QR, Telegram, AI — totul într-un singur panou.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="w-full sm:w-auto bg-blue-600 text-white px-12 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 transition-all text-center">
                {isLoggedIn
                  ? (locale === 'ru' ? 'В панель управления' : 'Mergi la Dashboard')
                  : (locale === 'ru' ? 'Начать бесплатно — 7 дней' : 'Începe Gratuit — 7 zile')}
              </Link>
              <button onClick={scrollToContact} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 px-8 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] transition-all hover:shadow-lg">
                <Phone size={14} className="text-blue-600"/>
                {locale === 'ru' ? 'Связаться' : 'Contactează-ne'}
              </button>
            </div>
          </div>
        </section>

        {/* FUNCȚII */}
        <section id="functii" className="py-24 px-6 bg-[#F8FAFC] scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-5">
                <Award size={14} /> {locale === 'ru' ? '12 мощных функций' : '12 Funcții Puternice'}
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-950">
                {locale === 'ru' ? 'Всё, что вы получаете в QRate' : 'Tot ce primești în QRate'}
              </h2>
              <p className="text-slate-400 text-base mt-4 max-w-xl mx-auto">
                {locale === 'ru'
                  ? 'Всё необходимое предпринимателю Молдовы для управления репутацией.'
                  : 'Tot ce are nevoie un antreprenor din Moldova pentru a gestiona reputația.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 group">
                  <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>{f.icon}</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16">
              <div className="bg-gradient-to-br from-slate-950 to-blue-950 rounded-[3rem] p-10 md:p-14 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-8 text-white text-6xl">★</div>
                  <div className="absolute bottom-4 right-8 text-white text-4xl">★</div>
                </div>
                <div className="relative z-10 text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">
                    {locale === 'ru' ? '7 дней бесплатно' : '7 zile gratuit'}
                  </p>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                    {locale === 'ru' ? 'Попробуйте бесплатно' : 'Încearcă Gratuit'}
                  </h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm">
                    {locale === 'ru'
                      ? 'Полный доступ ко всем функциям на 7 дней. Без банковской карты.'
                      : 'Acces complet la toate funcțiile timp de 7 zile. Fără card bancar.'}
                  </p>
                  <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all hover:scale-105 shadow-2xl shadow-blue-900/50">
                    {locale === 'ru' ? 'Начать сейчас' : 'Începe Acum'} <ChevronRight size={16} />
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
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 text-left">
                <div className="space-y-6 md:space-y-8">
                  <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                    {locale === 'ru' ? 'Как работает' : 'Cum funcționează'} <br />
                    <span className="text-blue-500 italic">{locale === 'ru' ? 'наша система' : 'sistemul nostru'}</span>
                  </h2>
                  <div className="space-y-4">
                    {[
                      { icon: <Zap size={20}/>, title: locale === 'ru' ? 'Быстрое сканирование' : 'Scanare Rapidă', desc: locale === 'ru' ? 'Клиент сканирует QR и оставляет отзыв за 10 секунд' : 'Clientul scanează QR-ul și lasă recenzia în 10 secunde' },
                      { icon: <ShieldAlert size={20}/>, title: locale === 'ru' ? 'Мгновенные оповещения' : 'Alerte Instant', desc: locale === 'ru' ? 'Уведомление в Telegram при каждом негативном отзыве' : 'Notificare pe Telegram imediat ce apare o recenzie negativă' },
                      { icon: <Check size={20}/>, title: locale === 'ru' ? 'AI-ответы' : 'Răspunsuri AI', desc: locale === 'ru' ? 'Профессиональные ответы автоматически за один клик' : 'Generezi răspunsuri profesionale automat cu un singur click' }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-center bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-3 bg-white/10 text-blue-400 rounded-xl shrink-0">{step.icon}</div>
                        <div>
                          <h4 className="text-white font-black uppercase text-xs tracking-widest">{step.title}</h4>
                          <p className="text-slate-400 text-sm mt-1">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative flex justify-center w-full">
                  <div className="relative w-[270px] h-[540px] sm:w-[320px] sm:h-[640px] bg-slate-900 rounded-[2.5rem] sm:rounded-[4rem] border-[10px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="bg-white h-full w-full p-6 flex flex-col items-center text-center justify-between relative">
                      <div className={`absolute top-5 left-3 right-3 z-20 transition-all duration-700 ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                        <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-red-500 p-1.5 rounded-lg animate-pulse"><BellRing size={12} className="text-white" /></div>
                            <p className="text-red-400 text-[10px] font-black uppercase">{locale === 'ru' ? 'Новый отзыв!' : 'Recenzie Nouă!'}</p>
                          </div>
                          <p className="text-slate-300 text-xs">{locale === 'ru' ? 'Клиент оставил 2 звезды на локации Центр.' : 'Un client a lăsat 2 stele la locația Centru.'}</p>
                        </div>
                      </div>
                      <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black italic text-2xl mt-14 shadow-xl">Q</div>
                      <div className="text-left w-full mt-2">
                        <h4 className="font-black text-slate-950 text-xl uppercase tracking-tighter leading-tight">{locale === 'ru' ? 'Оставить отзыв' : 'Lasă o recenzie'}</h4>
                      </div>
                      <div className="flex gap-2 my-3">
                        {[1,2,3,4,5].map(star => (
                          <div key={star} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${star <= 2 ? 'bg-yellow-400 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}>★</div>
                        ))}
                      </div>
                      <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400 italic text-left flex-1 flex items-center min-h-[80px] my-2">
                        {locale === 'ru' ? 'Ваш комментарий...' : 'Comentariul tău...'}
                      </div>
                      <button className="w-full py-4 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider mt-auto">
                        {locale === 'ru' ? 'Отправить отзыв' : 'Trimite Recenzia'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PREȚURI */}
        <section id="preturi" className="py-24 px-6 scroll-mt-24 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-950">
                {locale === 'ru' ? 'Прозрачные цены' : 'Prețuri Simple și Transparente'}
              </h2>
              <p className="text-slate-400 mt-3 text-sm">
                {locale === 'ru' ? '7 дней бесплатно · Без скрытых платежей · Отмена в любой момент' : '7 zile gratuit · Fără costuri ascunse · Anulezi oricând'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {PRICING_PLANS.map((plan, index) => {
                const isSelected = selectedPlanIndex === index;
                return (
                  <article key={plan.id} onClick={() => setSelectedPlanIndex(index)}
                    className={`p-6 md:p-8 rounded-[2.5rem] bg-white border-4 cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-blue-600 shadow-2xl scale-[1.02]' : 'border-slate-100 opacity-70 hover:opacity-100 hover:border-blue-200'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl"><Building size={18} className="text-slate-600" /></div>
                        {isSelected && <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">{locale === 'ru' ? 'Выбран' : 'Selectat'}</span>}
                      </div>
                      <h3 className="text-xl font-black italic uppercase text-slate-900">{plan.label}</h3>
                      <div className="flex items-baseline gap-1 my-3">
                        <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                        <span className="text-slate-400 text-xs font-bold">MDL/{locale === 'ru' ? 'мес' : 'lună'}</span>
                      </div>
                      <ul className="space-y-2 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
                        <li className="flex items-center gap-2"><Check size={12} className="text-blue-500 shrink-0" />{plan.locations} {locale === 'ru' ? (plan.locations === 1 ? 'локация' : 'локации') : (plan.locations === 1 ? 'locație' : 'locații')}</li>
                        <li className="flex items-center gap-2"><Check size={12} className="text-blue-500 shrink-0" />{plan.maxEmployees === 999 ? '∞' : plan.maxEmployees} {locale === 'ru' ? 'сотрудников' : 'angajați'}</li>
                        <li className="flex items-center gap-2"><Check size={12} className="text-blue-500 shrink-0" />QR + Telegram + Analytics</li>
                        <li className="flex items-center gap-2"><Check size={12} className="text-blue-500 shrink-0" />Google Reviews + AI</li>
                      </ul>
                    </div>
                    <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}
                      className={`mt-6 block w-full py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider text-center transition-all ${isSelected ? 'bg-blue-600 text-white hover:bg-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white'}`}
                      onClick={e => e.stopPropagation()}>
                      {isLoggedIn ? (locale === 'ru' ? 'Активировать' : 'Activează') : (locale === 'ru' ? 'Выбрать план' : 'Alege Planul')}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ✅ SECȚIUNE CONTACT */}
        <section id="contact" className="py-20 px-6 bg-slate-950 scroll-mt-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">
              {locale === 'ru' ? 'Связаться с нами' : 'Contactează-ne'}
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
              {locale === 'ru' ? 'Suntem disponibili' : 'Suntem disponibili'}
            </h2>
            <p className="text-slate-400 text-sm mb-10 max-w-xl mx-auto">
              {locale === 'ru'
                ? 'Ai întrebări despre QRate? Suntem la un mesaj distanță.'
                : 'Ai întrebări despre QRate? Suntem la un mesaj distanță.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {/* Telefon — apăsabil */}
              <a href="tel:+37368688484"
                className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 p-6 rounded-3xl transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-blue-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all">
                  <Phone size={20} className="text-white group-hover:text-blue-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-200 uppercase tracking-widest mb-0.5 transition-colors">
                    {locale === 'ru' ? 'Телефон' : 'Telefon'}
                  </p>
                  <p className="text-white font-black text-base tracking-wide">068 688 484</p>
                  <p className="text-slate-500 group-hover:text-blue-200 text-[10px] font-bold mt-0.5 transition-colors">Gheorghe</p>
                </div>
              </a>

              {/* Email */}
              <a href="mailto:suport@qrate.md"
                className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 p-6 rounded-3xl transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <Mail size={20} className="text-white group-hover:text-indigo-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-indigo-200 uppercase tracking-widest mb-0.5 transition-colors">Email</p>
                  <p className="text-white font-black text-sm">suport@qrate.md</p>
                  <p className="text-slate-500 group-hover:text-indigo-200 text-[10px] font-bold mt-0.5 transition-colors">
                    {locale === 'ru' ? 'Поддержка' : 'Suport'}
                  </p>
                </div>
              </a>

              {/* Site */}
              <div className="group flex flex-col items-center gap-3 bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-500 p-6 rounded-3xl transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-600 group-hover:bg-white rounded-2xl flex items-center justify-center shadow-lg transition-all">
                  <Globe size={20} className="text-white group-hover:text-emerald-600 transition-colors"/>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 group-hover:text-emerald-200 uppercase tracking-widest mb-0.5 transition-colors">Web</p>
                  <p className="text-white font-black text-sm">www.qrate.md</p>
                  <p className="text-slate-500 group-hover:text-emerald-200 text-[10px] font-bold mt-0.5 transition-colors">
                    {locale === 'ru' ? 'Republica Moldova' : 'Republica Moldova'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-2 rounded-xl"><Zap className="text-white fill-white" size={18} /></div>
                <span className="text-xl font-black uppercase tracking-tighter italic">QRate<span className="text-blue-600">.MD</span></span>
              </div>
              <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed">
                <p>QR RATING S.R.L.</p>
                <p>IDNO: 1026023041245</p>
                <p>mun. Orhei, str. Sălciilor 75</p>
                <p>Republica Moldova</p>
              </div>
            </div>
            <div className="space-y-5">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Документы' : 'Documente'}</h4>
              <ul className="space-y-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                <li><a href={`/${locale}/terms`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Условия использования' : 'Termeni și condiții'}</a></li>
                <li><a href={`/${locale}/privacy`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Конфиденциальность' : 'Confidențialitate'}</a></li>
                <li><a href={`/${locale}/refund`} className="hover:text-blue-600 transition-colors">{locale === 'ru' ? 'Политика возврата' : 'Politica de rambursare'}</a></li>
              </ul>
            </div>
            <div className="space-y-5">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Поддержка' : 'Suport'}</h4>
              <ul className="space-y-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                <li className="flex items-center gap-2.5">
                  <Phone size={13} className="text-blue-600 shrink-0"/>
                  <a href="tel:+37368688484" className="hover:text-blue-600 transition-colors">068 688 484</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail size={13} className="text-blue-600 shrink-0"/>
                  <a href="mailto:suport@qrate.md" className="hover:text-blue-600 transition-colors">suport@qrate.md</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Globe size={13} className="text-blue-600 shrink-0"/> www.qrate.md
                </li>
              </ul>
            </div>
            <div className="space-y-5">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{locale === 'ru' ? 'Безопасные платежи' : 'Plăți Securizate'}</h4>
              <div className="space-y-3">
                <div className="text-sm font-black text-slate-700">maib</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moldova Agroindbank S.A.</div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600">VISA</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600">MASTERCARD</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">
              © 2026 QR RATING S.R.L. · QRate Moldova · {locale === 'ru' ? 'Все права защищены' : 'Toate drepturile rezervate'}
            </p>
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <aside className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-800 z-50">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600/20 p-2.5 rounded-xl text-blue-400 mt-1 shrink-0"><Cookie size={20} /></div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">{locale === 'ru' ? 'Использование Cookie' : 'Politica Cookie'}</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                {locale === 'ru' ? 'QRate.md использует обязательные технические cookie для защиты сессии.' : 'QRate.md folosește cookie-uri tehnice obligatorii pentru protejarea sesiunii tale.'}
              </p>
              <div className="mt-4 flex justify-end">
                <button onClick={() => { localStorage.setItem('qrate_cookie_consent','accepted'); setShowCookieBanner(false); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  {locale === 'ru' ? 'Принять' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}