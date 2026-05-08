'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Calendar, Users, Award, AlertTriangle, TrendingUp } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';

export default function AllReviewsDashboard() {
  const { locale = 'ro' } = useParams<{ locale: string }>();

  const [reviews, setReviews] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<string>('all');   // 'all' sau id locație
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');   // 'all' sau id angajat
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState(''); // pentru filtru pe zi exactă

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [selectedLocation, selectedEmployee, timeFilter, selectedDate]);

  async function loadInitialData() {
    const [locRes, empRes] = await Promise.all([
      supabase.from('locations').select('*'),
      supabase.from('employees').select('*')
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

    // Filtru Locație
    if (selectedLocation !== 'all') {
      query = query.eq('location_id', selectedLocation);
    }

    // Filtru Angajat
    if (selectedEmployee !== 'all') {
      query = query.eq('employee_id', selectedEmployee);
    }

    // Filtru Timp
    if (timeFilter === 'day' && selectedDate) {
      query = query.gte('created_at', selectedDate);
      query = query.lt('created_at', selectedDate + 'T23:59:59');
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('created_at', monthAgo.toISOString());
    }

    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  }

  const avgRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">📊 Dashboard Recenzii</h1>

        {/* Filtre */}
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Locații */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">Locație</label>
            <select 
              value={selectedLocation} 
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
            >
              <option value="all">Toate Locațiile</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Angajați */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">Angajat</label>
            <select 
              value={selectedEmployee} 
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
            >
              <option value="all">Toți Angajații</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Perioadă */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">Perioadă</label>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full border rounded-2xl px-4 py-3"
            >
              <option value="all">Toate</option>
              <option value="day">O zi specifică</option>
              <option value="week">Ultima săptămână</option>
              <option value="month">Ultima lună</option>
            </select>
          </div>

          {/* Calendar */}
          {timeFilter === 'day' && (
            <div>
              <label className="block text-sm text-gray-500 mb-2">Data</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3"
              />
            </div>
          )}
        </div>

        {/* Statistici */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-semibold mb-6">Rezultate</h2>
              <div className="text-6xl font-bold text-emerald-600 mb-2">{avgRating}</div>
              <p className="text-gray-500">Scor mediu general</p>
              <p className="text-sm text-gray-400 mt-6">Total recenzii: <span className="font-semibold text-black">{reviews.length}</span></p>
            </div>
          </div>

          {/* Best & Worst */}
          {/* Poți adăuga Best/Worst Employee aici dacă vrei */}
        </div>

        {/* Lista Recenzii */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Lista Recenzii ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <p className="text-center py-20 text-gray-500">Nu există recenzii pentru filtrele selectate.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border-b last:border-none py-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-3xl">{'★'.repeat(r.rating)}</div>
                    <p className="mt-3 text-lg leading-relaxed">{r.comment}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('ro-RO', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  {r.employees?.name && `Angajat: ${r.employees.name}`} • 
                  {r.locations?.name && ` Locație: ${r.locations.name}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}