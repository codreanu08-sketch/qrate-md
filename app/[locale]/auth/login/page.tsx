'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Email sau parolă incorectă');
    } else {
      router.push('/ro/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">
        <div className="text-center mb-10">
          <div className="text-4xl font-bold text-blue-600">Qrate</div>
          <div className="text-emerald-600 font-semibold">.md</div>
          <h1 className="text-2xl font-semibold mt-6">Autentificare</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Parolă</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition"
          >
            {loading ? 'Se conectează...' : 'Autentificare'}
          </button>
        </form>

        <p className="text-center mt-8">
          Nu ai cont?{' '}
          <a href="/ro/auth/register" className="text-blue-600 font-medium">Creează cont</a>
        </p>
      </div>
    </div>
  );
}