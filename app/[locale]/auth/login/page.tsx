'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing'; 
import { sendCustomResetEmail } from '@/app/actions/auth-actions';

export default function Login() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('Auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const locale = params?.locale || 'ro';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
    
    try {
      await sendCustomResetEmail(email, locale as string);
      setMessage(t('messages.reset_sent'));
    } catch (err) {
      setError(t('errors.reset_failed'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl p-10">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-center mb-10">{t('login_title')}</h1>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 border rounded-2xl"
              placeholder={t('placeholders.email')}
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border rounded-2xl"
              placeholder="••••••••"
              required
            />
            
            <button type="button" onClick={handleResetPassword} className="text-[10px] font-black text-blue-600 uppercase hover:underline block w-full text-right">
              {t('forgot_password')}
            </button>

            {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
            {message && <p className="text-emerald-600 text-xs text-center font-bold">{message}</p>}

            <button type="submit" disabled={loading} className="w-full bg-[#0F172A] text-white py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <>{t('submit_button')} <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}