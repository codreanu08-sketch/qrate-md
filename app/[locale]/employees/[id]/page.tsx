'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { User, ArrowLeft } from 'lucide-react';
import Sidebar from '../../../../components/Sidebar';

export default function EmployeeDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');

  useEffect(() => {
    if (id) loadData();
  }, [id, filter]);

  async function loadData() {
    setLoading(true);

    // Date angajat
    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (emp) setEmployee(emp);

    // Recenzii
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false });

    if (filter === 'day') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('created_at', today);
    } else if (filter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('created_at', monthAgo.toISOString());
    }

    const { data: revs } = await query;
    setReviews(revs || []);
    setLoading(false);
  }

  const avgRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : '—';

  if (loading) return <div className="p-12 text-center">Se încarcă...</div>;
  if (!employee) return <div className="p-12 text-center text-red-600">Angajatul nu a fost găsit.</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-blue-600 mb-8 hover:underline"
        >
          <ArrowLeft /> Înapoi la angajați
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Poză */}
            <div>
              {employee.photo_url ? (
                <img 
                  src={`https://xtsecrskyoswwulkhgll.supabase.co/storage/v1/object/public/employee-photos/${employee.photo_url}`} 
                  className="w-64 h-64 rounded-3xl object-cover shadow-xl" 
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-3xl flex items-center justify-center">
                  <User className="w-32 h-32 text-gray-400" />
                </div>
              )}
            </div>

            {/* Info angajat */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold">{employee.name}</h1>
              {employee.position && <p className="text-3xl text-gray-600 mt-3">{employee.position}</p>}

              <div className="mt-10 grid grid-cols-3 gap-8 text-center">
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="text-5xl font-bold text-emerald-600">{avgRating}</div>
                  <p className="text-sm text-gray-500">Scor mediu</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="text-5xl font-bold">{reviews.length}</div>
                  <p className="text-sm text-gray-500">Recenzii</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="text-5xl font-bold text-amber-600">
                    {reviews.filter(r => r.rating >= 4).length}
                  </div>
                  <p className="text-sm text-gray-500">Bune</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recenzii */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Recenziile angajatului</h2>
            <div className="flex gap-2">
              {['all', 'day', 'week', 'month'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-6 py-2 rounded-2xl text-sm transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {f === 'all' ? 'Toate' : f === 'day' ? 'Azi' : f === 'week' ? '7 Zile' : '30 Zile'}
                </button>
              ))}
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-center py-20 text-gray-500">Încă nu are recenzii</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="border-b last:border-0 py-6">
                <div className="flex justify-between items-start">
                  <div className="text-3xl text-yellow-400">{'★'.repeat(r.rating)}</div>
                  <span className="text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('ro-RO')}
                  </span>
                </div>
                {r.comment && <p className="mt-4 text-lg">{r.comment}</p>}
                <p className="mt-3 text-sm text-gray-500">
                  {r.reviewer_name || 'Client anonim'} • {r.reviewer_phone || ''}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}