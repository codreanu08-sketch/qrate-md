'use client';

import Sidebar from '../../../components/Sidebar';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Star, Users, TrendingUp } from 'lucide-react';

// Interfețe pentru tipizare strictă
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name?: string;
  employees?: {
    name: string;
  };
}

interface Stats {
  totalReviews: number;
  avgRating: string;
  positiveReviews: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    avgRating: "0.0",
    positiveReviews: 0,
  });
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*, employees(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const reviewsList = (reviews || []) as Review[];
      setRecentReviews(reviewsList);

      if (reviewsList.length > 0) {
        const total = reviewsList.length;
        
        // FIX: Tipizare explicită pentru acumulator (acc: number)
        const sum = reviewsList.reduce((acc: number, r: Review) => acc + (r.rating || 0), 0);
        const positive = reviewsList.filter(r => r.rating >= 4).length;

        setStats({
          totalReviews: total,
          avgRating: (sum / total).toFixed(1),
          positiveReviews: positive,
        });
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    // Reîmprospătare date când utilizatorul revine în tab
    const handleFocus = () => loadDashboard();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <h1 className="text-4xl font-bold mb-10 text-gray-800">Dashboard</h1>

        {/* Statistici */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-800">{stats.avgRating}</p>
                <p className="text-gray-500 font-medium">Scor mediu</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-800">{stats.totalReviews}</p>
                <p className="text-gray-500 font-medium">Total recenzii</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-800">{stats.positiveReviews}</p>
                <p className="text-gray-500 font-medium">Recenzii pozitive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recenzii recente */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Activitate Recentă</h2>
          
          {loading ? (
             <div className="text-center py-12 text-gray-400 italic">Se încarcă datele...</div>
          ) : recentReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed">
               Nu există recenzii înregistrate încă.
            </div>
          ) : (
            <div className="space-y-2">
              {recentReviews.map(r => (
                <div key={r.id} className="border-b border-gray-50 py-5 last:border-none hover:bg-gray-50 transition-colors px-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={16} 
                          className={`${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                      {new Date(r.created_at).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                  {r.comment && <p className="mt-3 text-gray-700 leading-relaxed italic">"{r.comment}"</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <p className="text-sm font-medium text-gray-600">
                      {r.employees?.name || 'Angajat general'} 
                      {r.reviewer_name && <span className="text-gray-400 font-normal"> • de către {r.reviewer_name}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}