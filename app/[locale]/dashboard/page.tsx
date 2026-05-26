'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Building, Loader2 } from 'lucide-react';

export default function AdminDashboardPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const locale = params?.locale || 'ro';

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const checkCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (company) {
        setCompanyId(company.id);
      } else {
        setCompanyId(null);
      }
      setLoading(false);
    };

    checkCompany();
  }, [router, locale]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('companies')
      .insert({ name: newCompanyName.trim(), owner_id: user.id })
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      setCompanyId(data.id);
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // === FORMULAR CREARE COMPANIE ===
  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
              <Building size={36} />
            </div>
            <h1 className="text-3xl font-black mb-3">Creează Compania Ta</h1>
            <p className="text-slate-500">Introdu numele companiei pentru a continua</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <input
              type="text"
              placeholder="Ex: Restaurantul Meu SRL"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-lg font-medium focus:outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={creating || !newCompanyName.trim()}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {creating ? 'Se creează...' : 'Creează Compania'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // === DASHBOARD NORMAL ===
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8">Dashboard</h1>
        <div className="bg-white p-8 rounded-3xl shadow">
          <p className="text-xl">Bine ai venit! Compania ta este creată.</p>
          <p className="text-slate-500 mt-2">Company ID: {companyId}</p>
        </div>
      </div>
    </div>
  );
}