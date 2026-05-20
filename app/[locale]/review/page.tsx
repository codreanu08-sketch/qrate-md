'use client';

import * as React from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

import ru from '@/messages/ru.json'; 
import ro from '@/messages/ro.json'; 

import { 
  Star, MapPin, User, Filter, 
  Download, Loader2, ChevronLeft, ChevronRight, Languages 
} from 'lucide-react';

export default function AdminReviewsPage() {
  const unwrappedParams = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Determinăm limba curentă în siguranță
  const lang = (unwrappedParams?.locale as 'ro' | 'ru') || 'ro';
  
  // Selectăm traducerile corespunzătoare limbii active
  const messages = useMemo(() => (lang === 'ro' ? ro : ru), [lang]);
  
  // Adăugăm fallback-uri de siguranță pentru a preveni erorile de tip undefined la build
  const t = messages?.AdminReviews || {
    title: 'Recenzii',
    subtitle: 'Administrare',
    export_btn: 'Export',
    filter_title: 'Filtre',
    general_tag: 'General',
    loading_db: 'Se încarcă...',
    no_results: 'Nu s-au găsit rezultate',
    page_label: 'Pagina',
    labels: { location: 'Locație', employee: 'Angajat', period: 'Perioadă' },
    options: { all_locs: 'Toate locațiile', all_emps: 'Toți angajații', '7d': 'Ultimele 7 zile', '1m': 'Ultima lună', '3m': 'Ultimele 3 luni', custom: 'Personalizat' }
  };

  const dashboardFeedMessages = messages?.Dashboard?.feed || { no_comment: 'Fără comentariu' };
  
  // FUNCȚIE PENTRU SCHIMBAREA LIMBII
  const toggleLanguage = () => {
    const newLang = lang === 'ro' ? 'ru' : 'ro';
    const segments = pathname.split('/');
    if (segments[1] === 'ro' || segments[1] === 'ru') {
      segments[1] = newLang;
    } else {
      segments.splice(1, 0, newLang);
    }
    router.push(segments.join('/'));
  };

  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTRE -> Setat inițial pe 'all' pentru a evita ascunderea recenziilor noi
  const [selLocation, setSelLocation] = useState('all');
  const [selEmployee, setSelEmployee] = useState('all');
  const [selPeriod, setSelPeriod] = useState('all'); 
  const [specificDate, setSpecificDate] = useState('');

  // PAGINARE
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchInitialData() {
      const { data: emp } = await supabase.from('employees').select('id, name').order('name');
      const { data: loc } = await supabase.from('locations').select('id, name').order('name');
      if (emp) setEmployees(emp);
      if (loc) setLocations(loc);
    }
    fetchInitialData();
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          employees ( name, photo_url ),
          locations ( name )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (selLocation !== 'all') query = query.eq('location_id', selLocation);
      if (selEmployee !== 'all') query = query.eq('employee_id', selEmployee);

      // Aplicăm filtrele de timp doar dacă nu este selectat 'all'
      if (selPeriod === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        query = query.gte('created_at', d.toISOString());
      } else if (selPeriod === '1m') {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        query = query.gte('created_at', d.toISOString());
      } else if (selPeriod === '3m') {
        const d = new Date(); d.setMonth(d.getMonth() - 3);
        query = query.gte('created_at', d.toISOString());
      } else if (selPeriod === 'custom' && specificDate) {
        query = query.gte('created_at', `${specificDate}T00:00:00Z`)
                     .lte('created_at', `${specificDate}T23:59:59Z`);
      }

      const from = page * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selLocation, selEmployee, selPeriod, specificDate, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setPage(0);
  }, [selLocation, selEmployee, selPeriod, specificDate]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-10 font-sans text-slate-900 overflow-x-hidden">
      
      {/* BUTON SCHIMBARE LIMBA */}
      <div className="max-w-7xl mx-auto flex justify-end mb-4">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
        >
          <Languages size={18} />
          {lang === 'ro' ? 'RU' : 'RO'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
            {t.title} {loading && <Loader2 className="animate-spin text-blue-600" size={24} />}
          </h1>
          <p className="text-slate-500 font-medium mt-1">{t.subtitle}</p>
        </div>
        <button className="bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl font-bold text-slate-700 hover:border-blue-500 transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
          <Download size={20} /> {t.export_btn}
        </button>
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        <aside className="lg:col-span-1 space-y-4 w-full min-w-0">
          <div className="bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white w-full min-w-0">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <Filter size={14} /> {t.filter_title}
            </h2>

            <div className="space-y-5 w-full min-w-0">
              <div className="w-full min-w-0">
                <label className="text-xs font-bold text-slate-700 mb-2 block">{t.labels?.location}</label>
                <select 
                  value={selLocation} 
                  onChange={(e) => setSelLocation(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-2.5 px-3 md:py-3 md:px-4 font-bold text-slate-700 transition-all outline-none text-sm md:text-base cursor-pointer"
                >
                  <option value="all">{t.options?.all_locs}</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>

              <div className="w-full min-w-0">
                <label className="text-xs font-bold text-slate-700 mb-2 block">{t.labels?.employee}</label>
                <select 
                  value={selEmployee}
                  onChange={(e) => setSelEmployee(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-2.5 px-3 md:py-3 md:px-4 font-bold text-slate-700 transition-all outline-none text-sm md:text-base cursor-pointer"
                >
                  <option value="all">{t.options?.all_emps}</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>

              <div className="w-full min-w-0">
                <label className="text-xs font-bold text-slate-700 mb-2 block">{t.labels?.period}</label>
                <select 
                  value={selPeriod}
                  onChange={(e) => setSelPeriod(e.target.value)}
                  className="w-full min-w-0 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-2.5 px-3 md:py-3 md:px-4 font-bold text-slate-700 transition-all outline-none text-sm md:text-base cursor-pointer"
                >
                  <option value="all">Toată perioada</option>
                  <option value="7d">{t.options?.['7d']}</option>
                  <option value="1m">{t.options?.['1m']}</option>
                  <option value="3m">{t.options?.['3m']}</option>
                  <option value="custom">{t.options?.custom}</option>
                </select>
              </div>

              {selPeriod === 'custom' && (
                <div className="pt-1 animate-in slide-in-from-top-4 duration-300 w-full min-w-0">
                  <input 
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="w-full min-w-0 bg-blue-50 border-2 border-blue-200 rounded-2xl py-2.5 px-3 md:py-3 md:px-4 font-bold text-blue-700 outline-none text-sm md:text-base"
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-6 w-full min-w-0">
          {loading && reviews.length === 0 ? (
            <div className="bg-white p-12 md:p-20 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t.loading_db}</p>
            </div>
          ) : !loading && reviews.length === 0 ? (
            <div className="bg-white p-12 md:p-20 rounded-[2rem] md:rounded-[2.5rem] text-center border-2 border-dashed border-slate-300">
              <p className="text-slate-400 font-bold">{t.no_results}</p>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 w-full min-w-0`}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-blue-100 group w-full min-w-0">
                    <div className="flex flex-col md:flex-row gap-6 w-full min-w-0">
                      <div className="flex-1 w-full min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={18} 
                                className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} 
                              />
                            ))}
                          </div>
                          <span className="sm:ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest block whitespace-nowrap">
                            {new Date(rev.created_at).toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'ru-RU')}
                          </span>
                        </div>
                        
                        <p className="text-slate-700 text-base md:text-lg font-semibold leading-relaxed mb-5 italic group-hover:text-slate-900 transition-colors break-words">
                          "{rev.comment || dashboardFeedMessages.no_comment}"
                        </p>

                        <div className="flex flex-wrap gap-2 w-full">
                          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-[10px] md:text-[11px] font-black uppercase max-w-full truncate">
                            <MapPin size={12} className="shrink-0" /> <span className="truncate">{rev.locations?.name || 'Locație Generală'}</span>
                          </span>
                          <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-[10px] md:text-[11px] font-black uppercase max-w-full truncate">
                            <User size={12} className="shrink-0" /> <span className="truncate">{rev.employees?.name || t.general_tag}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 pt-4 md:pt-6">
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="p-2.5 md:p-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center"
                >
                  <ChevronLeft size={22} />
                </button>
                <span className="font-black text-slate-700 text-xs md:text-sm bg-white px-4 py-2.5 md:px-6 md:py-3 rounded-2xl border border-slate-200 shadow-sm whitespace-nowrap">
                  {t.page_label} {page + 1}
                </span>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={reviews.length < itemsPerPage || loading}
                  className="p-2.5 md:p-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all flex items-center justify-center"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}