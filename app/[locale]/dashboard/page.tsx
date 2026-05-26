'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { 
  Star, MapPin, User, MessageCircle, Zap, Trophy, Clock, 
  Award, Download, RefreshCw, Bot, Copy, Check, TrendingUp, 
  AlertTriangle, BrainCircuit, Smartphone, Lock, BarChart3, Building
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  full_name?: string;
  location_id: string;
  employee_id: string;
  employees: { name: string } | null;
  locations: { name: string } | null;
}

export default function AdminDashboardPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const locale = params?.locale || 'ro';
  
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [rawEmployees, setRawEmployees] = useState<any[]>([]);
  const [rawLocations, setRawLocations] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [liveEvent, setLiveEvent] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [limits, setLimits] = useState({ maxLocations: 99, maxEmployees: 99 });
  const [selLocation, setSelLocation] = useState('all');
  const [selEmployee, setSelEmployee] = useState('all');
  const [selPeriod, setSelPeriod] = useState('7d');

  const calculateChurnRisk = () => {
    const negative = allReviews.filter(r => r.rating <= 2).length;
    return allReviews.length > 0 ? ((negative / allReviews.length) * 100).toFixed(0) : 0;
  };

  const getROI = () => allReviews.filter(r => r.rating >= 4).length * 15;

  const fetchBaseReviews = useCallback(async (cId: string) => {
    try {
      let query = supabase.from('reviews')
        .select(`*, employees ( name ), locations ( name )`)
        .eq('company_id', cId)
        .order('created_at', { ascending: false });

      if (selPeriod !== 'all') {
        const days = selPeriod === '7d' ? 7 : (selPeriod === '1m' ? 30 : 90);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        query = query.gte('created_at', cutoff.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setAllReviews(data || []);
    } catch (err: any) { 
      console.error("Eroare la preluarea recenziilor:", err.message); 
    } finally { 
      setLoading(false); 
    }
  }, [selPeriod]);

  const runAudit = async () => {
    if (!companyId) return;
    const { data } = await supabase.from('reviews').select('id').eq('company_id', companyId);
    if (data && data.length !== allReviews.length) {
      await fetchBaseReviews(companyId);
      alert(t('syncSuccess'));
    } else {
      alert(t('syncUpToDate'));
    }
  };

  const generateSmartReply = (rev: Review) => {
    const clientName = rev.full_name || t('anonClient');
    const empName = rev.employees?.name;
    if (rev.rating >= 4) {
      return `${t('replyPositivePrefix')} ${clientName}! ${t('replyPositiveStars')} ${rev.rating} ${t('replyPositiveStarsEnd')}${empName ? ` ${t('replyWithEmp')} (${empName})` : ''}! ${t('replyPositiveSuffix')}`;
    } else {
      return `${t('replyNegativePrefix')} ${clientName}, ${t('replyNegativeSuffix')} ${rev.rating}★ ${t('replyNegativeMiddle')}${empName ? ` ${t('replyNegativeEmp')}` : ''}. ${t('replyNegativeEnd')}`;
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

  const exportReviewsToCSV = (reviewsToExport: Review[]) => {
    if (reviewsToExport.length === 0) {
      alert(t('noReviewsExport'));
      return;
    }
    const headers = [t('csvDate'), t('csvEmp'), t('csvLoc'), t('csvRating'), t('csvComment'), t('csvClient')];
    const csvContent = [
      headers.join(","),
      ...reviewsToExport.map(review => [
        new Date(review.created_at).toLocaleDateString('ro-RO'),
        review.employees?.name || "Necunoscut",
        review.locations?.name || "Necunoscut",
        review.rating,
        `"${(review.comment || "").replace(/"/g, '""')}"`,
        review.full_name || "Anonim"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Raport_QRate_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeLocations = useMemo(() => {
    return rawLocations.slice(0, limits.maxLocations);
  }, [rawLocations, limits.maxLocations]);

  const activeEmployees = useMemo(() => {
    const allowedPool = rawEmployees.slice(0, limits.maxEmployees);
    if (selLocation !== 'all') {
      const employeesWithReviewsInLocation = allReviews
        .filter(r => r.location_id === selLocation && r.employee_id)
        .map(r => r.employee_id);
      return allowedPool.filter(emp => employeesWithReviewsInLocation.includes(emp.id));
    }
    return allowedPool;
  }, [rawEmployees, limits.maxEmployees, selLocation, allReviews]);

  // Realtime
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`realtime:reviews:company:${companyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews', filter: `company_id=eq.${companyId}` },
        async (payload: any) => {
          const { data, error } = await supabase
            .from('reviews')
            .select(`*, employees ( name ), locations ( name )`)
            .eq('id', payload.new.id)
            .single();

          if (data && !error) {
            setAllReviews((prev) => {
              if (prev.some(r => r.id === data.id)) return prev;
              return [data, ...prev];
            });
            setLiveEvent(true);
            setTimeout(() => setLiveEvent(false), 5000);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  // === FUNCȚIE SEPARATĂ PENTRU ÎNCĂRCAREA DATELOR ===
  const loadCompanyData = async (cId: string) => {
    try {
      const [emp, loc] = await Promise.all([
        supabase.from('employees').select('id, name').eq('company_id', cId).order('created_at', { ascending: true }),
        supabase.from('locations').select('id, name').eq('company_id', cId).order('created_at', { ascending: true })
      ]);

      setRawEmployees(emp.data || []);
      setRawLocations(loc.data || []);
    } catch (err) {
      console.error("Eroare la încărcarea datelor companiei:", err);
    }
  };

  // INIȚIALIZARE SECURE TRIAL & COMPANIE
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_ends_at')
        .eq('id', user.id)
        .single();

      let currentTrialEndsAt = profile?.trial_ends_at;

      if (!currentTrialEndsAt) {
        const sapteZileInViitor = new Date();
        sapteZileInViitor.setDate(sapteZileInViitor.getDate() + 7);
        const viitorIso = sapteZileInViitor.toISOString();

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ trial_ends_at: viitorIso })
          .eq('id', user.id);
        
        if (!updateError) {
          currentTrialEndsAt = viitorIso;
        }
      }

      const isPro = profile?.subscription_tier === 'pro';
      const isTrialActive = currentTrialEndsAt 
        ? new Date(currentTrialEndsAt).getTime() > Date.now() 
        : true;

      setHasAccess(isPro || isTrialActive);

      if (isPro) {
        setLimits({ maxLocations: 99, maxEmployees: 99 });
      } else {
        setLimits({ maxLocations: 1, maxEmployees: 4 });
      }

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!company) {
        setCompanyId(null);
        setLoading(false);
        return;
      }

      setCompanyId(company.id);
      await loadCompanyData(company.id);
      setLoading(false);
    }
    init();
  }, [router, locale]);

  useEffect(() => { 
    if (companyId) {
      fetchBaseReviews(companyId); 
    }
  }, [companyId, fetchBaseReviews]);

  // === CREARE COMPANIE - FĂRĂ FLASH ===
  const handleCreateCompanyInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setCreatingCompany(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .insert([{ name: newCompanyName.trim(), owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Setăm companyId
      setCompanyId(data.id);
      
      // Încărcăm imediat datele (angajați + locații)
      await loadCompanyData(data.id);
      
      // Resetăm formularul
      setNewCompanyName('');
      
    } catch (err: any) {
      alert(err.message || "Eroare la crearea companiei");
    } finally {
      setCreatingCompany(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return allReviews.filter(r => {
      const isLocAllowed = activeLocations.some(l => l.id === r.location_id);
      const isEmpAllowed = !r.employee_id || activeEmployees.some(e => e.id === r.employee_id);
      if (!isLocAllowed || !isEmpAllowed) return false;

      const matchLoc = selLocation === 'all' || r.location_id === selLocation;
      const matchEmp = selEmployee === 'all' || (r.employee_id && r.employee_id === selEmployee);
      return matchLoc && matchEmp;
    });
  }, [allReviews, selLocation, selEmployee, activeLocations, activeEmployees]);

  const analytics = useMemo(() => {
    if (!filteredReviews.length) return { 
      avg: "0.0", today: 0, velocity: 0, 
      dynamicCardLabel: t('mvpCardLabel'), dynamicCardValue: "N/A",
      distribution: [ {star: 5, pct: 0, count: 0}, {star: 4, pct: 0, count: 0}, {star: 3, pct: 0, count: 0}, {star: 2, pct: 0, count: 0}, {star: 1, pct: 0, count: 0} ],
      aiInsight: t('aiNoData'),
      topWords: []
    };
    
    let totalScore = 0;
    const empPerformance: Record<string, number[]> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    let recentCount = 0;
    let previousCount = 0;
    let allText = "";

    const now = new Date().getTime();
    const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000);
    const ninetySixHoursAgo = now - (96 * 60 * 60 * 1000);

    const starCounts = { 5:0, 4:0, 3:0, 2:0, 1:0 };

    filteredReviews.forEach(r => {
      totalScore += r.rating;
      if (r.rating >= 1 && r.rating <= 5) starCounts[r.rating as keyof typeof starCounts]++;
      if (r.comment) allText += " " + r.comment.toLowerCase();

      const empName = r.employees?.name;
      if (empName) {
        if (!empPerformance[empName]) empPerformance[empName] = [];
        empPerformance[empName].push(r.rating);
      }
      const rTime = new Date(r.created_at).getTime();
      if (rTime >= fortyEightHoursAgo) recentCount++;
      if (rTime >= ninetySixHoursAgo && rTime < fortyEightHoursAgo) previousCount++;
    });

    const avg = (totalScore / filteredReviews.length).toFixed(1);
    let velocityPercent = previousCount > 0 ? Math.round(((recentCount - previousCount) / previousCount) * 100) : (recentCount > 0 ? 100 : 0);
    
    const leaderboard = Object.entries(empPerformance)
      .map(([name, scores]) => ({ name, avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1), count: scores.length }))
      .sort((a, b) => Number(b.avg) - Number(a.avg) || b.count - a.count);

    const distribution = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: starCounts[star as keyof typeof starCounts],
      pct: Math.round((starCounts[star as keyof typeof starCounts] / filteredReviews.length) * 100)
    }));

    const stopWords = ['și', 'sau', 'cu', 'la', 'de', 'din', 'este', 'pentru', 'că', 'am', 'fost', 'mai', 'tot', 'nu', 'dar', 'pe', 'sunt', 'un', 'o', 'foarte', 'unul', 'care', 'и', 'в', 'vo', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'je', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'быlo', 'вот', 'от', 'меня', 'еще', 'o', 'из', 'еmu', 'теперь', 'когда', 'даeven', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был', 'nego', 'до', 'вас', 'niбудь', 'опять', 'уж', 'там', 'едва', 'какой', 'до', 'одin', 'пока', 'даже'];
    const words = allText.match(/[a-ăâîșțzа-яё]+/g) || [];
    const wordFreq: Record<string, number> = {};
    words.forEach(w => { if (w.length > 3 && !stopWords.includes(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);

    let aiInsight = "";
    const targetName = selEmployee !== 'all' ? activeEmployees.find(e => e.id === selEmployee)?.name : (selLocation !== 'all' ? activeLocations.find(l => l.id === selLocation)?.name : t('aiGeneralLevel'));
    
    if (Number(avg) >= 4.5) {
      aiInsight = `${t('aiExcellentPrefix')} ${targetName}! ${t('aiExcellentMiddle')} "${topWords[0] || t('wordQuality')}" ${t('and')} "${topWords[1] || t('wordGood')}". ${t('aiExcellentSuffix')}`;
    } else if (Number(avg) >= 3.5) {
      aiInsight = `${t('aiModeratePrefix')} ${targetName}. ${t('aiModerateMiddle')} "${topWords[0] || t('wordTime')}".`;
    } else {
      aiInsight = `${t('aiCriticalPrefix')} ${targetName}! ${t('aiCriticalSuffix')}`;
    }

    return { avg, today: filteredReviews.filter(r => r.created_at.startsWith(todayStr)).length, velocity: velocityPercent, dynamicCardLabel: selEmployee !== 'all' ? t('empReviewsLabel') : t('mvpCardLabel'), dynamicCardValue: selEmployee !== 'all' ? filteredReviews.length : (leaderboard[0]?.name || "N/A"), distribution, aiInsight, topWords };
  }, [filteredReviews, selEmployee, selLocation, activeEmployees, activeLocations, t]);

  if (hasAccess === null || (loading && allReviews.length === 0 && companyId)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-24 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {hasAccess === false ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-xl mx-auto my-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl mb-6 inline-block ring-8 ring-amber-50/50">
              <Lock size={40} className="stroke-[2.5]" />
            </div>
            <h1 className="font-black text-2xl md:text-3xl text-slate-900 mb-3 tracking-tight">
              Funcționalitate Premium Limitată
            </h1>
            <p className="text-slate-600 font-medium text-sm mb-8 max-w-md leading-relaxed">
              Accesul la dashboard-ul avansat de analiză, statistici AI în timp real și exportul centralizat al recenziilor este disponibil doar în versiunea **PRO**.
            </p>
            <div className="w-full space-y-3">
              <button 
                onClick={() => router.push(`/${locale}/dashboard/subscription`)} 
                className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
              >
                Upgrade la Planul Pro
              </button>
              <button 
                onClick={() => router.push(`/${locale}/`)} 
                className="w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Înapoi la Pagina Principală
              </button>
            </div>
          </div>
        ) : !companyId ? (
          /* ECRAN ONBOARDING */
          <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white border border-slate-200 p-6 md:p-10 rounded-3xl shadow-xl text-center max-w-lg mx-auto my-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-6 inline-block ring-8 ring-indigo-50/50">
              <Building size={36} className="stroke-[2]" />
            </div>
            <h1 className="font-black text-2xl text-slate-950 mb-2 tracking-tight">
              Configurează Profilul Companiei
            </h1>
            <p className="text-slate-500 font-medium text-sm mb-6 max-w-sm leading-relaxed">
              Pentru a putea accesa panoul de control și a gestiona recenziile, introdu numele companiei sau brandului tău.
            </p>
            <form onSubmit={handleCreateCompanyInline} className="w-full space-y-4">
              <div className="text-left">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 px-1">
                  Numele Companiei
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: My Delivery SRL"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <button 
                type="submit" 
                disabled={creatingCompany}
                className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 active:scale-[0.98] shadow-md"
              >
                {creatingCompany ? 'Se salvează...' : 'Creează Compania'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* NAV BAR */}
            <nav className={`bg-white/90 backdrop-blur-xl sticky top-4 z-50 rounded-2xl p-4 border flex flex-col md:flex-row md:items-center justify-between shadow-sm transition-all duration-500 gap-4 ${liveEvent ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 px-2">
                <div className={`p-2.5 rounded-xl text-white transition-colors duration-300 ${liveEvent ? 'bg-emerald-500 animate-pulse' : 'bg-slate-900'}`}>
                  <Zap size={20} className={liveEvent ? 'animate-bounce' : ''} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl leading-none text-slate-800">QRate.MD Enterprise</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${liveEvent ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {liveEvent ? t('navLiveEvent') : t('navSubTitle')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={runAudit} title={t('syncTooltip')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-all flex items-center justify-center">
                  <RefreshCw size={18}/>
                </button>
                <button onClick={() => exportReviewsToCSV(filteredReviews)} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5">
                  <Download size={16} /> {t('navExportBtn')}
                </button>
              </div>
            </nav>

            {/* HEADER & FILTERS */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">{t('headerTitle')}</h1>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1.5"><TrendingUp size={16} className="text-emerald-500"/> {t('headerROI')}: <strong className="text-slate-700">+{getROI()} MDL</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5"><AlertTriangle size={16} className="text-rose-500"/> {t('headerChurn')}: <strong className="text-slate-700">{calculateChurnRisk()}%</strong></span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <select 
                  className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer" 
                  onChange={(e) => {
                    setSelLocation(e.target.value);
                    setSelEmployee('all');
                  }} 
                  value={selLocation}
                >
                  <option value="all">📍 {t('filterAllLocations')}</option>
                  {activeLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>

                <select 
                  className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer" 
                  onChange={(e) => setSelEmployee(e.target.value)} 
                  value={selEmployee}
                >
                  <option value="all">👥 {t('filterAllEmployees')}</option>
                  {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>

                <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                   {['7d', '1m', '3m', 'all'].map((p) => (
                     <button key={p} onClick={() => setSelPeriod(p)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selPeriod === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                       {p === 'all' ? t('periodAll') : p}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label={t('cardTotalReviews')} value={filteredReviews.length} icon={<MessageCircle size={24} className="text-blue-500" />} trend={analytics.velocity !== 0 ? `${analytics.velocity > 0 ? '+' : ''}${analytics.velocity}%` : undefined} trendUp={analytics.velocity >= 0} />
              <StatCard label={t('cardGlobalScore')} value={`${analytics.avg} ★`} icon={<Star size={24} className="text-amber-500 fill-amber-400" />} />
              <StatCard label={t('cardTodayFeedback')} value={analytics.today} icon={<Clock size={24} className="text-emerald-500" />} isAlert={analytics.today > 0} />
              <StatCard label={analytics.dynamicCardLabel} value={analytics.dynamicCardValue} icon={<Trophy size={24} className="text-indigo-500" />} />
            </div>

            {/* ANALYTICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500"/> {t('chartTitle')}</h3>
                <div className="space-y-4 flex-grow">
                  {analytics.distribution.map((item) => (
                    <div key={item.star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12 text-sm font-bold text-slate-600">
                        {item.star} <Star size={14} className="text-amber-400 fill-amber-400" />
                      </div>
                      <div className="flex-grow h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${item.star >= 4 ? 'bg-emerald-500' : item.star === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${item.pct}%` }}></div>
                      </div>
                      <div className="w-10 text-right text-xs font-bold text-slate-500">{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-800 shadow-lg text-white flex flex-col relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10"><BrainCircuit size={150} /></div>
                <h3 className="text-lg font-black text-indigo-200 mb-4 flex items-center gap-2 z-10"><BrainCircuit size={20}/> {t('aiTitle')}</h3>
                <p className="text-indigo-50 leading-relaxed font-medium text-sm z-10 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm flex-grow">
                  {analytics.aiInsight}
                </p>
                <div className="mt-4 z-10">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 block">{t('aiKeywords')}:</span>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topWords.length > 0 ? analytics.topWords.map(w => (
                      <span key={w} className="bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-lg text-xs font-bold capitalize">{w}</span>
                    )) : <span className="text-xs text-indigo-400">{t('aiNoKeywords')}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* FLUX RECENZII */}
            <div>
              <h2 className="text-2xl font-black mb-6 text-slate-900 flex items-center gap-2">
                {t('feedTitle')} <span className="bg-indigo-100 text-indigo-700 text-xs py-1 px-2.5 rounded-full">{filteredReviews.length}</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">
                          {new Date(rev.created_at).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                      
                      <div className="flex-grow mb-6">
                        <p className={`text-base font-medium leading-relaxed ${rev.comment ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {rev.comment ? `"${rev.comment}"` : t('feedNoComment')}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2.5 py-4 border-t border-slate-100 mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-500"><User size={16} className="text-slate-400" /> {t('feedClient')}</span>
                          <span className="font-bold text-slate-900">{rev.full_name || t('anonClient')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-500"><Award size={16} className="text-indigo-400" /> {t('feedEmp')}</span>
                          <span className="font-semibold text-slate-700">{rev.employees?.name || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-500"><MapPin size={16} className="text-emerald-400" /> {t('feedLoc')}</span>
                          <span className="font-semibold text-slate-700">{rev.locations?.name || '-'}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        {activeReplyId === rev.id ? (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-xs text-slate-700 font-medium mb-3 italic">"{generateSmartReply(rev)}"</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => copyToClipboard(generateSmartReply(rev), rev.id)}
                                className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-colors"
                              >
                                {copiedId === rev.id ? <><Check size={14} /> {t('btnCopied')}</> : <><Copy size={14} /> {t('btnCopy')}</>}
                              </button>
                              <button 
                                onClick={() => sendToWhatsApp(generateSmartReply(rev))}
                                className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-colors"
                              >
                                <Smartphone size={14} /> WhatsApp
                              </button>
                            </div>
                            <button onClick={() => setActiveReplyId(null)} className="w-full text-center text-[10px] text-slate-400 mt-3 font-bold hover:text-slate-600">{t('btnCancel')}</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setActiveReplyId(rev.id)}
                            className="w-full flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black uppercase tracking-wider text-[10px] py-3.5 rounded-xl transition-colors group-hover:bg-indigo-600 group-hover:text-white"
                          >
                            <Bot size={16} /> {t('btnAction')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed text-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-4"><MessageCircle size={32} className="text-slate-300" /></div>
                    <h3 className="text-lg font-black text-slate-700 mb-1">{t('noDataTitle')}</h3>
                    <p className="text-sm text-slate-500 max-w-md">{t('noDataSub')}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isAlert, trend, trendUp }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group flex items-center justify-between relative overflow-hidden">
      <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-150 transition-transform duration-500 pointer-events-none">
        {icon}
      </div>
      <div className="min-w-0 z-10">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-slate-900 tracking-tight truncate">{value}</p>
          {trend && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
      <div className="relative shrink-0 z-10">
        <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-300 border border-slate-100">
          {icon}
        </div>
        {isAlert && <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>}
      </div>
    </div>
  );
}