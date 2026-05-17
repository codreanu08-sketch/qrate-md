'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert(error.message);
    } else {
      alert("Parola a fost actualizată!");
      router.push('/ro/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-md space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Parolă Nouă</h1>
        <input 
          type="password" 
          placeholder="Introdu noua parolă" 
          required
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button 
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
        >
          {loading ? 'Se salvează...' : 'Actualizează Parola'}
        </button>
      </form>
    </div>
  );
}