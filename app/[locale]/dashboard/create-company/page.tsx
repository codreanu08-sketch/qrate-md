'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { Building2, Loader2, Check } from 'lucide-react';

export default function CreateCompanyPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const locale = params?.locale || 'ro';

  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // === VERIFICĂ LA ÎNCĂRCAREA PAGINII DACĂ ARE DEJA COMPANIE ===
  useEffect(() => {
    const checkExistingCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existingCompany) {
        // Are deja companie → du-l direct în dashboard
        router.push(`/${locale}/dashboard`);
      }
    };

    checkExistingCompany();
  }, [router, locale]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCompanyName(name);
    setSlug(generateSlug(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Numele companiei este obligatoriu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      // === VERIFICARE FINALĂ ÎNAINTE DE INSERT ===
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existingCompany) {
        router.push(`/${locale}/dashboard`);
        return;
      }

      const { error: insertError } = await supabase
        .from('companies')
        .insert({
          owner_id: user.id,
          name: companyName.trim(),
          slug: slug || generateSlug(companyName),
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Eroare la crearea companiei');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Creează Compania Ta</h1>
          <p className="text-slate-500 text-sm">Completează datele pentru a începe să folosești QRate</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">NUMELE COMPANIEI</label>
            <input
              type="text"
              value={companyName}
              onChange={handleNameChange}
              placeholder="Ex: Restaurantul Meu"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-medium focus:outline-none focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">SLUG (URL)</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5">
              <span className="text-slate-400 text-sm">qrate.md/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent text-lg font-medium focus:outline-none ml-1"
                placeholder="restaurantul-meu"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Acesta va fi link-ul public al companiei tale</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !companyName.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-[0.985]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Se creează...
              </>
            ) : (
              <>
                <Check size={18} />
                Creează Compania
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          Poți modifica aceste date oricând din Setări
        </p>
      </div>
    </div>
  );
}