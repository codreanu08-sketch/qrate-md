'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

import { 
  MapPin, User, Star, Loader2, Lock, 
  Filter, Calendar as CalendarIcon, MessageSquare,
  Trophy, ChevronLeft, ChevronRight, Download, Zap, X, Eye
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  location_id: string;
  employee_id?: string;
  photo_url?: string | null;
  locations?: { name: string };
  employees?: { name: string; position: string; photo_url: string };
}

interface BasicInfo {
  id: string;
  name: string;
}

export default function AllReviewsDashboard() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';

  const t = useTranslations('AdminReviews');
  const tStats = useTranslations('EmployeeStats.stats');
  const tCommon = useTranslations('Dashboard');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<BasicInfo[]>([]);
  const [employees, setEmployees] = useState<BasicInfo[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Stare pentru Pop-up-ul de vizualizare a pozei mărite
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Filtre active
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '1m' | '3m' | 'custom'>('7d');
  const [customDate, setCustomDate] = useState<string>('');

  // Paginație activă
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const smartStats = useMemo(() => {
    if (reviews.length === 0) return { bestEmp: 'N/A', avg: '0.0', count: 0 };
    
    const empMap: Record<string, { total: number; count: number }> = {};
    reviews.forEach(r => {
      if (r.employees?.name) {
        if (!empMap[r.employees.name]) empMap[r.employees.name] = { total: 0, count: 0 };
        empMap[r.employees.name].total += r.rating;
        empMap[r.employees.name].count += 1;
      }
    });

    let bestEmp = locale === 'ru' ? 'Команда' : 'Echipa';
    let maxAvg = 0;
    Object.entries(empMap).forEach(([name, d]) => {
      const avg = d.total / d.count;
      if (avg > maxAvg) { maxAvg = avg; bestEmp = name; }
    });

    const totalScore = reviews.reduce((a, b) => a + b.rating, 0);

    return {
      bestEmp,
      avg: (totalScore / reviews.length).toFixed(1),
      count: reviews.length
    };
  }, [reviews, locale]);

  const checkAccessAndCompany = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/${locale}/login`); return; }

    const { data: profile } = await supabase.from('profiles').select('created_at, subscription_tier').eq('id', user.id).single();
    const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
    
    if (company) setCompanyId(company.id);
    
    if (profile) {
      const signupDate = new Date(profile.created_at);
      const diffInDays = Math.floor((new Date().getTime() - signupDate.getTime()) / (1000 * 3600 * 24));
      setHasAccess(profile.subscription_tier === 'pro' || diffInDays <= 7);
    } else { 
      setHasAccess(false); 
    }
  }, [locale, router]);

  const loadInitialData = useCallback(async (cId: string) => {
    const [locRes, empRes] = await Promise.all([
      supabase.from('locations').select('id, name').eq('company_id', cId).order('name'),
      supabase.from('employees').select('id, name').eq('company_id', cId).order('name')
    ]);
    setLocations(locRes.data || []);
    setEmployees(empRes.data || []);
  }, []);

  const loadReviews = useCallback(async () => {
    if (!companyId || hasAccess === false) return;
    setLoading(true);
    
    let query = supabase
      .from('reviews')
      .select(`*, locations (name), employees (name, position, photo_url)`)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (selectedLocation !== 'all') query = query.eq('location_id', selectedLocation);
    if (selectedEmployee !== 'all') query = query.eq('employee_id', selectedEmployee);

    if (timeFilter === 'custom' && customDate) {
      query = query.gte('created_at', `${customDate}T00:00:00Z`).lte('custom_at', `${customDate}T23:59:59Z`);
    } else if (timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === '7d') now.setDate(now.getDate() - 7);
      else if (timeFilter === '1m') now.setMonth(now.getMonth() - 1);
      else if (timeFilter === '3m') now.setMonth(now.getMonth() - 3);
      query = query.gte('created_at', now.toISOString());
    }

    const { data } = await query;
    setReviews((data as unknown as Review[]) || []);
    setLoading(false);
  }, [selectedLocation, selectedEmployee, hasAccess, companyId, timeFilter, customDate]);

  const handleExportCSV = () => {
    if (reviews.length === 0) return;
    
    const headers = ['Data', 'Rating', 'Comentariu', 'Locatie', 'Angajat'];
    const rows = reviews.map(r => [
      new Date(r.created_at).toLocaleDateString(),
      r.rating,
      `"${r.comment?.replace(/"/g, '""') || ''}"`,
      r.locations?.name || 'General',
      r.employees?.name || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QRate_Reviews_${timeFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { checkAccessAndCompany(); }, [checkAccessAndCompany]);
  useEffect(() => { if (companyId) loadInitialData(companyId); }, [companyId, loadInitialData]);
  useEffect(() => { if (hasAccess === true && companyId) loadReviews(); }, [loadReviews, hasAccess, companyId]);

  useEffect(() => { setCurrentPage(1); }, [selectedLocation, selectedEmployee, timeFilter, customDate]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return reviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [reviews, currentPage]);

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE) || 1;

  if (hasAccess === null) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
        {!hasAccess ? (
           <div className="min-h-[70vh] flex items-center justify-center text-center p-4">
             <div className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-gray-100 max-w-md w-full">
               <Lock className="text-red-500 mx-auto mb-6 md:mb-8" size={40} />
               <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Premium Only</h2>
               <p className="text-gray-500 mb-8 font-medium text-sm md:text-base">
                 {locale === 'ru' ? 'Обновите план для доступа к этой панели.' : 'Upgrade pentru a vedea analizele smart.'}
               </p>
               <button onClick={() => router.push(`/${locale}/pricing`)} className="w-full bg-slate-950 text-white py-4.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-transform active:scale-95">
                 Upgrade Now
               </button>
             </div>
           </div>
        ) : (
          <>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between py-8 md:py-10 gap-4 border-b border-gray-100 mb-6 md:mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <Zap className="text-blue-600 fill-blue-600 shrink-0" size={28} /> {t('title')}
                </h1>
                <p className="text-gray-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1.5">{t('subtitle')}</p>
              </div>
              <button 
                onClick={handleExportCSV} 
                disabled={reviews.length === 0}
                className="w-full sm:w-auto bg-white border border-gray-200 px-5 py-3 rounded-xl font-bold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
              >
                <Download size={18} /> {t('export_btn')}
              </button>
            </header>

            {/* Zonă Filtre Complet Responsivă */}
            <div className="bg-white p-4 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-50 mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto flex-1">
                <FilterGroup label={t('labels.location')} icon={<MapPin size={13}/>} value={selectedLocation} onChange={setSelectedLocation} options={locations} allLabel={t('options.all_locs')} />
                <FilterGroup label={t('labels.employee')} icon={<User size={13}/>} value={selectedEmployee} onChange={setSelectedEmployee} options={employees} allLabel={t('options.all_emps')} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto scrollbar-none">
                  {['7d', '1m', '3m', 'all'].map((period) => (
                    <button 
                      key={period} 
                      onClick={() => { setTimeFilter(period as any); setCustomDate(''); }} 
                      className={`px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 text-center ${timeFilter === period ? 'bg-white text-blue-600 shadow-sm font-black' : 'text-gray-400 font-bold'}`}
                    >
                      {t(`options.${period}`)}
                    </button>
                  ))}
                </div>

                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all justify-center ${timeFilter === 'custom' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                   <CalendarIcon size={14} className={timeFilter === 'custom' ? 'text-blue-600' : 'text-gray-400'} />
                   <input 
                     type="date" 
                     value={customDate}
                     onChange={(e) => { setCustomDate(e.target.value); setTimeFilter('custom'); }}
                     className="bg-transparent border-none text-[11px] font-black text-gray-700 outline-none p-0 cursor-pointer max-w-[105px]"
                   />
                </div>
              </div>
            </div>

            {/* Statistici cu Scroll Orizontal pe Mobil */}
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:pb-0 mb-8 snap-x scrollbar-none">
              <StatCard label={tCommon('stats.avg_rating')} value={`${smartStats.avg}/5.0`} icon={<Star className="text-yellow-400 fill-yellow-400" size={18} />} />
              <StatCard label={tCommon('stats.hero_day')} value={smartStats.bestEmp} icon={<Trophy className="text-orange-500" size={18} />} />
              <StatCard label={tStats('volume')} value={smartStats.count.toString()} icon={<MessageSquare className="text-blue-600" size={18} />} />
            </div>

            {/* Lista de Recenzii */}
            <div className="space-y-4">
               {loading ? (
                 <div className="py-20 flex flex-col items-center justify-center">
                   <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('loading_db')}</p>
                 </div>
               ) : paginatedReviews.length === 0 ? (
                 <div className="bg-white p-12 md:p-20 rounded-3xl md:rounded-[3rem] text-center border border-dashed border-gray-200 shadow-sm">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t('no_results')}</p>
                 </div>
               ) : (
                 paginatedReviews.map((rev) => (
                   <ReviewCard 
                     key={rev.id} 
                     rev={rev} 
                     locale={locale} 
                     noCommentText={tCommon('feed.no_comment')} 
                     generalTag={t('general_tag')} 
                     onViewPhoto={(url: string) => setActivePhoto(url)} // TIPAT EXPLICIT CU (url: string)
                   />
                 ))
               )}
            </div>

            {/* Paginator Fixat și Optimizat Mobil */}
            {reviews.length > ITEMS_PER_PAGE && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl z-40 flex items-center gap-1 border border-white/10 max-w-[90vw]">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="p-2.5 text-white/50 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest px-4 whitespace-nowrap">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="p-2.5 text-white/50 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pop-up Modul pentru Poza Mărită */}
      {activePhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setActivePhoto(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 bg-slate-950/60 text-white p-2.5 rounded-full hover:bg-slate-950 transition-colors z-10"
            >
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={activePhoto} 
              alt="Review attachment" 
              className="w-full h-auto max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, icon, value, onChange, options, allLabel }: any) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1 rounded-xl border border-gray-100 w-full justify-between sm:justify-start">
      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-tight shrink-0">
        {icon} <span>{label}:</span>
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent border-none text-[11px] font-black text-gray-700 outline-none cursor-pointer py-2 pl-1 pr-7 focus:ring-0 w-full sm:w-auto text-right sm:text-left font-black">
        <option value="all">{allLabel}</option>
        {options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-50 min-w-[220px] sm:min-w-0 sm:w-full snap-center shrink-0">
      <div className="bg-gray-50 w-9 h-9 rounded-xl flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-xl md:text-2xl font-black text-gray-900 truncate">{value}</h3>
    </div>
  );
}

function ReviewCard({ rev, locale, noCommentText, generalTag, onViewPhoto }: any) {
  return (
    <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${rev.rating >= 4 ? 'bg-emerald-500' : rev.rating === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} />
      
      <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100 fill-gray-100"} />
            ))}
          </div>
          
          <p className="text-slate-800 font-bold text-base md:text-lg leading-relaxed italic">
            "{rev.comment || noCommentText}"
          </p>
          
          {rev.photo_url && (
            <div className="pt-2">
              <div 
                onClick={() => onViewPhoto(rev.photo_url)}
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden cursor-pointer border border-gray-200 group/img shadow-sm active:scale-95 transition-transform"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={rev.photo_url} 
                  alt="Client upload" 
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye size={14} />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-2">
            <Tag text={rev.employees?.name || generalTag} icon={<User size={10}/>} />
            <Tag text={rev.locations?.name || 'General'} icon={<MapPin size={10}/>} />
          </div>
        </div>

        <div className="text-left md:text-right min-w-[100px] border-t border-gray-50 pt-3 md:pt-0 md:border-none flex md:flex-col justify-between md:justify-start items-center md:items-end gap-1">
          <div className="md:block">
            <span className="text-[9px] font-black text-gray-300 uppercase block leading-none md:mb-1">{locale === 'ru' ? 'Время' : 'Ora'}</span>
            <span className="text-xs font-black text-gray-700 block">
              {new Date(rev.created_at).toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'ro-RO', {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 md:bg-transparent px-2.5 py-1 md:p-0 rounded-md">
            {new Date(rev.created_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'ro-RO')}
          </span>
        </div>
      </div>
    </div>
  );
}

function Tag({ text, icon }: any) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg text-[9px] font-black text-gray-500 uppercase border border-gray-100 max-w-[180px] truncate">
      <span className="shrink-0 text-gray-400">{icon}</span> 
      <span className="truncate">{text}</span>
    </div>
  );
}