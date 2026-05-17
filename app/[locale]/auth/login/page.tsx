'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
// Înlocuim clientul vechi cu cel dedicat pentru SSR (Next.js App Router)
import { createBrowserClient } from '@supabase/ssr';
import { Zap, Mail, Lock, ArrowRight, Loader2, Cookie } from 'lucide-react';
// Folosim routing-ul personalizat pentru a păstra limba automat în URL
import { Link, useRouter } from '@/i18n/routing'; 

export default function Login() {
  // 1. Hook-urile de bază
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('Auth');

  // 2. State-urile aplicației
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // State pentru afișarea bannerului de Cookie-uri GDPR
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // 3. Variabile derivate
  const locale = params?.locale || 'ro';

  // Inițializăm clientul SSR de browser direct aici
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Verificăm dacă utilizatorul a acceptat deja politica de cookie-uri din trecut
  useEffect(() => {
    const consent = localStorage.getItem('qrate_cookie_consent');
    if (!consent) {
      setShowCookieBanner(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('qrate_cookie_consent', 'accepted');
    setShowCookieBanner(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // createBrowserClient scrie automat și în LocalStorage ȘI în Cookie-uri acum!
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t('errors.invalid_credentials'));
      setLoading(false);
    } else {
      // useRouter din '@/i18n/routing' știe singur să meargă la /[locale]/dashboard
      router.push('/dashboard');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError(t('errors.email_required'));
      return;
    }
    
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/update-password`,
    });

    if (resetError) {
      setError(t('errors.reset_failed'));
    } else {
      setMessage(t('messages.reset_sent'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decor fundal */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full">
        <div className="flex justify-center mb-10">
          <Link href="/" className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-8 py-3 flex items-center gap-2 border border-blue-400/30 shadow-xl shadow-blue-200">
              <Zap className="text-white fill-white" size={18} />
              <span className="text-white font-black tracking-tighter text-2xl italic">
                QRate<span className="not-italic opacity-70">.md</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-10">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {t('login_title')}
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
              {t('login_subtitle')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                {t('labels.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-900"
                  placeholder={t('placeholders.email')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                {t('labels.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end px-2">
              <button 
                type="button"
                onClick={handleResetPassword}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                {t('forgot_password')}
              </button>
            </div>

            {error && (
              <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center border border-red-100">
                {error}
              </p>
            )}
            {message && (
              <p className="bg-emerald-50 text-emerald-600 text-[11px] font-bold p-4 rounded-xl text-center border border-emerald-100">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F172A] hover:bg-blue-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {t('submit_button')}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-10">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {t('no_account')}{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                {t('register_link')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* --- COOKIE CONSENT BANNER (GDPR) --- */}
      {showCookieBanner && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-800 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600/20 p-2.5 rounded-xl text-indigo-400 mt-1 shrink-0">
              <Cookie size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Politica de Cookie-uri
              </h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
                QRate.md folosește cookie-uri tehnice esențiale pentru a-ți menține sesiunea securizată și pentru a permite funcționarea corectă a panoului de administrare.
              </p>
              <div className="mt-4 flex items-center gap-3 justify-end">
                <button 
                  onClick={handleAcceptCookies}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  Acceptă
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}