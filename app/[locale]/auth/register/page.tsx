'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Zap, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';

// Importăm dicționarele de traduceri
import roTranslations from '@/messages/ro.json';
import ruTranslations from '@/messages/ru.json';

export default function Register() {
  const pathname = usePathname();
  const router = useRouter();
  
  const lang = pathname?.startsWith('/ru') ? 'ru' : 'ro';
  const t = lang === 'ru' ? ruTranslations : roTranslations;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);

  const localTexts = {
    ro: {
      admin_email_label: 'Email Administrator',
      free_trial_subtitle: 'Acces instant • Cont de utilizator gratuit',
      submit_btn: 'Creează contul',
      terms_pre_link: 'Sunt de acord cu ',
      terms_link_text: 'Termenii și Condițiile',
      terms_post_link: ' QRate.md. *',
      privacy_pre_link: 'Am luat la cunoștință ',
      privacy_link_text: 'Politica de Confidențialitate',
      privacy_post_link: '. *',
      gdpr_error: 'Te rugăm să accepți atât Termenii cât și Politica de Confidențialitate.',
    },
    ru: {
      admin_email_label: 'Email Администратора',
      free_trial_subtitle: 'Мгновенный доступ • Бесплатный аккаунт',
      submit_btn: 'Создать аккаунт',
      terms_pre_link: 'Я согласен с ',
      terms_link_text: 'Условиями использования',
      terms_post_link: ' QRate.md. *',
      privacy_pre_link: 'Я ознакомлен с ',
      privacy_link_text: 'Политикой конфиденциальности',
      privacy_post_link: '. *',
      gdpr_error: 'Пожалуйста, примите Условия использования и Политику конфиденциальности.',
    }
  };

  const currentLocal = localTexts[lang];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!acceptedTerms || !acceptedPrivacy) {
      setError(currentLocal.gdpr_error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { marketing_consent: acceptedMarketing },
          emailRedirectTo: `${window.location.origin}/${lang}/dashboard`
        }
      });

      if (authError) throw authError;

      router.push(`/${lang}/dashboard`);
    } catch (err: any) {
      console.error("EROARE SUPABASE:", err);
      setError(err.message || 'Eroare la înregistrare. Verifică consola (F12).');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-md w-full">
        <div className="flex justify-center mb-10">
          <Link href={`/${lang}`} className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-8 py-3 flex items-center gap-2 border border-blue-400/30 shadow-xl shadow-blue-200">
              <Zap className="text-white fill-white" size={18} />
              <span className="text-white font-black tracking-tighter text-2xl italic">QRate<span className="not-italic opacity-70">.md</span></span>
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl shadow-emerald-100/50 p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t.Auth.register_title}</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">
              {currentLocal.free_trial_subtitle}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
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

            <div className="space-y-3 pt-4 border-t border-slate-100">
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
                  <Link href={`/${lang}/legal/terms`} className="text-blue-600 hover:underline">{currentLocal.terms_link_text}</Link>
                  {currentLocal.terms_post_link}
                </label>
              </div>

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
                  <Link href={`/${lang}/legal/privacy`} className="text-blue-600 hover:underline">{currentLocal.privacy_link_text}</Link>
                  {currentLocal.privacy_post_link}
                </label>
              </div>
            </div>

            {error && <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center border border-red-100">{error}</p>}

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

          <div className="text-center mt-10">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {t.Auth.has_account}{' '}
              <Link href={`/${lang}/auth/login`} className="text-blue-600 hover:underline">{t.Auth.login_link}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}