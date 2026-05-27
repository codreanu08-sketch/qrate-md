'use client';

import { Suspense, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Zap, Lock } from 'lucide-react';
import { Link } from '@/i18n/routing';

function UpdatePasswordContent() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  useEffect(() => {
    const processToken = async () => {
      // Metoda 1: token_hash în query params (link nou Supabase)
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (token_hash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery',
        });
        if (error) {
          setError("Link invalid sau expirat. Solicită un nou link.");
        } else {
          setIsReady(true);
        }
        setLoading(false);
        return;
      }

      // Metoda 2: hash fragment în URL (#access_token=...&type=recovery)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');

        if (access_token && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });
          if (error) {
            setError("Link invalid sau expirat. Solicită un nou link.");
          } else {
            setIsReady(true);
          }
          setLoading(false);
          return;
        }
      }

      // Metoda 3: sesiune deja activă
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsReady(true);
        setLoading(false);
        return;
      }

      // Nimic nu a funcționat
      setError("Link invalid sau expirat. Solicită un nou link de resetare.");
      setLoading(false);
    };

    // Ascultă și event-ul PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, _session: any) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsReady(true);
        setLoading(false);
      }
    });

    processToken();

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      await supabase.auth.signOut();
      alert("Parola a fost actualizată cu succes!");
      router.push('/ro/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
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
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Parolă Nouă</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Introdu noua ta parolă securizată</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Se verifică link-ul...</p>
            </div>
          ) : error && !isReady ? (
            <div className="text-center py-4">
              <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl border border-red-100 mb-4">{error}</p>
              <Link href="/ro/auth/login" className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">
                Înapoi la Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Noua Parolă</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-900"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="bg-red-50 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center border border-red-100">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F172A] hover:bg-blue-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Actualizează Parola'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <UpdatePasswordContent />
    </Suspense>
  );
}