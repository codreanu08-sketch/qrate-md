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

  const isStartPlan = locs === 1;
  const isProPlan = locs > 1;

  const startBaseCost = 650;
  const proBaseCostPerLocation = 600;

  const currentSoftwareTotal = isStartPlan ? startBaseCost : (locs * proBaseCostPerLocation);
  const stickerTotal = isStickersAdded ? parseFloat((stickerCount * 0.33).toFixed(2)) : 0;
  const grandTotal = currentSoftwareTotal + stickerTotal;

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
    if (!consent) {
      timer = setTimeout(() => { if (isMounted) setShowCookieBanner(true); }, 1500);
    }
    return () => { isMounted = false; if (timer) clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  const handleAcceptCookies = () => { localStorage.setItem('qrate_cookie_consent', 'accepted'); setShowCookieBanner(false); };
  const handleLogout = async () => { await supabase.auth.signOut(); setIsLoggedIn(false); router.refresh(); };

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
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-2 md:p-4">
        <nav className="max-w-7xl w-full bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between transition-all">
          <div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer shrink-0">
            <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-300">
              <Zap className="text-white fill-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-lg md:text-xl font-black uppercase tracking-tighter italic text-slate-950">QRate<span className="text-blue-600 hidden sm:inline">.MD</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              <a href="#servicii" className="hover:text-blue-600 hover:tracking-[0.3em] transition-all duration-300">{t('nav.services')}</a>
              <a href="#vizual-demo" className="hover:text-blue-600 hover:tracking-[0.3em] transition-all duration-300">{t('nav.demo')}</a>
              <a href="#preturi" className="hover:text-blue-600 hover:tracking-[0.3em] transition-all duration-300">{t('nav.pricing')}</a>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-lg md:rounded-2xl border border-slate-200 shadow-inner">
              <button type="button" onClick={() => switchLanguage('ro')} className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black ${locale === 'ro' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>RO</button>
              <button type="button" onClick={() => switchLanguage('ru')} className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-xl text-[9px] md:text-[10px] font-black ${locale === 'ru' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>RU</button>
            </div>
            {isLoggedIn ? (
              <div className="flex items-center gap-1 md:gap-2 bg-slate-50 p-1 md:p-1.5 rounded-lg md:rounded-2xl border border-slate-200/60">
                <Link href="/dashboard" className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-md border border-slate-200 text-slate-700 font-black uppercase text-[10px]">
                  <LayoutDashboard size={14} className="text-blue-600" /> <span className="hidden sm:inline">{t('nav.dashboard')}</span>
                </Link>
                <button type="button" onClick={handleLogout} className="bg-white p-1.5 rounded-md border border-slate-200"><LogOut size={14} /></button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-[10px] font-black uppercase text-slate-500">{t('nav.login')}</Link>
                <Link href="/auth/register" className="bg-slate-950 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">{t('nav.signup')}</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-20">
        <section className="pt-36 pb-24 px-6 text-center">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 text-blue-700 px-6 py-2.5 rounded-full text-[10px] font-black uppercase animate-bounce">
              <Zap size={14} /> {t('hero.badge')}
            </div>
            <h1 className="text-5xl md:text-7xl font-[900] tracking-tighter text-slate-950 uppercase leading-[0.9] mb-6">
              {t('hero.title_part1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-indigo-800 italic">{t('hero.title_part2')}</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium italic">{t('hero.description')}</p>
            <div className="pt-10 flex justify-center">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"} className="bg-blue-600 text-white px-14 py-8 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:scale-105 transition-all">
                {isLoggedIn ? t('hero.btn_go_dashboard') : t('hero.btn_start')}
              </Link>
            </div>
          </div>
        </section>

        <section id="servicii" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-blue-600 font-black uppercase text-[11px] tracking-[0.4em]">{t('services_section.badge')}</h2>
              <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{t('services_section.title')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              <article className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8"><QrCode size={32}/></div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic">{t('services.qr_employee.title')}</h3>
                <p className="text-slate-500 font-medium">{t('services.qr_employee.desc')}</p>
              </article>
              <article className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                <div className="bg-indigo-600 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8"><Send size={32}/></div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic">{t('services.telegram.title')}</h3>
                <p className="text-slate-500 font-medium">{t('services.telegram.desc')}</p>
              </article>
              <article className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                <div className="bg-slate-950 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8"><BarChart3 size={32}/></div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic">{t('services.management.title')}</h3>
                <p className="text-slate-500 font-medium">{t('services.management.desc')}</p>
              </article>
            </div>
          </div>
        </section>

        <section id="vizual-demo" className="py-16 px-4 md:py-32 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] px-5 py-12 md:p-20 relative border border-white/5 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
                <div className="space-y-6 md:space-y-10">
                  <h2 className="text-3xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85]">
                    {t('demo.title_1')} <br /><span className="text-blue-500 italic">{t('demo.title_2')}</span>
                  </h2>
                  <div className="space-y-4">
                    {[
                      { icon: <Zap size={20}/>, t: t('demo.feature_1_t'), d: t('demo.feature_1_d') },
                      { icon: <ShieldAlert size={20}/>, t: t('demo.feature_2_t'), d: t('demo.feature_2_d') },
                      { icon: <Check size={20}/>, t: t('demo.feature_3_t'), d: t('demo.feature_3_d') }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="p-3 bg-white/10 text-blue-400 rounded-xl">{step.icon}</div>
                        <div>
                          <h4 className="text-white font-black uppercase text-xs">{step.t}</h4>
                          <p className="text-slate-400 text-xs font-medium">{step.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative flex justify-center">
                  <div className="w-[310px] h-[620px] bg-slate-900 rounded-[4rem] border-[12px] border-slate-800 overflow-hidden relative">
                    <div className="bg-white h-full w-full p-8 flex flex-col items-center justify-between">
                      <div className={`absolute top-6 left-3 right-3 transition-all duration-700 ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                        <div className="bg-slate-950 text-white p-4 rounded-3xl border border-white/10 flex items-start gap-3">
                          <div className="bg-red-500 p-2 rounded-xl animate-pulse"><BellRing size={16} /></div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-red-500">{t('demo.notification_badge')}</p>
                            <p className="text-[10px] font-bold text-slate-200">{t('demo.notification_text')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white font-black text-2xl mt-12">Q</div>
                      <h4 className="font-black text-slate-950 text-2xl uppercase">{t('demo.phone_title')}</h4>
                      <div className="flex gap-2.5">
                        {[1, 2, 3, 4, 5].map((star) => <div key={star} className={`w-10 h-10 rounded-2xl flex items-center justify-center ${star <= 2 ? 'bg-yellow-400' : 'bg-slate-100'}`}>★</div>)}
                      </div>
                      <div className="w-full p-5 bg-slate-50 rounded-[2rem] text-xs text-slate-400 font-bold italic flex-1 flex items-center my-2">{t('demo.phone_placeholder')}</div>
                      <button className="w-full py-6 bg-red-600 text-white rounded-[1.5rem] font-black uppercase">{t('demo.phone_btn')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="preturi" className="py-32 px-6 scroll-mt-24 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-blue-600 font-black uppercase text-[11px] tracking-[0.4em] mb-3">{t('pricing.badge')}</h2>
              <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                {t('pricing.title_part1')} <span className="text-blue-600">{t('pricing.title_part2')}</span>
              </p>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-around gap-8 mb-12">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{t('pricing.configurator.locations')}</span>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => handleLocChange(Math.max(1, locs - 1))} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white">-</button>
                  <span className="text-4xl font-black w-12 text-center">{locs}</span>
                  <button type="button" onClick={() => handleLocChange(locs + 1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white">+</button>
                </div>
              </div>
              <div className={`flex flex-col items-center ${isProPlan ? 'opacity-100 scale-110 text-blue-600' : 'opacity-20 grayscale'}`}>
                <ShieldCheck size={40} />
                <span className="text-[9px] font-black uppercase mt-2">PRO PLAN ACTIVATED</span>
              </div>
            </div>

            <div className={`transition-all duration-500 p-6 rounded-[2.5rem] shadow-lg flex flex-col md:flex-row items-center gap-6 mb-12 border-b-4 ${isStickersAdded ? 'bg-blue-600 text-white border-blue-800' : 'bg-slate-900 text-white border-slate-700'}`}>
              <div className={`p-4 rounded-2xl ${isStickersAdded ? 'bg-white text-blue-600' : 'bg-blue-600'}`}><QrCode size={32} /></div>
              <div className="text-left flex-1">
                <h4 className="text-lg font-black uppercase italic tracking-tight">{t('pricing.stickers.title')}</h4>
                <p className="text-[10px] font-bold opacity-70 italic uppercase">{t('pricing.stickers.subtitle')}</p>
              </div>
              <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl">
                <div className="flex flex-col items-center px-2">
                  <span className="text-[8px] uppercase opacity-50 font-bold">{t('pricing.stickers.quantity')}</span>
                  <input type="number" value={stickerCount} onChange={(e) => setStickerCount(parseInt(e.target.value) || 0)} onBlur={validateStickers} className="bg-transparent text-xl font-black w-20 text-center focus:outline-none" />
                </div>
                <div className="text-right border-l border-white/10 pl-4">
                  <div className="text-md font-black">{(stickerCount * 0.33).toFixed(2)} MDL</div>
                  <div className="text-[8px] uppercase opacity-50">{t('pricing.stickers.cost_production')}</div>
                </div>
                <button type="button" onClick={() => setIsStickersAdded(!isStickersAdded)} className={`p-3 rounded-lg ${isStickersAdded ? 'bg-red-500' : 'bg-blue-500'}`}>
                  {isStickersAdded ? <Trash2 size={18} /> : <Plus size={18} />}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-stretch mb-16">
              <article className={`p-12 rounded-[4rem] border-[4px] bg-white ${isStartPlan ? 'border-blue-600 shadow-2xl scale-[1.02]' : 'border-slate-100 opacity-60'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Zap size={32} /></div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">{t('pricing.plans.license_monthly')}</p>
                    <p className="text-4xl font-black text-slate-950">650 MDL</p>
                  </div>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-widest mb-6 text-blue-600 italic">{t('pricing.plans.start_name')}</h3>
                <ul className="space-y-4 mb-12 text-slate-700 font-black uppercase text-xs">
                  <li className="flex items-center gap-3"><Check className="text-blue-600" size={18}/> {t('pricing.plans.start_feat_1')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-600" size={18}/> {t('pricing.plans.start_feat_2')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-600" size={18}/> {t('pricing.plans.start_feat_3')}</li>
                </ul>
                <Link href={isLoggedIn ? { pathname: '/dashboard', query: { setup: 'start', locs: '1', stickers: isStickersAdded ? stickerCount.toString() : '0' } } : '/auth/register'} className="block w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] text-center shadow-lg hover:bg-slate-950 transition-all">
                  {isLoggedIn ? t('pricing.plans.btn_activate_dashboard') : t('pricing.btn_register')}
                </Link>
              </article>

              <article className={`p-12 rounded-[4rem] border-[4px] bg-slate-950 text-white ${isProPlan ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-transparent opacity-60'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400"><ShieldCheck size={32} /></div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase">{t('pricing.plans.license_monthly')}</p>
                    <p className="text-4xl font-black text-blue-400">{isProPlan ? `${locs * proBaseCostPerLocation} MDL` : `600 MDL`}</p>
                  </div>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-widest mb-6 text-blue-400 italic">{t('pricing.plans.pro_name')}</h3>
                <ul className="space-y-4 mb-12 text-slate-300 font-black uppercase text-xs">
                  <li className="flex items-center gap-3"><Check className="text-blue-400" size={18}/> {t('pricing.plans.pro_feat_1')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-400" size={18}/> {t('pricing.plans.pro_feat_2')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-400" size={18}/> {t('pricing.plans.pro_feat_3')}</li>
                </ul>
                <Link href={isLoggedIn ? { pathname: '/dashboard', query: { setup: 'pro', locs: locs.toString(), stickers: isStickersAdded ? stickerCount.toString() : '0' } } : '/auth/register'} className="block w-full bg-white text-slate-950 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] text-center hover:bg-blue-600 hover:text-white transition-all">
                  {isLoggedIn ? t('pricing.plans.btn_activate_dashboard') : t('pricing.btn_choose')}
                </Link>
              </article>
            </div>

            <div className="max-w-md mx-auto bg-slate-900 border-b-4 border-blue-600 rounded-[2rem] p-6 text-white text-center shadow-2xl">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">{t('pricing.total.estimated_total')}</span>
              <h3 className="text-4xl font-black text-white mt-1">{grandTotal.toFixed(2)} MDL</h3>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-2 rounded-xl"><Zap className="text-white fill-white" size={18} /></div>
                <span className="text-xl font-black uppercase italic">QRate<span className="text-blue-600">.MD</span></span>
              </div>
            </div>
          </div>
          <div className="text-center pt-16 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">© 2026 QRate Moldova • {t('footer.rights')}</p>
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <aside className="fixed bottom-6 left-6 right-6 md:max-w-md bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-800 z-50">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600/20 p-2.5 rounded-xl text-blue-400"><Cookie size={20} /></div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">{t('cookies.title')}</h3>
              <p className="text-slate-400 text-xs mt-2">{t('cookies.description')}</p>
              <button type="button" onClick={handleAcceptCookies} className="mt-4 bg-blue-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">{t('cookies.btn_accept')}</button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}