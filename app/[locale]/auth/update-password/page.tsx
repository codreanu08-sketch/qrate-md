'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Supabase va verifica automat token-ul din URL (Hash-ul de tip #access_token=...)
    const { error } = await supabase.auth.updateUser({ 
      password: password 
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Succes
      alert("Parola a fost actualizată cu succes!");
      router.push('/ro/auth/login'); // Trimite-l la login să se logheze cu noua parolă
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <form onSubmit={handleUpdate} className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Setează parola nouă</h1>
          <p className="text-slate-400 text-xs mt-2">Introdu noua ta parolă securizată.</p>
        </div>

        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="password" 
            placeholder="••••••••" 
            required
            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 transition-all text-slate-900"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-[11px] font-bold text-center">{error}</p>}

        <button 
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Actualizează Parola'}
        </button>
      </form>
    </div>
  );
}