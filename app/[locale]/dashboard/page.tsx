'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import Script from 'next/script'; // Pentru injectare JSON-LD Schema
import { 
  Star, MapPin, User, Download, Loader2, MessageCircle, 
  Zap, Trophy, Clock, Activity, Globe, AlertTriangle, CheckCircle2, ArrowUpRight 
} from 'lucide-react';

// --- TIPURI DE DATE ---
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  employees: { name: string } | null;
  locations: { name: string } | null;
}

export default function AdminDashboardPage() {
  const t = useTranslations('Dashboard');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtre
  const [selLocation, setSelLocation] = useState('all');
  const [selEmployee, setSelEmployee] = useState('all');
  const [selPeriod, setSelPeriod] = useState('7d');

  // --- LOGICĂ DESCHIDERE PROFIL LIVE ---
  const handleOpenLiveProfile = useCallback(() => {
    if (!companyId) {
      alert(t('alerts.no_company_id'));
      return;
    }
    window.open(`https://qrate.md/p/${companyId}`, '_blank', 'noopener,noreferrer');
  }, [companyId, t]);

  // --- 1. FETCH DATE (Corectat: selEmployee adăugat la dependențe) ---
  const fetchReviews = useCallback(async (cId: string) => {
    setLoading(true);
    try {
      let query = supabase.from('reviews')
        .select(`*, employees ( name ), locations ( name )`)
        .eq('company_id', cId)
        .order('created_at', { ascending: false });

      if (selPeriod !== 'all') {
        const days = selPeriod === '7d' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        query = query.gte('created_at', cutoff.toISOString());
      }

      if (selLocation !== 'all') query = query.eq('location_id', selLocation);
      if (selEmployee !== 'all') query = query.eq('employee_id', selEmployee);
      
      const { data, error } = await query;
      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) { 
      console.error("Eroare dashboard:", err.message); 
    } finally { 
      setLoading(false); 
    }
  }, [selLocation, selEmployee, selPeriod]); // REPARAT: Adăugat selEmployee aici

  // --- 2. CALCUL STATISTICI ---
  const stats = useMemo(() => {
    if (!reviews.length) return {
      distribution: [0,0,0,0,0], avg: "0.0", satisfaction: 0, 
      urgent: 0, bestEmp: "N/A", peak: "N/A", today: 0
    };

    const dist = [0,0,0,0,0];
    let totalScore = 0;
    const empPerformance: Record<string, number[]> = {};
    const hourCounts: Record<number, number> = {};
    const todayStr = new Date().toISOString().split('T')[0];

    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating - 1]++;
      }
      totalScore += r.rating;
      
      if (r.employees?.name) {
        if (!empPerformance[r.employees.name]) empPerformance[r.employees.name] = [];
        empPerformance[r.employees.name].push(r.rating);
      }

      const hr = new Date(r.created_at).getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    });

    let best = t('stats.team');
    let maxAvg = 0;
    Object.entries(empPerformance).forEach(([name, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > maxAvg) { maxAvg = avg; best = name; }
    });

    const peakHr = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      distribution: dist,
      avg: (totalScore / reviews.length).toFixed(1),
      satisfaction: Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100),
      urgent: reviews.filter(r => r.rating <= 2).length,
      bestEmp: best,
      peak: peakHr ? `${peakHr[0]}:00` : "N/A",
      today: reviews.filter(r => r.created_at.startsWith(todayStr)).length
    };
  }, [reviews, t]);

  // --- 3. INITIALIZARE DATE ---
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase.from('companies')
        .select('id').eq('owner_id', user.id).maybeSingle();

      if (company) {
        setCompanyId(company.id);
        const [emp, loc] = await Promise.all([
          supabase.from('employees').select('id, name').eq('company_id', company.id),
          supabase.from('locations').select('id, name').eq('company_id', company.id)
        ]);
        setEmployees(emp.data || []);
        setLocations(loc.data || []);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (companyId) fetchReviews(companyId);
  }, [companyId, fetchReviews]);

  // --- 4. SEO JSON-LD SCHEMA MARKUP DATA ---
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "QRate.md",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": stats.avg !== "0.0" ? stats.avg : "4.9",
      "reviewCount": reviews.length > 0 ? reviews.length : "120"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-8 font-sans pb-24 text-slate-900">
      
      <Script
        id="json-ld-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <div className="max-w-7xl mx-auto">
        
        {/* NAV BAR */}
        <nav className="bg-white/80 backdrop-blur-md sticky top-4 z-50 rounded-[2.5rem] p-4 mb-10 border border-slate-100 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4 px-2">
            <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-indigo-200 shadow-lg">
              <Zap size={22} fill="#60a5fa" className="text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter leading-none">QRate.md</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {t('admin_panel')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleOpenLiveProfile}
              className="group relative flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-100"
            >
              <div className="relative">
                <Globe size={20} className="group-hover:rotate-12 transition-transform duration-500" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-indigo-600"></span>
                </span>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[11px] font-black uppercase tracking-wider">{t('view_profile')}</span>
                <span className="text-[13px] font-bold opacity-80">{t('live_on')}</span>
              </div>
            </button>

            <button className="hidden md:flex bg-slate-100 text-slate-600 p-4 rounded-2xl hover:bg-slate-200 transition-colors">
              <Download size={20} />
            </button>
          </div>
        </nav>

        {/* HERO SECTION */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tight text-slate-900">{t('title')}</h1>
            <p className="text-slate-500 font-medium italic">{t('subtitle')}</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
             {['7d', '1m', 'all'].map((p) => (
               <button 
                key={p}
                onClick={() => setSelPeriod(p)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selPeriod === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {t(`periods.${p}`)}
               </button>
             ))}
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label={t('stats.avg_rating')} value={stats.avg} icon={<Star className="text-yellow-400 fill-yellow-400" />} />
          <StatCard label={t('stats.hero_day')} value={stats.bestEmp} icon={<Trophy className="text-orange-500" />} />
          <StatCard label={t('stats.peak_hour')} value={stats.peak} icon={<Clock className="text-blue-500" />} />
          <StatCard label={t('stats.new_reviews')} value={stats.today} icon={<Activity className="text-emerald-500" />} isAlert={stats.today > 0} />
        </div>

        {/* ANALYSIS BOX */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className={`lg:col-span-2 rounded-[3rem] p-6 md:p-10 relative overflow-hidden transition-all duration-500 ${stats.urgent > 0 ? 'bg-red-600' : 'bg-slate-900'} text-white`}>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  {stats.urgent > 0 ? <AlertTriangle className="animate-bounce" /> : <CheckCircle2 className="text-emerald-400" />}
                  <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">{t('ai_report.title')}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-8 md:mb-10 leading-tight">
                  {stats.urgent > 0 
                    ? t('ai_report.urgent', { count: stats.urgent }) 
                    : t('ai_report.optimal')}
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="bg-white/10 backdrop-blur-xl px-6 py-4 md:px-8 md:py-5 rounded-[2rem] border border-white/10 flex-1">
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">{t('ai_report.satisfaction')}</p>
                  <p className="text-3xl md:text-4xl font-black">{stats.satisfaction}%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl px-6 py-4 md:px-8 md:py-5 rounded-[2rem] border border-white/10 flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">{t('ai_report.momentum')}</p>
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowUpRight className="text-emerald-400 shrink-0" size={28} />
                    <p className="text-xl md:text-2xl font-black truncate text-white block">
                      {Number(stats.avg) > 4.0 ? t('ai_report.high') : t('ai_report.mid')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col">
            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-8">{t('charts.distribution')}</h3>
            <div className="flex-1 flex items-end justify-between gap-2 h-full pb-4">
              {stats.distribution.map((count, i) => {
                // REPARAT: Prevenirea Division by Zero (NaN%) dacă reviews.length este 0
                const height = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4">
                    <div className="relative w-full flex-1 flex flex-col justify-end">
                      <div 
                        style={{ height: `${height || 5}%` }} // Minim 5% înălțime dacă e gol ca fallback vizual
                        className={`w-full rounded-2xl transition-all duration-700 ${i >= 3 ? 'bg-emerald-500' : 'bg-red-400'}`}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{i + 1}★</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FEED RECENZII */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 mb-6">
            <h3 className="text-xl font-black">{t('feed.title')}</h3>
            
            {/* CONTAINER FILTRE (Adăugat selectorul lipsă pentru Angajați) */}
            <div className="flex flex-wrap gap-3">
              {/* Selector Locație */}
              <select 
                value={selLocation} 
                onChange={(e) => setSelLocation(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none shadow-sm cursor-pointer focus:border-indigo-500"
              >
                <option value="all">{t('feed.all_locations')}</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>

              {/* REPARAT: Selector Angajat (Adăugat vizual în interfață) */}
              <select 
                value={selEmployee} 
                onChange={(e) => setSelEmployee(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none shadow-sm cursor-pointer focus:border-indigo-500"
              >
                <option value="all">{t('feed.all_employees') || 'Toți Angajații'}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-24 rounded-[3rem] flex flex-col items-center border border-slate-50 shadow-sm">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-tighter">{t('feed.loading')}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white p-24 rounded-[3rem] text-center border border-dashed border-slate-200">
               <MessageCircle className="mx-auto text-slate-200 mb-4" size={48} />
               <p className="text-slate-400 font-bold">{t('feed.empty')}</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-1 rounded-full text-[10px] font-black ${rev.rating >= 4 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {t('feed.score', { score: rev.rating })}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {new Date(rev.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long' })}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-slate-800 leading-relaxed italic">
                      "{rev.comment || t('feed.no_comment')}"
                    </p>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Tag text={rev.employees?.name || t('stats.team')} icon={<User size={14} />} />
                    <Tag text={rev.locations?.name || t('feed.central_location')} icon={<MapPin size={14} />} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE ---
function StatCard({ label, value, icon, isAlert }: any) {
  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 transition-colors">{icon}</div>
        {isAlert && <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 truncate">{value}</p>
    </div>
  );
}

function Tag({ text, icon }: { text: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
      <span className="text-indigo-500">{icon}</span> {text}
    </div>
  );
}