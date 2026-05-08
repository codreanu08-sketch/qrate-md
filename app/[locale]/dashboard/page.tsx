'use client';

import Sidebar from '../../../components/Sidebar';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Star, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: "0",
    positiveReviews: 0,
  });
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, employees(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    setRecentReviews(reviews || []);

    if (reviews && reviews.length > 0) {
      const total = reviews.length;
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const positive = reviews.filter(r => r.rating >= 4).length;

      setStats({
        totalReviews: total,
        avgRating: (sum / total).toFixed(1),
        positiveReviews: positive,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();

    const handleFocus = () => loadDashboard();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <h1 className="text-4xl font-bold mb-10">Dashboard</h1>

        {/* Statistici */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <Star className="w-10 h-10 text-yellow-500" />
              <div>
                <p className="text-5xl font-bold">{stats.avgRating}</p>
                <p className="text-gray-500">Scor mediu</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-600" />
              <div>
                <p className="text-5xl font-bold">{stats.totalReviews}</p>
                <p className="text-gray-500">Total recenzii</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="text-5xl font-bold">{stats.positiveReviews}</p>
                <p className="text-gray-500">Recenzii pozitive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recenzii recente */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">Recenzii recente</h2>
          {recentReviews.length === 0 ? (
            <p className="text-center py-12 text-gray-500">Nu există recenzii încă</p>
          ) : (
            recentReviews.map(r => (
              <div key={r.id} className="border-b py-5 last:border-none">
                <div className="flex justify-between">
                  <div className="text-2xl text-yellow-400">{'★'.repeat(r.rating)}</div>
                  <span className="text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('ro-RO')}
                  </span>
                </div>
                {r.comment && <p className="mt-3">{r.comment}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  {r.employees?.name || 'Angajat'} • {r.reviewer_name}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}