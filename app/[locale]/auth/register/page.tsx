'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function Register() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [type, setType] = useState<'restaurant' | 'retailer' | 'service'>('restaurant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const slug = companyName.toLowerCase().replace(/\s+/g, '-');

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          slug,
          type,
          owner_id: authData.user?.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      alert('Cont creat cu succes! Redirecționez la dashboard...');
      router.push('/ro/dashboard');
    } catch (error: any) {
      alert('Eroare: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">
        <h1 className="text-4xl font-bold text-center mb-2">Qrate.md</h1>
        <p className="text-center text-gray-600 mb-8">Creează contul companiei tale</p>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 font-medium">Numele companiei</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:border-blue-500"
              placeholder="Frizeria Royal"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Tipul afacerii</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:border-blue-500"
            >
              <option value="restaurant">Restaurant / Cafenea</option>
              <option value="retailer">Magazin / Retail</option>
              <option value="service">Servicii (frizerie, clinică, etc.)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Parolă</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition"
          >
            {loading ? 'Se creează contul...' : 'Creează cont gratuit'}
          </button>
        </form>
      </div>
    </div>
  );
}