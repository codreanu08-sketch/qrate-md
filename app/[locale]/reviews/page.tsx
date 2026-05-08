'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Calendar, Users, Award, AlertTriangle, TrendingUp } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';

// Definim interfețe pentru a evita erorile de tip "any"
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  location_id: string;
  employee_id?: string;
  locations?: { name: string };
  employees?: { name: string; position: string; photo_url: string };
}

interface BasicInfo {
  id: string;
  name: string;
}

export default function AllReviewsDashboard() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ro';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<BasicInfo[]>([]);
  const [employees, setEmployees] = useState<BasicInfo[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [selectedLocation, selectedEmployee, timeFilter, selectedDate]);

  async function loadInitialData() {
    const [locRes, empRes] = await Promise.all([
      supabase.from('locations').select('id, name'),
      supabase.from('employees').select('id, name')
    ]);

    setLocations(locRes.data || []);
    setEmployees(empRes.data || []);
  }

  async function loadReviews() {
    setLoading(true);

    let query = supabase
      .from('reviews')
      .select(`
        *,
        locations (name),
        employees (name, position, photo_url)
      `)
      .order('created_at', { ascending: false });

    if (selectedLocation !== 'all') {
      query = query.eq('location_id', selectedLocation);
    }

    if (selectedEmployee !== 'all') {
      query = query.eq('employee_id', selectedEmployee);
    }

    if (timeFilter === 'day' && selectedDate) {
      query = query.gte('created_at', `${selectedDate}T00:00:00`);
      query = query.lt('created_at', `${selectedDate}T23:59:59`);
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('created_at', monthAgo.toISOString());
    }

    const { data } = await query;
    setReviews((data as unknown as Review[]) || []);
    setLoading(false);
  }

  // FIX: Am adăugat tipul "number" pentru "sum" în reduce
  const avgRating = reviews.length 
    ? (reviews.reduce((sum: number, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">📊 Dashboard Recenzii</h1>

        {/* Filtre */}
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm text-gray-500 mb-2">Locație</label>
            <select 
              value={selectedLocation} 
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Toate Locațiile</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Angajat</label>
            <select 
              value={selectedEmployee} 
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Toți Angajații</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Perioadă</label>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Toate</option>
              <option value="day">O zi specifică</option>
              <option value="week">Ultima săptămână</option>
              <option value="month">Ultima lună</option>
            </select>
          </div>

          {timeFilter === 'day' && (
            <div>
              <label className="block text-sm text-gray-500 mb-2">Data</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Statistici */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12">
            <div className="bg-white rounded-3xl p-8 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Scor mediu general</h2>
                <div className="text-6xl font-bold text-emerald-600">{avgRating}</div>
                <p className="text-gray-500 mt-2">Bazat pe {reviews.length} recenzii</p>
              </div>
              <TrendingUp className="w-20 h-20 text-emerald-100" />
            </div>
          </div>
        </div>

        {/* Lista Recenzii */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Lista Recenzii ({reviews.length})</h2>

          {loading ? (
             <p className="text-center py-20 text-gray-500">Se încarcă recenziile...</p>
          ) : reviews.length === 0 ? (
            <p className="text-center py-20 text-gray-500">Nu există recenzii pentru filtrele selectate.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((r) => (
                <div key={r.id} className="border-b last:border-none pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl text-yellow-400">
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </div>
                      <p className="mt-3 text-lg leading-relaxed text-gray-800 italic">"{r.comment}"</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('ro-RO', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-4 text-xs font-medium uppercase tracking-wider">
                    {r.employees?.name && (
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                        Angajat: {r.employees.name}
                      </span>
                    )}
                    {r.locations?.name && (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        Locație: {r.locations.name}
                      </span>
                    )}
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