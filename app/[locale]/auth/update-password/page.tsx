'use client';

import { Suspense, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Aceasta este componenta ta logică de bază
function UpdatePasswordContent() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setLoading(true);
      supabase.auth.exchangeCodeForSession(code).then((result: any) => {
        if (result.error) {
          setError("Link-ul a expirat sau este invalid.");
        } else {
          setIsReady(true);
        }
        setLoading(false);
      });
    }
  }, [searchParams, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    
    setLoading(true);
    setError('');
    
    // @ts-ignore
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      alert("Parola a fost actualizată!");
      router.push('/ro/auth/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <form onSubmit={handleUpdate} className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Parolă Nouă</h1>
        <input 
          type="password" 
          placeholder="Noua parolă" 
          required
          disabled={!isReady && !loading}
          className="w-full p-4 bg-slate-50 border rounded-2xl"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
        <button 
          disabled={loading || !isReady}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Actualizează Parola'}
        </button>
      </form>
    </div>
  );
}

// Aceasta este componenta care exportă pagina și înfășoară totul în Suspense
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Se încarcă...</div>}>
      <UpdatePasswordContent />
    </Suspense>
  );
}