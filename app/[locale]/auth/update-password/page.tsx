'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validăm codul din URL pentru a crea sesiunea
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setLoading(true);
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError("Link-ul a expirat sau este invalid.");
        } else {
          setIsReady(true);
        }
        setLoading(false);
      });
    }
  }, [searchParams]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    
    setLoading(true);
    setError('');
    
    // @ts-ignore - Ignorăm eroarea de tip TypeScript pentru a permite compilarea
    const { error } = await supabase.auth.updateUser({ 
      password: password 
    });

    if (error) {
      setError(error.message);
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
          className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
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