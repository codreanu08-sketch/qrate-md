'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { Zap, Mail, Lock, ArrowRight, Loader2, Cookie } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing'; 

export default function Login() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('Auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  const locale = params?.locale || 'ro';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const consent = localStorage.getItem('qrate_cookie_consent');
    if (!consent) setShowCookieBanner(true);
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t('errors.invalid_credentials'));
      setLoading(false);
    } else {
      router.push('/dashboard' as any);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError(t('errors.email_required'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    // REDIRECTUL CRITIC: Asigură-te că ruta aceasta există în proiectul tău
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
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full">
        <div className="flex justify-center mb-10">
          <Link href="/" className="relative group cursor-pointer">
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-8 py-3 flex items-center gap-2 border border-blue-400/30 shadow-xl shadow-blue-200">
              <Zap className="text-white fill-white" size={18} />
              <span className="text-white font-black tracking-tighter text-2xl italic">QRate<span className="not-italic opacity-70">.md</span></span>
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-10">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('login_title')}</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">{t('login_subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">{t('labels.email')}</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-900"
                  placeholder={t('placeholders.email')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">{t('labels.password')}</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end px-2">
              <button type="button" onClick={handleResetPassword} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                {t('forgot_password')}
              </button>
            </div>

            {error && <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center border border-red-100">{error}</p>}
            {message && <p className="bg-emerald-50 text-emerald-600 text-[11px] font-bold p-4 rounded-xl text-center border border-emerald-100">{message}</p>}

            <button type="submit" disabled={loading} className="w-full bg-[#0F172A] hover:bg-blue-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t('submit_button')} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="text-center mt-10">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {t('no_account')}{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline">{t('register_link')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}