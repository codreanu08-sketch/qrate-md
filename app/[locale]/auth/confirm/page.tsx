'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus('success');
        setTimeout(() => router.push(`/${lang}/dashboard`), 2000);
      } else if (event === 'USER_UPDATED' && session) {
        setStatus('success');
        setTimeout(() => router.push(`/${lang}/dashboard`), 2000);
      }
    });

    // Verifică dacă există deja sesiune (link deja confirmat)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('success');
        setTimeout(() => router.push(`/${lang}/dashboard`), 2000);
      } else {
        // Dacă nu e sesiune după 5 secunde → eroare
        setTimeout(() => {
          setStatus(prev => prev === 'loading' ? 'error' : prev);
          setMessage(lang === 'ru' ? 'Link invalid sau expirat.' : 'Link invalid sau expirat.');
        }, 5000);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, lang]);

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
                {lang === 'ru' ? 'Confirmare...' : 'Se confirmă contul...'}
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
                {lang === 'ru' ? 'Te redirecționăm la dashboard...' : 'Te redirecționăm la dashboard...'}
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
                {lang === 'ru' ? 'Încearcă din nou' : 'Încearcă din nou'}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
