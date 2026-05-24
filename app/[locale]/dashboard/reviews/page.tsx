'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

import { 
  MapPin, User, Star, Loader2, Lock, 
  Calendar as CalendarIcon, MessageSquare, Phone,
  Trophy, ChevronLeft, ChevronRight, Download, Zap, X, Eye,
  Bot, Copy, Check, Smartphone
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  location_id: string;
  employee_id?: string | null;
  photo_url?: string | null;
  full_name?: string | null;   
  phone?: string | null;       
  locations?: { name: string } | null;
  employees?: { name: string; position: string; photo_url: string } | null;
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

  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '1m' | '3m' | 'custom'>('7d');
  const [customDate, setCustomDate] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // === GENERARE RĂSPUNS SMART ===
  const generateSmartReply = (rev: Review) => {
    const clientName = rev.full_name || (locale === 'ru' ? 'Клиент' : 'Client');
    const empName = rev.employees?.name;

    if (rev.rating >= 4) {
      return `${locale === 'ru' ? 'Здравствуйте' : 'Bună ziua'}, ${clientName}! ${locale === 'ru' ? 'Спасибо за оценку' : 'Vă mulțumim pentru evaluarea de'} ${rev.rating} ${locale === 'ru' ? 'звёзд' : 'stele'}${empName ? ` ${locale === 'ru' ? 'с нашим сотрудником' : 'cu colegul nostru'} (${empName})` : ''}! ${locale === 'ru' ? 'Ждём вас снова!' : 'Vă așteptăm din nou!'}`;
    } else {
      return `${locale === 'ru' ? 'Здравствуйте' : 'Bună ziua'}, ${clientName}, ${locale === 'ru' ? 'нам жаль, что вы поставили' : 'ne pare rău că ați acordat'} ${rev.rating}★. ${locale === 'ru' ? 'Мы принимаем это близко к сердцу' : 'Luăm acest lucru foarte în serios'}${empName ? ` ${locale === 'ru' ? 'и обсудим с сотрудником' : 'și vom discuta cu angajatul'}` : ''}. ${locale === 'ru' ? 'Спасибо за отзыв!' : 'Vă mulțumim pentru feedback!'}`;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const sendToWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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
      .select(`
        id, 
        rating, 
        comment, 
        created_at, 
        location_id, 
        employee_id, 
        photo_url, 
        full_name, 
        phone,
        locations ( name ),
        employees ( name, position, photo_url )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (selectedLocation !== 'all') query = query.eq('location_id', selectedLocation);
    if (selectedEmployee !== 'all') query = query.eq('employee_id', selectedEmployee);

    if (timeFilter === 'custom' && customDate) {
      query = query.gte('created_at', `${customDate}T00:00:00Z`).lte('created_at', `${customDate}T23:59:59Z`);
    } else if (timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === '7d') now.setDate(now.getDate() - 7);
      else if (timeFilter === '1m') now.setMonth(now.getMonth() - 1);
      else if (timeFilter === '3m') now.setMonth(now.getMonth() - 3);
      query = query.gte('created_at', now.toISOString());
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("❌ EROARE SUPABASE REVIEWS:", error);
    } else {
      console.log("✅ RECENZII ÎNCĂRCATE:", data?.length || 0);
    }

    setReviews((data as unknown as Review[]) || []);
    setLoading(false);
  }, [selectedLocation, selectedEmployee, hasAccess, companyId, timeFilter, customDate]);

  const handleExportCSV = () => {
    if (reviews.length === 0) return;
    
    const headers = ['Data', 'Rating', 'Client', 'Telefon', 'Comentariu', 'Locatie', 'Angajat'];
    const rows = reviews.map(r => [
      new Date(r.created_at).toLocaleDateString(),
      r.rating,
      `"${r.full_name || 'Anonim'}"`,
      `"${r.phone || 'N/A'}"`,
      `"${r.comment?.replace(/"/g, '""') || ''}"`,
      r.locations?.name || 'General',
      r.employees?.name || 'Fără angajat'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {!hasAccess ? (
           <div className="min-h-[70vh] flex items-center justify-center text-center p-4">
             <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-md w-full">
               <Lock className="text-red-500 mx-auto mb-6" size={40} />
               <h2 className="text-3xl font-black mb-3 tracking-tight">Premium Only</h2>
               <p className="text-gray-500 mb-8 font-medium text-sm">
                 {locale === 'ru' ? 'Обновите план для доступа к этой панели.' : 'Upgrade pentru a vedea analizele smart.'}
               </p>
               <button onClick={() => router.push(`/${locale}/pricing`)} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-transform active:scale-95">
                 Upgrade Now
               </button>
             </div>
           </div>
        ) : (
          <>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between py-8 md:py-10 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <Zap className="text-blue-600 fill-blue-600 shrink-0" size={28} /> {t('title')}
                </h1>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{t('subtitle')}</p>
              </div>
              <button 
                onClick={handleExportCSV} 
                disabled={reviews.length === 0}
                className="w-full sm:w-auto bg-white border border-gray-200 px-6 py-3.5 rounded-2xl font-black text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm text-xs uppercase tracking-wider"
              >
                <Download size={16} /> {t('export_btn')}
              </button>
            </header>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <FilterGroup label={t('labels.location')} icon={<MapPin size={15}/>} value={selectedLocation} onChange={setSelectedLocation} options={locations} allLabel={t('options.all_locs')} />
                <FilterGroup label={t('labels.employee')} icon={<User size={15}/>} value={selectedEmployee} onChange={setSelectedEmployee} options={employees} allLabel={t('options.all_emps')} />
                
                <div className="flex flex-col gap-2 w-full">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">{locale === 'ru' ? 'Период' : 'Perioada'}</span>
                  <div className="grid grid-cols-4 gap-1.5 w-full bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 h-12 items-center">
                    {['7d', '1m', '3m', 'all'].map((period) => (
                      <button 
                        key={period} 
                        onClick={() => { setTimeFilter(period as any); setCustomDate(''); }} 
                        className={`h-full rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center text-center px-1.5 whitespace-nowrap ${timeFilter === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {t(`options.${period}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">{locale === 'ru' ? 'Календарь' : 'Alege Data'}</span>
                  <div className={`flex items-center gap-2.5 px-3.5 rounded-xl border transition-all h-12 w-full ${timeFilter === 'custom' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200/60'}`}>
                     <CalendarIcon size={15} className={timeFilter === 'custom' ? 'text-blue-600' : 'text-gray-400'} />
                     <input 
                       type="date" 
                       value={customDate}
                       onChange={(e) => { setCustomDate(e.target.value); setTimeFilter('custom'); }}
                       className="bg-transparent border-none text-xs font-black text-gray-700 outline-none p-0 cursor-pointer w-full focus:ring-0"
                     />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label={tCommon('stats.avg_rating')} value={`${smartStats.avg}/5.0`} icon={<Star className="text-yellow-400 fill-yellow-400" size={18} />} />
              <StatCard label={tCommon('stats.hero_day')} value={smartStats.bestEmp} icon={<Trophy className="text-orange-500" size={18} />} />
              <StatCard label={tStats('volume')} value={smartStats.count.toString()} icon={<MessageSquare className="text-blue-600" size={18} />} />
            </div>

            <div className="space-y-4">
               {loading ? (
                 <div className="py-20 flex flex-col items-center justify-center">
                   <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('loading_db')}</p>
                 </div>
               ) : paginatedReviews.length === 0 ? (
                 <div className="bg-white p-16 rounded-[2rem] text-center border border-dashed border-gray-200 shadow-sm">
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
                     onViewPhoto={(url: string) => setActivePhoto(url)}
                     activeReplyId={activeReplyId}
                     setActiveReplyId={setActiveReplyId}
                     generateSmartReply={generateSmartReply}
                     copyToClipboard={copyToClipboard}
                     sendToWhatsApp={sendToWhatsApp}
                     copiedId={copiedId}
                   />
                 ))
               )}
            </div>

            {reviews.length > ITEMS_PER_PAGE && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl z-40 flex items-center gap-1 border border-white/10">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                  className="p-2.5 text-white/50 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-white font-black text-[10px] uppercase tracking-widest px-4 whitespace-nowrap">
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

      {activePhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setActivePhoto(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 bg-slate-950/60 text-white p-2 rounded-full hover:bg-slate-950 transition-colors z-10"
            >
              <X size={18} />
            </button>
            <img src={activePhoto} alt="Review attachment" className="w-full h-auto max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== COMPONENTE ================== */

function FilterGroup({ label, icon, value, onChange, options, allLabel }: any) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">{label}</span>
      <div className="flex items-center gap-2 bg-gray-50 px-3.5 rounded-xl border border-gray-200/60 h-11 w-full">
        <div className="text-gray-400 shrink-0">{icon}</div>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent border-none text-xs font-black text-gray-700 outline-none cursor-pointer p-0 focus:ring-0 w-full font-black">
          <option value="all">{allLabel}</option>
          {options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="bg-gray-50 w-11 h-11 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <h3 className="text-xl font-black text-gray-900 truncate leading-none">{value}</h3>
      </div>
    </div>
  );
}

function ReviewCard({ rev, locale, noCommentText, generalTag, onViewPhoto, activeReplyId, setActiveReplyId, generateSmartReply, copyToClipboard, sendToWhatsApp, copiedId }: any) {
  const isReplyOpen = activeReplyId === rev.id;
  const smartReplyText = generateSmartReply(rev);

  return (
    <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${rev.rating >= 4 ? 'bg-emerald-500' : rev.rating === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} />
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 space-y-3.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-0.5 shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100 fill-gray-100"} />
              ))}
            </div>
            
            {((rev.full_name && rev.full_name.trim() !== '' && rev.full_name !== 'EMPTY') || (rev.phone && rev.phone.trim() !== '' && rev.phone !== 'EMPTY')) && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                {rev.full_name && rev.full_name.trim() !== '' && rev.full_name !== 'EMPTY' && (
                  <span className="text-slate-900 font-black flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-gray-200/40 uppercase tracking-tight">
                    <User size={11} className="text-slate-500" /> {rev.full_name}
                  </span>
                )}
                {rev.phone && rev.phone.trim() !== '' && rev.phone !== 'EMPTY' && (
                  <a href={`tel:${rev.phone.trim()}`} className="text-slate-700 font-black flex items-center gap-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 px-2.5 py-0.5 rounded-lg border border-gray-200/40 tracking-tight transition-all cursor-pointer">
                    <Phone size={10} className="text-slate-500 group-hover:text-blue-500" /> {rev.phone}
                  </a>
                )}
              </div>
            )}
          </div>
          
          <p className="text-base font-semibold text-slate-700 italic tracking-wide mt-1">
            {rev.comment ? `"${rev.comment}"` : <span className="text-slate-400 font-normal text-sm">{noCommentText}</span>}
          </p>
          
          {rev.photo_url && rev.photo_url.trim() !== '' && rev.photo_url !== 'NULL' && rev.photo_url !== 'EMPTY' && (
            <div className="pt-1">
              <div onClick={() => onViewPhoto(rev.photo_url)} className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden cursor-pointer border border-gray-200 group/img shadow-sm active:scale-95 transition-transform">
                <img src={rev.photo_url} alt="Client upload" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200" />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye size={14} />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Tag text={rev.employees?.name || "Fără angajat"} icon={<User size={10}/>} />
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

      {/* BUTON AI RĂSPUNS */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {isReplyOpen ? (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-700 font-medium mb-3 italic">"{smartReplyText}"</p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => copyToClipboard(smartReplyText, rev.id)}
                className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-colors"
              >
                {copiedId === rev.id ? <><Check size={14} /> {locale === 'ru' ? 'Скопировано!' : 'Copiat!'}</> : <><Copy size={14} /> {locale === 'ru' ? 'Копировать' : 'Copiază'}</>}
              </button>
              
              <button 
                onClick={() => sendToWhatsApp(smartReplyText)}
                className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-colors"
              >
                <Smartphone size={14} /> WhatsApp
              </button>
            </div>
            
            <button onClick={() => setActiveReplyId(null)} className="w-full text-center text-[10px] text-slate-400 mt-3 font-bold hover:text-slate-600">
              {locale === 'ru' ? 'Отмена' : 'Anulează'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setActiveReplyId(rev.id)}
            className="w-full flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black uppercase tracking-wider text-[10px] py-3.5 rounded-xl transition-colors group-hover:bg-indigo-600 group-hover:text-white"
          >
            <Bot size={16} /> {locale === 'ru' ? 'AI Ответ' : 'AI Răspuns'}
          </button>
        )}
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