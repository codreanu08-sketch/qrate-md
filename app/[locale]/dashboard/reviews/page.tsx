'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

import { 
  MapPin, User, Star, Loader2, Lock, 
  Filter, Calendar as CalendarIcon, MessageSquare,
  Trophy, ChevronLeft, ChevronRight, Download, Zap
} from 'lucide-react';

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
  const router = useRouter();
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';

  // Folosirea hook-ului oficial pentru managementul curat al traducerilor
  const t = useTranslations('AdminReviews');
  const tStats = useTranslations('EmployeeStats.stats');
  const tCommon = useTranslations('Dashboard');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<BasicInfo[]>([]);
  const [employees, setEmployees] = useState<BasicInfo[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

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

  // Calcul inteligent statistici din review-urile totale returnate
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

  // Verificare Securitate Subscripție (Trial 7 zile sau plan Pro)
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

  // Încărcare locații și angajați
  const loadInitialData = useCallback(async (cId: string) => {
    const [locRes, empRes] = await Promise.all([
      supabase.from('locations').select('id, name').eq('company_id', cId).order('name'),
      supabase.from('employees').select('id, name').eq('company_id', cId).order('name')
    ]);
    setLocations(locRes.data || []);
    setEmployees(empRes.data || []);
  }, []);

  // Încărcare Recenzii cu filtre aplicate direct la nivel de bază de date
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

  // Logica de descărcare raport CSV
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

  // Resetare pagină la modificarea filtrelor
  useEffect(() => { setCurrentPage(1); }, [selectedLocation, selectedEmployee, timeFilter, customDate]);

  // Segmentare array recenzii pentru paginația curentă
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return reviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [reviews, currentPage]);

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE) || 1;

  if (hasAccess === null) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        {!hasAccess ? (
           <div className="h-[80vh] flex items-center justify-center text-center">
             <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 max-w-md">
               <Lock className="text-red-500 mx-auto mb-8" size={48} />
               <h2 className="text-4xl font-black mb-4 tracking-tight">Premium Only</h2>
               <p className="text-gray-500 mb-10 font-medium">
                 {locale === 'ru' ? 'Обновите план для доступа к этой панели.' : 'Upgrade pentru a vedea analizele smart.'}
               </p>
               <button onClick={() => router.push(`/${locale}/pricing`)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs transition-transform active:scale-95">
                 Upgrade Now
               </button>
             </div>
           </div>
        ) : (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between py-10 gap-6">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                  <Zap className="text-blue-600 fill-blue-600" /> {t('title')}
                </h1>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{t('subtitle')}</p>
              </div>
              <button 
                onClick={handleExportCSV} 
                disabled={reviews.length === 0}
                className="bg-white border border-gray-200 px-6 py-3 rounded-2xl font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Download size={20} /> {t('export_btn')}
              </button>
            </header>

            <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-100 mb-10 flex flex-wrap items-center gap-4">
               <FilterGroup label={t('labels.location')} icon={<MapPin size={14}/>} value={selectedLocation} onChange={setSelectedLocation} options={locations} allLabel={t('options.all_locs')} />
               <FilterGroup label={t('labels.employee')} icon={<User size={14}/>} value={selectedEmployee} onChange={setSelectedEmployee} options={employees} allLabel={t('options.all_emps')} />
               
               <div className="flex bg-gray-50 p-1 rounded-2xl">
                 {['7d', '1m', '3m', 'all'].map((period) => (
                   <button 
                    key={period} 
                    onClick={() => { setTimeFilter(period as any); setCustomDate(''); }} 
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                   >
                     {t(`options.${period}`)}
                   </button>
                 ))}
               </div>

               <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${timeFilter === 'custom' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                  <CalendarIcon size={14} className={timeFilter === 'custom' ? 'text-blue-600' : 'text-gray-400'} />
                  <input 
                    type="date" 
                    value={customDate}
                    onChange={(e) => { setCustomDate(e.target.value); setTimeFilter('custom'); }}
                    className="bg-transparent border-none text-[11px] font-black text-gray-700 outline-none p-0 cursor-pointer"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <StatCard label={tCommon('stats.avg_rating')} value={`${smartStats.avg}/5.0`} icon={<Star className="text-yellow-400 fill-yellow-400" />} />
              <StatCard label={tCommon('stats.hero_day')} value={smartStats.bestEmp} icon={<Trophy className="text-orange-500" />} />
              <StatCard label={tStats('volume')} value={smartStats.count.toString()} icon={<MessageSquare className="text-blue-600" />} />
            </div>

            <div className="space-y-4">
               {loading ? (
                 <div className="py-20 flex flex-col items-center">
                   <Loader2 className="animate-spin text-blue-600 mb-4" />
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('loading_db')}</p>
                 </div>
               ) : paginatedReviews.length === 0 ? (
                 <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t('no_results')}</p>
                 </div>
               ) : (
                 paginatedReviews.map((rev) => (
                   <ReviewCard key={rev.id} rev={rev} locale={locale} noCommentText={tCommon('feed.no_comment')} generalTag={t('general_tag')} />
                 ))
               )}
            </div>

            {/* Paginator Funcțional Activ */}
            {reviews.length > ITEMS_PER_PAGE && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl p-2 rounded-[2rem] shadow-2xl z-50 flex items-center gap-4 border border-white/10">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-3 text-white/50 hover:text-white disabled:opacity-20 disabled:hover:text-white/50 transition-colors"
                >
                  <ChevronLeft />
                </button>
                <span className="text-white font-black text-[10px] uppercase tracking-widest px-4 border-x border-white/10">
                  {t('page_label')} {currentPage} / {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-3 text-white/50 hover:text-white disabled:opacity-20 disabled:hover:text-white/50 transition-colors"
                >
                  <ChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, icon, value, onChange, options, allLabel }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-gray-50 px-4 py-1.5 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-tight">
        {icon} <span>{label}:</span>
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent border-none text-[11px] font-black text-gray-700 outline-none cursor-pointer py-1.5 pr-8 focus:ring-0">
        <option value="all">{allLabel}</option>
        {options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100">
      <div className="bg-gray-50 w-10 h-10 rounded-xl flex items-center justify-center mb-5">{icon}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-gray-900 truncate">{value}</h3>
    </div>
  );
}

function ReviewCard({ rev, locale, noCommentText, generalTag }: any) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${rev.rating >= 4 ? 'bg-emerald-500' : rev.rating === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} />
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (<Star key={i} size={12} className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100"} />))}
          </div>
          <p className="text-slate-800 font-bold text-lg leading-relaxed italic mb-6">"{rev.comment || noCommentText}"</p>
          <div className="flex flex-wrap gap-2">
            <Tag text={rev.employees?.name || generalTag} icon={<User size={10}/>} />
            <Tag text={rev.locations?.name || 'General'} icon={<MapPin size={10}/>} />
          </div>
        </div>
        <div className="text-left md:text-right min-w-[80px]">
          <span className="text-[10px] font-black text-gray-300 uppercase block">{locale === 'ru' ? 'Время' : 'Ora'}</span>
          <span className="text-[11px] font-black text-gray-600 block">
            {new Date(rev.created_at).toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'ro-RO', {hour: '2-digit', minute:'2-digit'})}
          </span>
          <span className="text-[9px] font-bold text-gray-400 block">
            {new Date(rev.created_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'ro-RO')}
          </span>
        </div>
      </div>
    </div>
  );
}

function Tag({ text, icon }: any) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-[9px] font-black text-gray-500 uppercase border border-gray-100">
      {icon} {text}
    </div>
  );
}