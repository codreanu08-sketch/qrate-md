'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { 
  Star, MapPin, User, MessageCircle, Zap, Trophy, Clock, 
  Award, Download, RefreshCw, Bot, Copy, Check, TrendingUp, 
  AlertTriangle, BrainCircuit, Smartphone, Lock, BarChart3, Building,
  TrendingDown, Sparkles, CheckCircle2, Circle, ChevronDown, ChevronUp,
  ExternalLink, Link2
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  full_name?: string;
  location_id: string;
  employee_id: string;
  is_recovery_win?: boolean;
  employees: { name: string } | null;
  locations: { name: string } | null;
}

// ✅ Welcome Card cu checklist
function WelcomeCard({ locale, companyId, onDismiss }: { locale: string; companyId: string; onDismiss: () => void }) {
  const [hasLocations, setHasLocations] = useState(false);
  const [hasEmployees, setHasEmployees] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [hasGoogleUrl, setHasGoogleUrl] = useState(false);
  const [hasReviews, setHasReviews] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const check = async () => {
      const [locRes, empRes, compRes, revRes] = await Promise.all([
        supabase.from('locations').select('id').eq('company_id', companyId).limit(1),
        supabase.from('employees').select('id').eq('company_id', companyId).limit(1),
        supabase.from('companies').select('telegram_chat_id, google_review_url').eq('id', companyId).single(),
        supabase.from('reviews').select('id').eq('company_id', companyId).limit(1),
      ]);
      setHasLocations((locRes.data?.length || 0) > 0);
      setHasEmployees((empRes.data?.length || 0) > 0);
      setHasTelegram(!!compRes.data?.telegram_chat_id);
      setHasGoogleUrl(!!compRes.data?.google_review_url);
      setHasReviews((revRes.data?.length || 0) > 0);
    };
    check();
  }, [companyId]);

  const steps = [
    {
      done: hasLocations,
      label: locale === 'ru' ? 'Adaugă prima locație și generează QR' : 'Adaugă prima locație și generează QR',
      link: `/${locale}/dashboard/locations`,
      linkLabel: locale === 'ru' ? 'Mergi la Locații →' : 'Mergi la Locații →',
    },
    {
      done: hasEmployees,
      label: locale === 'ru' ? 'Adaugă angajații echipei tale' : 'Adaugă angajații echipei tale',
      link: `/${locale}/dashboard/employees`,
      linkLabel: locale === 'ru' ? 'Mergi la Angajați →' : 'Mergi la Angajați →',
    },
    {
      done: hasTelegram,
      label: locale === 'ru' ? 'Setează notificările pe Telegram' : 'Setează notificările pe Telegram',
      link: `/${locale}/dashboard/settings`,
      linkLabel: locale === 'ru' ? 'Mergi la Setări →' : 'Mergi la Setări →',
    },
    {
      done: hasGoogleUrl,
      label: locale === 'ru' ? 'Adaugă link-ul tău Google Reviews' : 'Adaugă link-ul tău Google Reviews (clienții fericiți vor fi redirecționați acolo)',
      link: `/${locale}/dashboard/settings`,
      linkLabel: locale === 'ru' ? 'Adaugă link Google →' : 'Adaugă link Google →',
      highlight: true,
    },
    {
      done: hasReviews,
      label: locale === 'ru' ? 'Primește prima recenzie prin QR' : 'Primește prima recenzie prin QR',
      link: null,
      linkLabel: null,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 md:p-6 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
              {locale === 'ru' ? 'Ghid de start' : 'Ghid de start'}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black leading-tight">
            {locale === 'ru' ? `${completedCount}/${steps.length} pași completați` : `${completedCount}/${steps.length} pași completați`}
          </h2>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden w-48">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2 relative z-10">
          {steps.map((step, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${step.done ? 'bg-white/10' : step.highlight ? 'bg-yellow-400/20 border border-yellow-300/30' : 'bg-white/5'}`}>
              <div className="shrink-0 mt-0.5">
                {step.done
                  ? <CheckCircle2 size={18} className="text-emerald-300" />
                  : <Circle size={18} className={step.highlight ? 'text-yellow-300' : 'text-white/40'} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-snug ${step.done ? 'line-through text-white/50' : 'text-white'}`}>
                  {step.label}
                </p>
                {!step.done && step.link && (
                  <a href={step.link} className={`inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-wider transition-colors ${step.highlight ? 'text-yellow-300 hover:text-yellow-200' : 'text-blue-200 hover:text-white'}`}>
                    {step.linkLabel} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onDismiss} className="mt-3 w-full text-[10px] text-white/40 hover:text-white/70 font-bold uppercase tracking-wider transition-colors relative z-10">
        {locale === 'ru' ? 'Nu mai afișa' : 'Nu mai afișa'}
      </button>
    </div>
  );
}

export default function AdminDashboardPage() {
  // ✅ Fix: useParams() în loc de props
  const params = useParams();
  const locale = (params?.locale as string) || 'ro';
  const t = useTranslations('Dashboard');
  const router = useRouter();
  
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [rawEmployees, setRawEmployees] = useState<any[]>([]);
  const [rawLocations, setRawLocations] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  // ✅ Fix flash: inițializăm ca true, nu null
  const [initializing, setInitializing] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [liveEvent, setLiveEvent] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [limits, setLimits] = useState({ maxLocations: 99, maxEmployees: 99 });
  const [selLocation, setSelLocation] = useState('all');
  const [selEmployee, setSelEmployee] = useState('all');
  const [selPeriod, setSelPeriod] = useState('7d');
  const [showWelcome, setShowWelcome] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const calculateChurnRisk = () => {
    const negative = allReviews.filter(r => r.rating <= 2).length;
    return allReviews.length > 0 ? ((negative / allReviews.length) * 100).toFixed(0) : 0;
  };

  const getROI = () => allReviews.filter(r => r.rating >= 4).length * 15;

  // ✅ Fix: fetchReviews separat de init ca să poată fi apelat la schimbare perioadă
  const fetchReviews = useCallback(async (cId: string, period: string) => {
    setReviewsLoading(true);
    try {
      let query = supabase.from('reviews')
        .select(`*, employees(name), locations(name)`)
        .eq('company_id', cId)
        .order('created_at', { ascending: false });

      if (period !== 'all') {
        const days = period === '7d' ? 7 : period === '1m' ? 30 : 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        query = query.gte('created_at', cutoff.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      setAllReviews(data || []);
    } catch (err: any) {
      console.error("Eroare recenzii:", err.message);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // ✅ Re-fetch la schimbare perioadă
  useEffect(() => {
    if (companyId) fetchReviews(companyId, selPeriod);
  }, [companyId, selPeriod, fetchReviews]);

  const runAudit = async () => {
    if (!companyId) return;
    await fetchReviews(companyId, selPeriod);
    alert(t('syncSuccess'));
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
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const exportReviewsToCSV = (reviewsToExport: Review[]) => {
    if (reviewsToExport.length === 0) { alert(t('noReviewsExport')); return; }
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
    link.href = URL.createObjectURL(blob);
    link.download = `Raport_QRate_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const activeLocations = useMemo(() => rawLocations.slice(0, limits.maxLocations), [rawLocations, limits.maxLocations]);
  const activeEmployees = useMemo(() => {
    const pool = rawEmployees.slice(0, limits.maxEmployees);
    if (selLocation !== 'all') {
      const empIds = allReviews.filter(r => r.location_id === selLocation && r.employee_id).map(r => r.employee_id);
      return pool.filter(e => empIds.includes(e.id));
    }
    return pool;
  }, [rawEmployees, limits.maxEmployees, selLocation, allReviews]);

  // Realtime
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase.channel(`realtime:reviews:${companyId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `company_id=eq.${companyId}` },
        async (payload: any) => {
          const { data, error } = await supabase.from('reviews').select(`*, employees(name), locations(name)`).eq('id', payload.new.id).single();
          if (data && !error) {
            setAllReviews(prev => prev.some(r => r.id === data.id) ? prev : [data, ...prev]);
            setLiveEvent(true);
            setTimeout(() => setLiveEvent(false), 5000);
          }
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  // ✅ Init — fără flash
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push(`/${locale}/login`); return; }

        const { data: profile } = await supabase.from('profiles').select('subscription_tier, trial_ends_at').eq('id', user.id).single();
        let trialEndsAt = profile?.trial_ends_at;

        if (!trialEndsAt) {
          const end = new Date();
          end.setDate(end.getDate() + 7);
          const { error } = await supabase.from('profiles').update({ trial_ends_at: end.toISOString() }).eq('id', user.id);
          if (!error) trialEndsAt = end.toISOString();
        }

        const isPro = profile?.subscription_tier === 'pro';
        const isTrialActive = trialEndsAt ? new Date(trialEndsAt).getTime() > Date.now() : true;
        setHasAccess(isPro || isTrialActive);
        setLimits(isPro ? { maxLocations: 99, maxEmployees: 99 } : { maxLocations: 1, maxEmployees: 4 });

        const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();

        if (company) {
          setCompanyId(company.id);
          const [emp, loc] = await Promise.all([
            supabase.from('employees').select('id, name').eq('company_id', company.id),
            supabase.from('locations').select('id, name').eq('company_id', company.id),
          ]);
          setRawEmployees(emp.data || []);
          setRawLocations(loc.data || []);

          // Arată welcome dacă nu a fost dismiss-at
          const dismissed = localStorage.getItem(`qrate_welcome_${company.id}`);
          if (!dismissed) setShowWelcome(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        // ✅ Setează initializing false doar o dată — fără flash
        setInitializing(false);
      }
    }
    init();
  }, [router, locale]);

  const handleDismissWelcome = () => {
    if (companyId) localStorage.setItem(`qrate_welcome_${companyId}`, '1');
    setShowWelcome(false);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setCreatingCompany(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('companies').insert([{ name: newCompanyName.trim(), owner_id: user.id }]).select().single();
      if (error) throw error;
      setCompanyId(data.id);
      setNewCompanyName('');
      setShowWelcome(true);
    } catch (err: any) { alert(err.message); }
    finally { setCreatingCompany(false); }
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

  const aiPrediction = useMemo(() => {
    if (filteredReviews.length < 5) return null;
    const now = Date.now();
    const weeks = [0,1,2,3].map(i => {
      const start = now - (i+1)*7*86400000;
      const end = now - i*7*86400000;
      const wr = filteredReviews.filter(r => { const t = new Date(r.created_at).getTime(); return t >= start && t < end; });
      return { week: 4-i, avg: wr.length > 0 ? wr.reduce((s,r) => s+r.rating,0)/wr.length : null, count: wr.length };
    }).reverse();
    const valid = weeks.filter(w => w.avg !== null);
    if (valid.length < 2) return null;
    const avgs = valid.map(w => w.avg as number);
    const trend = (avgs[avgs.length-1] - avgs[0]) / avgs.length;
    const lastAvg = avgs[avgs.length-1];
    const predicted = Math.min(5, Math.max(1, lastAvg + trend*4));
    return {
      predicted: predicted.toFixed(1),
      trendDirection: trend > 0.05 ? 'up' : trend < -0.05 ? 'down' : 'stable',
      confidence: Math.min(95, 60 + valid.length*10),
      weeks, lastAvg: lastAvg.toFixed(1),
      trend: (trend*4).toFixed(2)
    };
  }, [filteredReviews]);

  const analytics = useMemo(() => {
    if (!filteredReviews.length) return {
      avg: "0.0", today: 0, velocity: 0,
      dynamicCardLabel: t('mvpCardLabel'), dynamicCardValue: "N/A",
      distribution: [5,4,3,2,1].map(s => ({star:s,pct:0,count:0})),
      aiInsight: t('aiNoData'), topWords: []
    };
    let totalScore = 0;
    const empPerf: Record<string, number[]> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    let recent = 0, previous = 0, allText = "";
    const now = Date.now();
    const h48 = now - 48*3600000, h96 = now - 96*3600000;
    const starCounts: Record<number,number> = {5:0,4:0,3:0,2:0,1:0};
    filteredReviews.forEach(r => {
      totalScore += r.rating;
      if (r.rating >= 1 && r.rating <= 5) starCounts[r.rating]++;
      if (r.comment) allText += " " + r.comment.toLowerCase();
      if (r.employees?.name) { if (!empPerf[r.employees.name]) empPerf[r.employees.name] = []; empPerf[r.employees.name].push(r.rating); }
      const rt = new Date(r.created_at).getTime();
      if (rt >= h48) recent++;
      if (rt >= h96 && rt < h48) previous++;
    });
    const avg = (totalScore/filteredReviews.length).toFixed(1);
    const velocity = previous > 0 ? Math.round(((recent-previous)/previous)*100) : (recent > 0 ? 100 : 0);
    const leaderboard = Object.entries(empPerf).map(([name,scores]) => ({ name, avg: (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1), count: scores.length })).sort((a,b) => Number(b.avg)-Number(a.avg));
    const distribution = [5,4,3,2,1].map(star => ({ star, count: starCounts[star], pct: Math.round((starCounts[star]/filteredReviews.length)*100) }));
    const stopWords = ['și','sau','cu','la','de','din','este','pentru','că','am','fost','mai','tot','nu','dar','pe','sunt','un','o','и','в','не','что','на','я','с','как','а','то'];
    const words = allText.match(/[a-ăâîșțzа-яё]+/g) || [];
    const wf: Record<string,number> = {};
    words.forEach(w => { if (w.length > 3 && !stopWords.includes(w)) wf[w] = (wf[w]||0)+1; });
    const topWords = Object.entries(wf).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([w])=>w);
    let aiInsight = "";
    const target = selEmployee !== 'all' ? activeEmployees.find(e => e.id === selEmployee)?.name : selLocation !== 'all' ? activeLocations.find(l => l.id === selLocation)?.name : t('aiGeneralLevel');
    if (Number(avg) >= 4.5) aiInsight = `${t('aiExcellentPrefix')} ${target}! ${t('aiExcellentMiddle')} "${topWords[0]||t('wordQuality')}". ${t('aiExcellentSuffix')}`;
    else if (Number(avg) >= 3.5) aiInsight = `${t('aiModeratePrefix')} ${target}. ${t('aiModerateMiddle')} "${topWords[0]||t('wordTime')}".`;
    else aiInsight = `${t('aiCriticalPrefix')} ${target}! ${t('aiCriticalSuffix')}`;
    return { avg, today: filteredReviews.filter(r=>r.created_at.startsWith(todayStr)).length, velocity, dynamicCardLabel: selEmployee !== 'all' ? t('empReviewsLabel') : t('mvpCardLabel'), dynamicCardValue: selEmployee !== 'all' ? filteredReviews.length : (leaderboard[0]?.name || "N/A"), distribution, aiInsight, topWords };
  }, [filteredReviews, selEmployee, selLocation, activeEmployees, activeLocations, t]);

  // ✅ Fix flash: spinner mic doar la inițializare, nu full-screen
  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QRate.md</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-24 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ACCES BLOCAT */}
        {!hasAccess && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white border border-slate-200 p-8 rounded-3xl shadow-xl text-center max-w-xl mx-auto my-6">
            <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl mb-6"><Lock size={40} /></div>
            <h1 className="font-black text-2xl text-slate-900 mb-3">Funcționalitate Premium Limitată</h1>
            <p className="text-slate-600 text-sm mb-8">Accesul la dashboard este disponibil doar în versiunea PRO.</p>
            <button onClick={() => router.push(`/${locale}/dashboard/subscription`)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all">Upgrade la Planul Pro</button>
          </div>
        )}

        {/* CREARE COMPANIE */}
        {hasAccess && !companyId && !creatingCompany && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white border border-slate-200 p-6 rounded-3xl shadow-xl text-center max-w-lg mx-auto my-6">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-6"><Building size={36} /></div>
            <h1 className="font-black text-2xl text-slate-950 mb-2">Configurează Profilul Companiei</h1>
            <p className="text-slate-500 text-sm mb-6">Introdu numele companiei sau brandului tău.</p>
            <form onSubmit={handleCreateCompany} className="w-full space-y-4">
              <input type="text" required placeholder="Ex: My Delivery SRL" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
              <button type="submit" disabled={creatingCompany} className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider disabled:opacity-50">
                {creatingCompany ? 'Se salvează...' : 'Creează Compania'}
              </button>
            </form>
          </div>
        )}

        {hasAccess && companyId && (
          <>
            {/* ✅ WELCOME CARD */}
            {showWelcome && (
              <WelcomeCard locale={locale} companyId={companyId} onDismiss={handleDismissWelcome} />
            )}

            {/* NAV BAR */}
            <nav className={`bg-white/90 backdrop-blur-xl sticky top-4 z-50 rounded-2xl p-3 md:p-4 border flex items-center justify-between shadow-sm transition-all duration-500 gap-3 ${liveEvent ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-white transition-colors ${liveEvent ? 'bg-emerald-500 animate-pulse' : 'bg-slate-900'}`}>
                  <Zap size={18} className={liveEvent ? 'animate-bounce' : ''} />
                </div>
                <div>
                  <span className="font-black text-base md:text-xl leading-none text-slate-800 block">QRate.MD</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${liveEvent ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {liveEvent ? t('navLiveEvent') : t('navSubTitle')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={runAudit} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-all">
                  <RefreshCw size={16} className={reviewsLoading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => exportReviewsToCSV(filteredReviews)} className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
                  <Download size={14} /> {t('navExportBtn')}
                </button>
              </div>
            </nav>

            {/* HEADER + FILTRE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{t('headerTitle')}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><TrendingUp size={13} className="text-emerald-500"/> {t('headerROI')}: <strong className="text-slate-700">+{getROI()} MDL</strong></span>
                      <span className="flex items-center gap-1"><AlertTriangle size={13} className="text-rose-500"/> {t('headerChurn')}: <strong className="text-slate-700">{calculateChurnRisk()}%</strong></span>
                    </div>
                  </div>
                  {/* ✅ Toggle filtre pe mobile */}
                  <button onClick={() => setFiltersOpen(!filtersOpen)} className="md:hidden flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600">
                    Filtre {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Filtre — pe desktop mereu vizibile, pe mobile toggle */}
              <div className={`border-t border-slate-100 p-4 md:p-4 ${filtersOpen ? 'block' : 'hidden md:block'}`}>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <select className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none cursor-pointer flex-1 min-w-0"
                    onChange={e => { setSelLocation(e.target.value); setSelEmployee('all'); }} value={selLocation}>
                    <option value="all">📍 {t('filterAllLocations')}</option>
                    {activeLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <select className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none cursor-pointer flex-1 min-w-0"
                    onChange={e => setSelEmployee(e.target.value)} value={selEmployee}>
                    <option value="all">👥 {t('filterAllEmployees')}</option>
                    {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1">
                    {['7d','1m','3m','all'].map(p => (
                      <button key={p} onClick={() => setSelPeriod(p)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selPeriod === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                        {p === 'all' ? t('periodAll') : p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <StatCard label={t('cardTotalReviews')} value={filteredReviews.length} icon={<MessageCircle size={22} className="text-blue-500" />} trend={analytics.velocity !== 0 ? `${analytics.velocity > 0 ? '+' : ''}${analytics.velocity}%` : undefined} trendUp={analytics.velocity >= 0} />
              <StatCard label={t('cardGlobalScore')} value={`${analytics.avg} ★`} icon={<Star size={22} className="text-amber-500 fill-amber-400" />} />
              <StatCard label={t('cardTodayFeedback')} value={analytics.today} icon={<Clock size={22} className="text-emerald-500" />} isAlert={analytics.today > 0} />
              <StatCard label={analytics.dynamicCardLabel} value={analytics.dynamicCardValue} icon={<Trophy size={22} className="text-indigo-500" />} />
            </div>

            {/* AI PREDICTIONS */}
            {aiPrediction && (
              <div className="bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 rounded-3xl border border-violet-700/50 shadow-2xl p-5 md:p-8 text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 opacity-10"><Sparkles size={120} /></div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-white/10 rounded-xl"><Sparkles size={18} className="text-violet-300" /></div>
                  <div>
                    <h3 className="font-black text-base uppercase tracking-tight">AI Predicție — Luna Viitoare</h3>
                    <p className="text-[10px] font-bold text-violet-300 uppercase">Încredere: {aiPrediction.confidence}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center">
                    <p className="text-[10px] font-black text-violet-300 uppercase mb-2">Nota prezisă</p>
                    <p className="text-4xl font-black">★{aiPrediction.predicted}</p>
                    <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-black ${aiPrediction.trendDirection === 'up' ? 'bg-emerald-500/20 text-emerald-300' : aiPrediction.trendDirection === 'down' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/20 text-slate-300'}`}>
                      {aiPrediction.trendDirection === 'up' ? <TrendingUp size={12}/> : aiPrediction.trendDirection === 'down' ? <TrendingDown size={12}/> : '→'}
                      {aiPrediction.trendDirection === 'up' ? 'Pozitiv' : aiPrediction.trendDirection === 'down' ? 'Negativ' : 'Stabil'}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] font-black text-violet-300 uppercase mb-3">Trend 4 săptămâni</p>
                    <div className="flex items-end justify-between gap-1 h-14">
                      {aiPrediction.weeks.map((w, i) => {
                        const h = w.avg ? ((w.avg-1)/4)*100 : 0;
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-full rounded-t-lg bg-violet-400/60" style={{ height: `${Math.max(h, w.avg ? 8 : 2)}%`, minHeight: w.avg ? '8px' : '2px' }} />
                            <span className="text-[8px] font-black text-white">{w.avg ? w.avg.toFixed(1) : '-'}</span>
                          </div>
                        );
                      })}
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full rounded-t-lg bg-violet-300" style={{ height: `${Math.max(((parseFloat(aiPrediction.predicted)-1)/4)*100, 8)}%`, minHeight: '8px' }} />
                        <span className="text-[8px] font-black text-violet-200">Pred.</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] font-black text-violet-300 uppercase mb-2">Recomandare</p>
                    <p className="text-sm font-medium text-violet-100 leading-relaxed">
                      {aiPrediction.trendDirection === 'up'
                        ? `La ritmul actual vei atinge ★${aiPrediction.predicted} luna viitoare!`
                        : aiPrediction.trendDirection === 'down'
                        ? `Tendință negativă. Acționează acum!`
                        : `Rating stabil ★${aiPrediction.lastAvg}. Continuă!`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500"/> {t('chartTitle')}</h3>
                <div className="space-y-3 flex-grow">
                  {analytics.distribution.map((item) => (
                    <div key={item.star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-10 text-sm font-bold text-slate-600">{item.star} <Star size={12} className="text-amber-400 fill-amber-400" /></div>
                      <div className="flex-grow h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.star >= 4 ? 'bg-emerald-500' : item.star === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${item.pct}%` }}></div>
                      </div>
                      <div className="w-8 text-right text-xs font-bold text-slate-500">{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 md:p-6 rounded-3xl border border-indigo-800 shadow-lg text-white flex flex-col relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10"><BrainCircuit size={130} /></div>
                <h3 className="text-base font-black text-indigo-200 mb-4 flex items-center gap-2 z-10"><BrainCircuit size={18}/> {t('aiTitle')}</h3>
                <p className="text-indigo-50 leading-relaxed font-medium text-sm z-10 bg-white/10 p-4 rounded-xl border border-white/10 flex-grow">{analytics.aiInsight}</p>
                <div className="mt-3 z-10">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2 block">{t('aiKeywords')}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.topWords.length > 0 ? analytics.topWords.map(w => (
                      <span key={w} className="bg-indigo-500/30 border border-indigo-400/30 px-2.5 py-0.5 rounded-lg text-xs font-bold capitalize">{w}</span>
                    )) : <span className="text-xs text-indigo-400">{t('aiNoKeywords')}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* FLUX RECENZII */}
            <div>
              <h2 className="text-xl md:text-2xl font-black mb-4 text-slate-900 flex items-center gap-2">
                {t('feedTitle')} <span className="bg-indigo-100 text-indigo-700 text-xs py-1 px-2.5 rounded-full">{filteredReviews.length}</span>
                {reviewsLoading && <RefreshCw size={16} className="animate-spin text-slate-400 ml-1" />}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredReviews.length > 0 ? filteredReviews.map(rev => (
                  <div key={rev.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        {[...Array(5)].map((_,i) => <Star key={i} size={14} className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* ✅ Badge Recovery Win */}
                        {rev.is_recovery_win && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">🏆 Win</span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                          {new Date(rev.created_at).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow mb-4">
                      <p className={`text-sm font-medium leading-relaxed ${rev.comment ? 'text-slate-800 italic' : 'text-slate-400 italic'}`}>
                        {rev.comment ? `"${rev.comment}"` : t('feedNoComment')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 py-3 border-t border-slate-100 mb-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400"><User size={13} className="text-slate-300" /> {t('feedClient')}</span>
                        <span className="font-bold text-slate-800">{rev.full_name || t('anonClient')}</span>
                      </div>
                      {rev.employees?.name && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-400"><Award size={13} className="text-indigo-300" /> {t('feedEmp')}</span>
                          <span className="font-semibold text-slate-700">{rev.employees.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400"><MapPin size={13} className="text-emerald-300" /> {t('feedLoc')}</span>
                        <span className="font-semibold text-slate-700">{rev.locations?.name || '-'}</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      {activeReplyId === rev.id ? (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <p className="text-xs text-slate-700 font-medium mb-3 italic">"{generateSmartReply(rev)}"</p>
                          <div className="flex gap-2">
                            <button onClick={() => copyToClipboard(generateSmartReply(rev), rev.id)}
                              className={`flex-1 flex justify-center items-center gap-1.5 text-[10px] uppercase font-black py-2.5 rounded-xl transition-colors ${copiedId === rev.id ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                              {copiedId === rev.id ? <><Check size={12}/> {t('btnCopied')}</> : <><Copy size={12}/> {t('btnCopy')}</>}
                            </button>
                            <button onClick={() => sendToWhatsApp(generateSmartReply(rev))}
                              className="flex-1 flex justify-center items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] uppercase font-black py-2.5 rounded-xl transition-colors">
                              <Smartphone size={12}/> WhatsApp
                            </button>
                          </div>
                          <button onClick={() => setActiveReplyId(null)} className="w-full text-center text-[10px] text-slate-400 mt-2 font-bold">{t('btnCancel')}</button>
                        </div>
                      ) : (
                        <button onClick={() => setActiveReplyId(rev.id)}
                          className="w-full flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black uppercase tracking-wider text-[10px] py-3 rounded-xl transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          <Bot size={14}/> {t('btnAction')}
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed text-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-4"><MessageCircle size={28} className="text-slate-300" /></div>
                    <h3 className="text-base font-black text-slate-700 mb-1">{t('noDataTitle')}</h3>
                    <p className="text-sm text-slate-500">{t('noDataSub')}</p>
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
    <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group flex items-center justify-between relative overflow-hidden">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-150 transition-transform duration-500 pointer-events-none">{icon}</div>
      <div className="min-w-0 z-10">
        <p className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">{value}</p>
          {trend && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{trend}</span>
          )}
        </div>
      </div>
      <div className="relative shrink-0 z-10">
        <div className="bg-slate-50 p-3 md:p-4 rounded-2xl group-hover:bg-indigo-50 transition-all border border-slate-100">{icon}</div>
        {isAlert && <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>}
      </div>
    </div>
  );
}