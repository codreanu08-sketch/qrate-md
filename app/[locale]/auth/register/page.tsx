'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Zap, Mail, Lock, Loader2, ArrowRight, User, Phone } from 'lucide-react';
import Link from 'next/link';

import roTranslations from '@/messages/ro.json';
import ruTranslations from '@/messages/ru.json';
import { registerWithConfirmation } from '@/app/actions/auth-actions';

export default function Register() {
  const pathname = usePathname();

  const lang = pathname?.startsWith('/ru') ? 'ru' : 'ro';
  const t = lang === 'ru' ? ruTranslations : roTranslations;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const txt = {
    ro: {
      title: 'Creează cont',
      subtitle: '7 zile gratuit · Fără card bancar',
      label_first: 'Prenume',
      label_last: 'Nume',
      label_phone: 'Telefon',
      label_email: 'Email',
      label_pass: 'Parolă',
      ph_first: 'Ion',
      ph_last: 'Ivanov',
      ph_phone: '068 000 000',
      submit: 'Creează contul',
      terms_pre: 'Sunt de acord cu ',
      terms_link: 'Termenii și Condițiile',
      terms_post: ' QRate.md *',
      privacy_pre: 'Am luat la cunoștință ',
      privacy_link: 'Politica de Confidențialitate',
      privacy_post: ' *',
      gdpr_err: 'Acceptă Termenii și Politica de Confidențialitate.',
      check_email: 'Verifică emailul',
      check_sub: 'Am trimis un link de activare la',
      check_desc: 'Apasă pe link pentru a-ți activa contul. Verifică și folderul Spam.',
      to_login: 'Mergi la Login',
    },
    ru: {
      title: 'Создать аккаунт',
      subtitle: '7 дней бесплатно · Без банковской карты',
      label_first: 'Имя',
      label_last: 'Фамилия',
      label_phone: 'Телефон',
      label_email: 'Email',
      label_pass: 'Пароль',
      ph_first: 'Иван',
      ph_last: 'Иванов',
      ph_phone: '068 000 000',
      submit: 'Создать аккаунт',
      terms_pre: 'Я согласен с ',
      terms_link: 'Условиями использования',
      terms_post: ' QRate.md *',
      privacy_pre: 'Я ознакомлен с ',
      privacy_link: 'Политикой конфиденциальности',
      privacy_post: ' *',
      gdpr_err: 'Примите Условия использования и Политику конфиденциальности.',
      check_email: 'Проверьте email',
      check_sub: 'Мы отправили ссылку активации на',
      check_desc: 'Нажмите на ссылку для активации аккаунта. Проверьте также папку Спам.',
      to_login: 'Войти',
    },
  };

  const c = txt[lang];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!acceptedTerms || !acceptedPrivacy) {
      setError(c.gdpr_err);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await registerWithConfirmation(email, password, lang, false, fullName, phone);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || (lang === 'ru' ? 'Ошибка. Попробуйте еще раз.' : 'Eroare. Încearcă din nou.'));
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
        <div className="flex justify-center mb-8">
          <Link href={`/${lang}`}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-8 py-3 flex items-center gap-2 border border-blue-400/30 shadow-xl shadow-blue-200">
              <Zap className="text-white fill-white" size={18} />
              <span className="text-white font-black tracking-tighter text-2xl italic">QRate<span className="not-italic opacity-70">.md</span></span>
            </div>
          </Link>
        </div>

        {emailSent ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="text-emerald-600" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">{c.check_email}</h2>
            <p className="text-slate-500 text-sm mb-1">{c.check_sub}</p>
            <p className="font-black text-slate-900 text-sm mb-5">{email}</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">{c.check_desc}</p>
            <Link href={`/${lang}/auth/login`} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
              {c.to_login}
            </Link>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{c.title}</h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">{c.subtitle}</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">

              {/* Nume + Prenume */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{c.label_first}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                      placeholder={c.ph_first} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{c.label_last}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                      placeholder={c.ph_last} required />
                  </div>
                </div>
              </div>

              {/* Telefon */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{c.label_phone}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                    placeholder={c.ph_phone} required />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{c.label_email}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                    placeholder={t.Auth.placeholders.email} required />
                </div>
              </div>

              {/* Parolă */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{c.label_pass}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-sm text-slate-800"
                    placeholder="••••••••" required minLength={6} />
                </div>
              </div>

              {/* Checkbox-uri */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="terms" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="h-4 w-4 mt-0.5 cursor-pointer" required />
                  <label htmlFor="terms" className="text-[11px] font-bold text-slate-500 cursor-pointer leading-relaxed">
                    {c.terms_pre}<Link href={`/${lang}/legal/terms`} className="text-blue-600 hover:underline">{c.terms_link}</Link>{c.terms_post}
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="privacy" checked={acceptedPrivacy} onChange={e => setAcceptedPrivacy(e.target.checked)} className="h-4 w-4 mt-0.5 cursor-pointer" required />
                  <label htmlFor="privacy" className="text-[11px] font-bold text-slate-500 cursor-pointer leading-relaxed">
                    {c.privacy_pre}<Link href={`/${lang}/legal/privacy`} className="text-blue-600 hover:underline">{c.privacy_link}</Link>{c.privacy_post}
                  </label>
                </div>
              </div>

              {error && <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center border border-red-100">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>{c.submit} <ArrowRight size={16} /></>}
              </button>

              <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-widest pt-1">
                {t.Auth.has_account}{' '}
                <Link href={`/${lang}/auth/login`} className="text-blue-600 hover:underline">{t.Auth.login_link}</Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
