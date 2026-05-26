'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Zap, Building2, Mail, Lock, Loader2, ArrowRight, Store, Utensils, Scissors, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';

// Importăm dicționarele de traduceri folosind alias-ul din root/messages
import roTranslations from '@/messages/ro.json';
import ruTranslations from '@/messages/ru.json';

export default function Register() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Detectăm limba curentă din URL (implicit 'ro')
  const lang = pathname?.startsWith('/ru') ? 'ru' : 'ro';
  const t = lang === 'ru' ? ruTranslations : roTranslations;

  // State-uri formular
  const [companyName, setCompanyName] = useState('');
  const [type, setType] = useState<'restaurant' | 'retailer' | 'service'>('restaurant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State-uri consimțământ (GDPR / Normative maib)
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);

  // Traduceri locale adiționale optimizate pentru select-uri și structura politicii de date
  const localTexts = {
    ro: {
      industry_label: 'Industrie',
      brand_placeholder: 'Ex: Andy\'s Pizza',
      admin_email_label: 'Email Administrator',
      free_trial_subtitle: 'Acces instant • 7 zile demo inclus',
      submit_btn: 'Lansează contul gratuit',
      terms_pre_link: 'Sunt de acord cu ',
      terms_link_text: 'Termenii și Condițiile',
      terms_post_link: ' QRate.md. *',
      privacy_pre_link: 'Am luat la cunoștință ',
      privacy_link_text: 'Politica de Confidențialitate',
      privacy_post_link: '. *',
      marketing_text: 'Vreau să primesc analize și noutăți (Opțional).',
      gdpr_error: 'Te rugăm să accepți atât Termenii cât și Politica de Confidențialitate.',
      industries: {
        restaurant: 'HORECA',
        retailer: 'Retail / Magazin',
        service: 'Servicii / Beauty'
      }
    },
    ru: {
      industry_label: 'Индустрия',
      brand_placeholder: 'Пример: Andy\'s Pizza',
      admin_email_label: 'Email Администратора',
      free_trial_subtitle: 'Мгновенный доступ • 7 дней демо включено',
      submit_btn: 'Запустить бесплатный аккаунт',
      terms_pre_link: 'Я согласен с ',
      terms_link_text: 'Условиями использования',
      terms_post_link: ' QRate.md. *',
      privacy_pre_link: 'Я ознакомлен с ',
      privacy_link_text: 'Политикой конфиденциальности',
      privacy_post_link: '. *',
      marketing_text: 'Я хочу получать аналитику и новости (Опционально).',
      gdpr_error: 'Пожалуйста, примите Условия использования и Политику конфиденциальности.',
      industries: {
        restaurant: 'HORECA',
        retailer: 'Ритейл / Магазин',
        service: 'Услуги / Салоны красоты'
      }
    }
  };

  const currentLocal = localTexts[lang];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms || !acceptedPrivacy) {
      setError(currentLocal.gdpr_error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      -- 1. Creăm MAI ÎNTÂI utilizatorul în Supabase Auth în mod controlat
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
            marketing_consent: acceptedMarketing,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error(t.Auth.errors.register_failed);

      -- Generare slug curat și valid din numele companiei
      const slug = companyName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      -- 2. ACUM inserăm compania, fiind 100% siguri că userul există și nu încălcăm nicio cheie străină
      const { error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          slug: slug,
          type: type,
          owner_id: authData.user.id,
        });

      if (companyError) throw companyError;

      -- Redirecționare dinamică bazată pe limba din sesiune
      router.push(`/${lang}/dashboard`);
    } catch (err: any) {
      setError(err.message || t.Auth.errors.register_failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decor Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-xl w-full">
        {/* Logo Brand dinamic */}
        <div className="flex justify-center mb-10">
          <Link href={`/${lang}`} className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-8 py-3 flex items-center gap-2 border border-blue-400/30 shadow-xl shadow-blue-200">
              <Zap className="text-white fill-white" size={18} />
              <span className="text-white font-black tracking-tighter text-2xl italic">QRate<span className="not-italic opacity-70">.md</span></span>
            </div>
          </Link>
        </div>

        {/* Cardul de Înregistrare */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl shadow-emerald-100/50 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t.Auth.register_title}</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">
              {currentLocal.free_trial_subtitle}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Nume Companie */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                  {t.Auth.labels.company_name}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                    placeholder={currentLocal.brand_placeholder}
                    required
                  />
                </div>
              </div>

              {/* Select Industrie */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                  {currentLocal.industry_label}
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    {type === 'restaurant' && <Utensils size={18} />}
                    {type === 'retailer' && <Store size={18} />}
                    {type === 'service' && <Scissors size={18} />}
                  </div>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 appearance-none font-bold text-slate-700 cursor-pointer transition-all text-sm"
                  >
                    <option value="restaurant">{currentLocal.industries.restaurant}</option>
                    <option value="retailer">{currentLocal.industries.retailer}</option>
                    <option value="service">{currentLocal.industries.service}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email Admin */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {currentLocal.admin_email_label}
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                  placeholder={t.Auth.placeholders.email}
                  required
                />
              </div>
            </div>

            {/* Parolă */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {t.Auth.labels.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                  placeholder={t.Auth.placeholders.password}
                  required
                />
              </div>
            </div>

            {/* SECȚIUNE CONSIMȚĂMÂNT GDPR COMPLIANT */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              {/* Bifa 1: Termeni și Condiții */}
              <div className="flex items-start gap-4">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus:outline-none"
                    required
                  />
                  <Check className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                </div>
                <label htmlFor="terms" className="text-[11px] font-bold text-slate-500 leading-snug cursor-pointer select-none">
                  {currentLocal.terms_pre_link}
                  <Link href={`/${lang}/legal/terms`} className="text-blue-600 hover:underline">
                    {currentLocal.terms_link_text}
                  </Link>
                  {currentLocal.terms_post_link}
                </label>
              </div>

              {/* Bifa 2: Politica de Confidențialitate */}
              <div className="flex items-start gap-4">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus:outline-none"
                    required
                  />
                  <ShieldCheck className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                </div>
                <label htmlFor="privacy" className="text-[11px] font-bold text-slate-500 leading-snug cursor-pointer select-none">
                  {currentLocal.privacy_pre_link}
                  <Link href={`/${lang}/legal/privacy`} className="text-blue-600 hover:underline">
                    {currentLocal.privacy_link_text}
                  </Link>
                  {currentLocal.privacy_post_link}
                </label>
              </div>

              {/* Bifa 3: Marketing */}
              <div className="flex items-start gap-4 opacity-70">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={acceptedMarketing}
                    onChange={(e) => setAcceptedMarketing(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 bg-white transition-all checked:border-emerald-500 checked:bg-emerald-500 focus:outline-none"
                  />
                  <Check className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                </div>
                <label htmlFor="marketing" className="text-[11px] font-medium text-slate-400 leading-snug cursor-pointer select-none">
                  {currentLocal.marketing_text}
                </label>
              </div>
            </div>

            {/* Afișare Erori */}
            {error && <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center border border-red-100">{error}</p>}

            {/* Buton Submit */}
            <button
              type="submit"
              disabled={loading || !acceptedTerms || !acceptedPrivacy}
              className={`w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                loading || !acceptedTerms || !acceptedPrivacy
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 active:scale-95'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {currentLocal.submit_btn}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Link către Login */}
          <div className="text-center mt-10">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {t.Auth.has_account}{' '}
              <Link href={`/${lang}/auth/login`} className="text-blue-600 hover:underline">
                {t.Auth.login_link}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}