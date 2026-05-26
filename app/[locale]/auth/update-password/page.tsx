'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function UpdatePasswordContent() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const hasProcessed = useRef(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  useEffect(() => {
    // 1. Verificăm dacă avem un hash în URL (unde Supabase pune token-ul de resetare)
    const hash = window.location.hash;
    
    if (hash && !hasProcessed.current) {
      hasProcessed.current = true;
      setLoading(true);

      // Supabase extrage automat sesiunea din URL-ul de tip 'recovery'
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session) {
          setIsReady(true);
          setLoading(false);
        }
      });
    } else {
      // Dacă nu există hash, verificăm dacă suntem deja autentificați prin link
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setIsReady(true);
        } else {
          setError("Link invalid sau expirat.");
        }
      });
    }
  }, [supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
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
        
        {!isReady && !loading && <p className="text-red-500 text-sm font-bold text-center">Se verifică link-ul...</p>}
        
        <input 
          type="password" 
          placeholder="Noua parolă" 
          required
          disabled={!isReady || loading}
          className="w-full p-4 bg-slate-50 border rounded-2xl"
          onChange={(e) => setPassword(e.target.value)}
        />
        
        {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
        
        <button 
          type="submit"
          disabled={loading || !isReady}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Actualizează Parola'}
        </button>
      </form>
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