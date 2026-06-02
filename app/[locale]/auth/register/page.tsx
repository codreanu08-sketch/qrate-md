'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Zap, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import roTranslations from '@/messages/ro.json';
import ruTranslations from '@/messages/ru.json';
import { sendWelcomeEmail } from '@/app/actions/auth-actions';

export default function Register() {
  const pathname = usePathname();

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
      // 1. Creare cont
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { marketing_consent: acceptedMarketing } },
      });

      if (authError) throw authError;

      // 2. Login automat (funcționează când "Enable email confirmations" e dezactivat în Supabase)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // 3. Trimite email de bun venit via Resend (non-blocking)
      sendWelcomeEmail(email, lang).catch(() => {});

      // 4. Redirect dashboard
      window.location.href = `/${lang}/dashboard`;
    } catch (err: any) {
      console.error('EROARE REGISTER:', err);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError(lang === 'ru' ? 'Этот email уже зарегистрирован.' : 'Acest email este deja înregistrat.');
      } else if (msg.includes('password')) {
        setError(lang === 'ru' ? 'Parola trebuie să aibă cel puțin 6 caractere.' : 'Parola trebuie să aibă cel puțin 6 caractere.');
      } else {
        setError(lang === 'ru' ? 'Ошибка регистрации. Попробуйте еще раз.' : 'Eroare la înregistrare. Încearcă din nou.');
      }
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
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-8 py-3 flex items-center gap-2 border border-blue-400/30 shadow-xl shadow-blue-200">
              <Zap className="text-white fill-white" size={18} />
              <span className="text-white font-black tracking-tighter text-2xl italic">QRate<span className="not-italic opacity-70">.md</span></span>
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl shadow-emerald-100/50 p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t.Auth.register_title}</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">{currentLocal.free_trial_subtitle}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{currentLocal.admin_email_label}</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800" placeholder={t.Auth.placeholders.email} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t.Auth.labels.password}</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800" placeholder={t.Auth.placeholders.password} required />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-4">
                <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="h-5 w-5 mt-0.5 cursor-pointer" required />
                <label htmlFor="terms" className="text-[11px] font-bold text-slate-500 cursor-pointer">{currentLocal.terms_pre_link}<Link href={`/${lang}/legal/terms`} className="text-blue-600 hover:underline">{currentLocal.terms_link_text}</Link>{currentLocal.terms_post_link}</label>
              </div>
              <div className="flex items-start gap-4">
                <input type="checkbox" id="privacy" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="h-5 w-5 mt-0.5 cursor-pointer" required />
                <label htmlFor="privacy" className="text-[11px] font-bold text-slate-500 cursor-pointer">{currentLocal.privacy_pre_link}<Link href={`/${lang}/legal/privacy`} className="text-blue-600 hover:underline">{currentLocal.privacy_link_text}</Link>{currentLocal.privacy_post_link}</label>
              </div>
            </div>

            {error && <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center border border-red-100">{error}</p>}

            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>{currentLocal.submit_btn} <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}