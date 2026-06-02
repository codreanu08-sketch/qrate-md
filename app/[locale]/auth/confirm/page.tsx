'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Zap, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname?.startsWith('/ru') ? 'ru' : 'ro';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const hash = window.location.hash;

    if (!hash || !hash.includes('access_token')) {
      setStatus('error');
      setMessage(lang === 'ru' ? 'Link invalid sau expirat.' : 'Link invalid sau expirat.');
      return;
    }

    // Parsează tokenurile din hash
    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (!access_token || !refresh_token) {
      setStatus('error');
      setMessage(lang === 'ru' ? 'Token lipsă în link.' : 'Token lipsă în link.');
      return;
    }

    // Setează sesiunea explicit
    supabase.auth.setSession({ access_token, refresh_token })
      .then(({ data, error }: { data: any; error: any }) => {
        if (error || !data.session) {
          setStatus('error');
          setMessage(lang === 'ru' ? 'Link expirat. Înregistrează-te din nou.' : 'Link expirat. Înregistrează-te din nou.');
        } else {
          setStatus('success');
          // Curăță hash-ul din URL
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => router.push(`/${lang}/dashboard` as any), 1500);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage(lang === 'ru' ? 'Eroare la confirmare.' : 'Eroare la confirmare.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-10">
          <Link href={`/${lang}`}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-8 py-3 flex items-center gap-2 shadow-xl shadow-blue-200">
              <Zap className="text-white fill-white" size={18} />
              <span className="text-white font-black tracking-tighter text-2xl italic">QRate<span className="not-italic opacity-70">.md</span></span>
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl p-10">
          {status === 'loading' && (
            <>
              <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {lang === 'ru' ? 'Se activează contul...' : 'Se activează contul...'}
              </h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="text-emerald-600" size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                {lang === 'ru' ? 'Cont activat!' : 'Cont activat!'}
              </h2>
              <p className="text-slate-400 text-sm">
                {lang === 'ru' ? 'Te redirectionam la dashboard...' : 'Te redirecționăm la dashboard...'}
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <X className="text-red-500" size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                {lang === 'ru' ? 'Eroare de confirmare' : 'Eroare de confirmare'}
              </h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link href={`/${lang}/auth/register`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider">
                {lang === 'ru' ? 'Inregistrare noua' : 'Înregistrare nouă'}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
