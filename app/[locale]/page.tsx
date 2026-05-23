"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Check, Zap, Mail, Globe, Cookie, Sliders, Building, QrCode } from 'lucide-react';

interface PricingPageProps {
  locale?: string;
  isLoggedIn?: boolean;
}

export default function PricingPage({ locale = 'ro', isLoggedIn = false }: PricingPageProps) {
  // --- STĂRI (STATES) ---
  const [locs, setLocs] = useState<number>(1);
  const [isProPlan, setIsProPlan] = useState<boolean>(true);
  const [isStickersAdded, setIsStickersAdded] = useState<boolean>(false);
  const [stickerCount, setStickerCount] = useState<number>(50);
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(true);

  // --- CONSTANTE ȘI LOGICĂ DE CALCUL ---
  const proBaseCostPerLocation = 500; // Cost per locație pentru planul Pro (MDL)
  const baseFixedCost = 600;          // Cost fix pentru planul Base (MDL)
  const costPerSticker = 12;          // Cost per sticker Smart QR (MDL)

  const currentSoftwareTotal = isProPlan ? locs * proBaseCostPerLocation : baseFixedCost;
  const stickerTotal = isStickersAdded ? stickerCount * costPerSticker : 0;
  const grandTotal = currentSoftwareTotal + stickerTotal;

  // --- DICȚIONAR INTERN PENTRU TRADUCERI (FALLBACK NEXT-INTL) ---
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'pricing.title': 'Alege Planul Perfect',
      'pricing.subtitle': 'Prețuri transparente, adaptate în funcție de numărul de locații fizice și obiectivele tale de business.',
      'pricing.config.locations': 'Număr Locații:',
      'pricing.config.stickers_toggle': 'Adaugă Stickere Smart QR fizice',
      'pricing.config.stickers_count': 'Cantitate Stickere:',
      'pricing.plans.license_monthly': 'Licență Lunarã',
      'pricing.plans.one_location': 'Locație',
      'pricing.plans.more_locations': 'Locații',
      'pricing.plans.base_name': 'Planul Base',
      'pricing.plans.pro_name': 'Planul Pro',
      'pricing.plans.btn_activate_dashboard': 'Activează în Dashboard',
      'pricing.btn_choose': 'Alege Planul',
      'pricing.total.estimated_total': 'Total Estimativ',
      'pricing.total.breakdown_part1': 'Abonament (',
      'pricing.total.breakdown_part2': 'Stickere (',
      'pricing.total.only_software': 'Include doar licența software (fără livrabile fizice)',
      'pricing.plans.base_feat_1': 'Management de bază al recenziilor',
      'pricing.plans.base_feat_2': '1 Cod QR digital generat',
      'pricing.plans.base_feat_3': 'Rapoarte lunare simple',
      'pricing.plans.pro_feat_1': 'Sincronizare Google Maps în timp real',
      'pricing.plans.pro_feat_2': 'Analiză de Sentiment AI & Auto-Tagging',
      'pricing.plans.pro_feat_3': 'Modul avansat de urmărire angajați',
      'pricing.plans.pro_feat_4': 'Reputation Multiplier activat',
      'pricing.plans.pro_feat_5': 'Suport Prioritar 24/7 dedicat',
      'pricing.plans.pro_feat_6': 'Sistem antifraudă recenzii false',
      'footer.company_name': 'QRate Tech S.R.L.',
      'footer.location': 'Chișinău, Republica Moldova',
      'footer.docs_title': 'Legal',
      'footer.terms': 'Termeni și Condiții',
      'footer.privacy': 'Politică de Confidențialitate',
      'footer.refund_policy': 'Politică de Retur',
      'footer.support_title': 'Suport',
      'footer.payments_title': 'Plăți Securizate',
      'footer.rights': 'Toate drepturile rezervate.',
      'cookies.title': 'Politică de Cookie-uri',
      'cookies.description': 'Utilizăm cookie-uri pentru a optimiza experiența ta pe platforma QRate.md.',
      'cookies.btn_accept': 'Acceptă'
    };
    return translations[key] || key;
  };

  // --- GESTIONARE COOKIES ---
  const handleAcceptCookies = () => {
    setShowCookieBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', 'true');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('cookieConsent') === 'true') {
      setShowCookieBanner(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <main className="relative z-10">
        
        {/* ================= HERO SECTION ================= */}
        <section className="pt-24 pb-12 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 uppercase tracking-tight mb-6 italic">
            QRate<span className="text-blue-600">.MD</span> Pricing
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-bold max-w-2xl mx-auto uppercase tracking-wide leading-relaxed">
            {t('pricing.subtitle')}
          </p>
        </section>

        {/* ================= CONTROALE INTERACTIVE ================= */}
        <section className="max-w-3xl mx-auto px-6 mb-16 space-y-8">
          <div className="bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Control Slider Locații */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                <Building size={16} className="text-blue-600" />
                {t('pricing.config.locations')} <span className="text-slate-950 text-sm font-black">{locs}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={locs} 
                onChange={(e) => setLocs(parseInt(e.target.value))}
                className="w-full accent-blue-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span>1 Locație</span>
                <span>20 Locații</span>
              </div>
            </div>

            {/* Control Stickere Smart QR */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest cursor-pointer">
                  <QrCode size={16} className="text-blue-600" />
                  {t('pricing.config.stickers_toggle')}
                </label>
                <input 
                  type="checkbox" 
                  checked={isStickersAdded} 
                  onChange={(e) => setIsStickersAdded(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer rounded border-slate-300"
                />
              </div>

              {isStickersAdded && (
                <div className="pt-2 border-t border-slate-200/60 transition-all">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {t('pricing.config.stickers_count')} <span className="text-blue-600 font-black">{stickerCount} buc.</span>
                  </label>
                  <input 
                    type="range" 
                    min="10" 
                    max="500" 
                    step="10"
                    value={stickerCount} 
                    onChange={(e) => setStickerCount(parseInt(e.target.value))}
                    className="w-full accent-blue-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Toggler Rapid Plan Focalizat */}
          <div className="flex justify-center gap-4">
            <button 
              type="button"
              onClick={() => setIsProPlan(false)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${!isProPlan ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            >
              {t('pricing.plans.base_name')}
            </button>
            <button 
              type="button"
              onClick={() => setIsProPlan(true)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${isProPlan ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            >
              {t('pricing.plans.pro_name')}
            </button>
          </div>
        </section>

        {/* ================= CARDURI DE PREȚURI ================= */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-16">
            
            {/* CARD 1: PLANUL BASE */}
            <article className={`p-12 rounded-[4rem] border-[4px] transition-all duration-500 bg-white text-slate-950 relative flex flex-col justify-between ${!isProPlan ? 'border-blue-600 shadow-2xl scale-[1.02] z-10 opacity-100' : 'border-transparent opacity-60'}`}>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Sliders size={32} /></div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{t('pricing.plans.license_monthly')}</p>
                    <p className="text-4xl font-black text-slate-950">600 MDL</p>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                      1 {t('pricing.plans.one_location')}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-3xl font-black uppercase tracking-widest mb-6 text-slate-900 italic">
                  {t('pricing.plans.base_name')}
                </h3>

                <ul className="space-y-4 mb-12 text-slate-600 text-xs font-black uppercase tracking-wider">
                  <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.base_feat_1')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.base_feat_2')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-600 shrink-0" size={18}/> {t('pricing.plans.base_feat_3')}</li>
                </ul>
              </div>
              
              <Link 
                href={
                  isLoggedIn 
                    ? { pathname: '/dashboard', query: { setup: 'base', locs: '1', stickers: isStickersAdded ? stickerCount.toString() : '0' } } 
                    : '/auth/register'
                }
                className="block w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all text-center"
              >
                {isLoggedIn ? t('pricing.plans.btn_activate_dashboard') : t('pricing.btn_choose')}
              </Link>
            </article>

            {/* CARD 2: PLANUL PRO */}
            <article className={`p-12 rounded-[4rem] border-[4px] transition-all duration-500 bg-slate-950 text-white relative flex flex-col justify-between ${isProPlan ? 'border-blue-500 shadow-2xl scale-[1.02] z-10 opacity-100' : 'border-transparent opacity-60'}`}>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400"><ShieldCheck size={32} /></div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase">{t('pricing.plans.license_monthly')}</p>
                    <p className="text-4xl font-black text-blue-400">
                      {locs * proBaseCostPerLocation} MDL
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                      {locs} {locs === 1 ? t('pricing.plans.one_location') : t('pricing.plans.more_locations')}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-3xl font-black uppercase tracking-widest mb-6 text-blue-400 italic">
                  {t('pricing.plans.pro_name')}
                </h3>

                <ul className="space-y-4 mb-12 text-slate-300 text-xs font-black uppercase tracking-wider">
                  <li className="flex items-center gap-3 text-blue-400 italic"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_1')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_2')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_3')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_4')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_5')}</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-400 shrink-0" size={18}/> {t('pricing.plans.pro_feat_6')}</li>
                </ul>
              </div>
              
              <Link 
                href={
                  isLoggedIn 
                    ? {
                        pathname: '/dashboard',
                        query: {
                          setup: 'pro',
                          locs: locs.toString(),
                          stickers: isStickersAdded ? stickerCount.toString() : '0'
                        }
                      }
                    : '/auth/register'
                } 
                className="block w-full bg-white text-slate-950 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] hover:bg-blue-600 hover:text-white transition-all text-center"
              >
                {isLoggedIn ? t('pricing.plans.btn_activate_dashboard') : t('pricing.btn_choose')}
              </Link>
            </article>
          </div>

          {/* CASĂ TOTAL ESTIMATIV */}
          <div className="max-w-md mx-auto bg-slate-900 border-b-4 border-blue-600 rounded-[2rem] p-6 text-white text-center shadow-2xl">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">{t('pricing.total.estimated_total')}</span>
            <h3 className="text-4xl font-black text-white mt-1">{grandTotal.toFixed(2)} MDL</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-2 italic">
              {isStickersAdded 
                ? `${t('pricing.total.breakdown_part1')}${currentSoftwareTotal} MDL + ${t('pricing.total.breakdown_part2')}${stickerTotal} MDL)` 
                : t('pricing.total.only_software')}
            </p>
          </div>
        </section>
      </main>

      {/* ================= FOOTER COMPANIAL & LEGAL ================= */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-2 rounded-xl"><Zap className="text-white fill-white" size={18} /></div>
                <span className="text-xl font-black uppercase tracking-tighter italic">QRate<span className="text-blue-600">.MD</span></span>
              </div>
              <address className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed italic not-italic">
                {t('footer.company_name')} <br />{t('footer.location')}
              </address>
            </div>

            <div className="space-y-8">
              <h4 className="font-black uppercase text-[11px] tracking-[0.3em] text-slate-950">{t('footer.docs_title')}</h4>
              <nav aria-label="Documente Legale">
                <ul className="space-y-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <li>
                    <a href={`/${locale}/legal/terms`} className="hover:text-blue-600 transition-colors">
                      {t('footer.terms')}
                    </a>
                  </li>
                  <li>
                    <a href={`/${locale}/legal/privacy`} className="hover:text-blue-600 transition-colors">
                      {t('footer.privacy')}
                    </a>
                  </li>
                  <li>
                    <a href={`/${locale}/legal/refund`} className="hover:text-blue-600 transition-colors">
                      {t('footer.refund_policy')}
                    </a>
                  </li>
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

      {/* ================= BANNER CONSIMȚĂMÂNT COOKIE-URI ================= */}
      {showCookieBanner && (
        <aside role="dialog" aria-live="polite" className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-slate-900 text-white p-6 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.25)] border border-slate-800 z-50">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600/20 p-2.5 rounded-xl text-blue-400 mt-1 shrink-0"><Cookie size={20} /></div>
            <div className="text-left w-full">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">{t('cookies.title')}</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">{t('cookies.description')}</p>
              <div className="mt-4 flex justify-end">
                <button 
                  type="button" 
                  onClick={handleAcceptCookies} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  {t('cookies.btn_accept')}
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

    </div>
  );
}