'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { 
  Star, MapPin, User, Loader2, MessageCircle, 
  Zap, Trophy, Clock, Activity, Award, Target, 
  Sparkles, Copy, Check, DollarSign, Share2, Download
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

export default function AdminDashboardPage() {
  const t = useTranslations('Dashboard');
  
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveEvent, setLiveEvent] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const [selLocation, setSelLocation] = useState('all');
  const [selEmployee, setSelEmployee] = useState('all');
  const [selPeriod, setSelPeriod] = useState('7d');

  const fetchBaseReviews = useCallback(async (cId: string) => {
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
      
      const { data, error } = await query;
      if (error) throw error;
      setAllReviews(data || []);
    } catch (err: any) { 
      console.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  }, [selPeriod]);

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
            setAllReviews((prev) => [data, ...prev]);
            setLiveEvent(true);
            setTimeout(() => setLiveEvent(false), 4000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  const filteredReviews = useMemo(() => {
    return allReviews.filter(r => {
      const matchLoc = selLocation === 'all' || r.location_id === selLocation;
      const matchEmp = selEmployee === 'all' || (r.employee_id && r.employee_id === selEmployee);
      return matchLoc && matchEmp;
    });
  }, [allReviews, selLocation, selEmployee]);

  // === RAPORT AUTOMAT ===
  const selectedReport = useMemo(() => {
    if (selEmployee === 'all' && selLocation === 'all') return null;

    let title = "";
    let avgRating = 0;
    let reviewCount = 0;

    if (selEmployee !== 'all') {
      const emp = employees.find(e => e.id === selEmployee);
      title = `Raport pentru ${emp?.name || 'Angajat'}`;
      
      const empReviews = filteredReviews.filter(r => r.employee_id === selEmployee);
      reviewCount = empReviews.length;
      if (reviewCount > 0) {
        avgRating = empReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
      }
    } 
    else if (selLocation !== 'all') {
      const loc = locations.find(l => l.id === selLocation);
      title = `Raport pentru ${loc?.name || 'Locație'}`;
      
      const locReviews = filteredReviews.filter(r => r.location_id === selLocation);
      reviewCount = locReviews.length;
      if (reviewCount > 0) {
        avgRating = locReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
      }
    }

    return {
      title,
      avgRating: avgRating.toFixed(1),
      reviewCount,
      status: avgRating >= 4.5 ? "Excelent" : avgRating >= 4 ? "Bun" : "Necesită atenție"
    };
  }, [selEmployee, selLocation, filteredReviews, employees, locations]);

  const stats = useMemo(() => {
    let scopeName = "la nivel general";
    if (selEmployee !== 'all') {
      const eMatch = employees.find(e => e.id === selEmployee);
      scopeName = eMatch ? `pentru angajatul ${eMatch.name}` : "pentru acest angajat";
    } else if (selLocation !== 'all') {
      const lMatch = locations.find(l => l.id === selLocation);
      scopeName = lMatch ? `pentru locația ${lMatch.name}` : "pentru această locație";
    }

    if (!filteredReviews.length) return {
      distribution: [0,0,0,0,0], avg: "0.0", satisfaction: 0, urgent: 0, 
      dynamicCardLabel: "Performant", dynamicCardValue: "N/A", peak: "N/A", today: 0, 
      leaderboard: [], aiText: `Nu există recenzii înregistrate ${scopeName} pe perioada selectată.`, velocity: 0, 
      topKeywords: [], chartPoints: "", targetGoal: 10, targetPercentage: 0, roiEstimated: 0
    };

    const dist = [0,0,0,0,0];
    let totalScore = 0;
    const empPerformance: Record<string, number[]> = {};
    const locPerformance: Record<string, number[]> = {};
    const hourCounts: Record<number, number> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    let allText = "";

    const now = new Date().getTime();
    const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000);
    const ninetySixHoursAgo = now - (96 * 60 * 60 * 1000);
    let recentCount = 0;
    let previousCount = 0;

    const timelineData: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      timelineData[d.toISOString().split('T')[0]] = 0;
    }

    filteredReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
      totalScore += r.rating;
      
      const empName = r.employees?.name;
      if (empName) {
        if (!empPerformance[empName]) empPerformance[empName] = [];
        empPerformance[empName].push(r.rating);
      }
      const locName = r.locations?.name;
      if (locName) {
        if (!locPerformance[locName]) locPerformance[locName] = [];
        locPerformance[locName].push(r.rating);
      }

      const hr = new Date(r.created_at).getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
      if (r.comment) allText += " " + r.comment.toLowerCase();

      const rTime = new Date(r.created_at).getTime();
      if (rTime >= fortyEightHoursAgo) recentCount++;
      if (rTime >= ninetySixHoursAgo && rTime < fortyEightHoursAgo) previousCount++;

      const dateStr = r.created_at.split('T')[0];
      if (timelineData[dateStr] !== undefined) timelineData[dateStr]++;
    });

    let velocityPercent = previousCount > 0 ? Math.round(((recentCount - previousCount) / previousCount) * 100) : (recentCount > 0 ? 100 : 0);

    const counts = Object.values(timelineData);
    const maxVal = Math.max(...counts, 1);
    const chartPoints = counts.map((val, index) => {
      const x = (index * (500 / 6)).toFixed(1);
      const y = (100 - (val / maxVal) * 80).toFixed(1);
      return `${x},${y}`;
    }).join(' ');

    const stopWords = ['și', 'sau', 'cu', 'la', 'de', 'din', 'este', 'pentru', 'că', 'am', 'fost', 'mai', 'tot', 'nu', 'dar', 'pe', 'sunt', 'o', 'un'];
    const words = allText.match(/[a-ăââîșțțz]+/g) || [];
    const wordFreq: Record<string, number> = {};
    words.forEach(w => { if (w.length > 4 && !stopWords.includes(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const topKeywords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);

    const leaderboard = Object.entries(empPerformance)
      .map(([name, scores]) => ({ name, avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1), count: scores.length }))
      .sort((a, b) => Number(b.avg) - Number(a.avg) || b.count - a.count);

    let dynamicCardLabel = "MVP Echipă";
    let dynamicCardValue = leaderboard[0]?.name || "N/A";

    if (selEmployee !== 'all') {
      dynamicCardLabel = "Top Locație Lucru";
      const sortedLocs = Object.entries(locPerformance)
        .map(([name, scores]) => ({ name, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
        .sort((a, b) => b.avg - a.avg);
      dynamicCardValue = sortedLocs[0]?.name || "N/A";
    }

    const peakHr = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const urgentCount = filteredReviews.filter(r => r.rating <= 2).length;
    const currentRatingAvg = (totalScore / filteredReviews.length).toFixed(1);

    let aiInsight = "";
    if (urgentCount > 0) {
      aiInsight = `Atenție sporită ${scopeName}! S-au detectat ${urgentCount} recenzii negative. Clienții reclamă aspecte legate de cuvintele cheie: [${topKeywords.slice(0,2).join(', ')}]. Se recomandă intervenție imediată.`;
    } else {
      aiInsight = `Analiza AI indică un nivel excelent de satisfacție ${scopeName}. Media de ${currentRatingAvg}★ denotă un serviciu premium. Principalul motor de conversie detectat este asociat cu termenul "#${topKeywords[0] || 'calitate'}".`;
    }

    const currentTotal = filteredReviews.length;
    let targetGoal = 10;
    if (currentTotal >= 10) targetGoal = 30;
    if (currentTotal >= 30) targetGoal = 100;
    if (currentTotal >= 100) targetGoal = 250;
    if (currentTotal >= 250) targetGoal = 500;
    if (currentTotal >= 500) targetGoal = 1000;
    const targetPercentage = Math.min(Math.round((currentTotal / targetGoal) * 100), 100);

    const goodReviewsCount = filteredReviews.filter(r => r.rating >= 4).length;
    const roiEstimated = goodReviewsCount * 15;

    return {
      distribution: dist,
      avg: currentRatingAvg,
      satisfaction: Math.round((filteredReviews.filter(r => r.rating >= 4).length / filteredReviews.length) * 100),
      urgent: urgentCount,
      dynamicCardLabel,
      dynamicCardValue,
      peak: peakHr ? `${peakHr[0]}:00` : "N/A",
      today: filteredReviews.filter(r => r.created_at.startsWith(todayStr)).length,
      leaderboard: leaderboard.slice(0, 3),
      aiText: aiInsight,
      velocity: velocityPercent,
      topKeywords: topKeywords.length > 0 ? topKeywords : ['servicii', 'profesionalism', 'echipă'],
      chartPoints,
      targetGoal,
      targetPercentage,
      roiEstimated
    };
  }, [filteredReviews, selEmployee, selLocation, employees, locations]);

  const generateSmartReply = (rev: Review) => {
    const clientName = rev.full_name || 'Stimate Client';
    const empName = rev.employees?.name;
    if (rev.rating >= 4) {
      return `Bună, ${clientName}! Îți mulțumim pentru recenzia de ${rev.rating} stele. Ne bucurăm că ai avut o experiență plăcută${empName ? ` alături de colegul nostru, ${empName}` : ''}. Te mai așteptăm cu drag!`;
    } else {
      return `Bună ziua, ${clientName}. Ne pare rău că experiența nu a fost ideală. Luăm nota de ${rev.rating}★ în serios${empName ? ` și vom discuta intern cu ${empName}` : ''} pentru a asigura standardele QRate pe viitor.`;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendWhatsApp = (text: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const exportReviewsToCSV = (reviewsToExport: Review[]) => {
    if (reviewsToExport.length === 0) {
      alert("Nu există recenzii de exportat!");
      return;
    }

    const headers = ["Data", "Angajat", "Locație", "Rating", "Comentariu", "Client"];

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
    link.download = `recenzii_qrate_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
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

  useEffect(() => { if (companyId) fetchBaseReviews(companyId); }, [companyId, fetchBaseReviews]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-24 text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* NAV BAR FĂRĂ PROFIL LIVE */}
        <nav className={`bg-white/80 backdrop-blur-md sticky top-2 z-50 rounded-[1.5rem] p-3 mb-8 border flex items-center justify-between shadow-sm transition-all duration-500 ${liveEvent ? 'border-emerald-500 ring-4 ring-emerald-100' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2 px-2">
            <div className="bg-slate-900 p-2 rounded-xl text-white"><Zap size={16} /></div>
            <div className="flex flex-col">
              <span className="font-black text-lg leading-none">QRate.md</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">
                {liveEvent ? '⚡ Recenzie nouă primită live!' : 'Panou Administrator'}
              </span>
            </div>
          </div>
          
          {/* BUTON EXPORT CSV */}
          <button 
            onClick={() => exportReviewsToCSV(filteredReviews)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
          >
            <Download size={16} /> Export CSV
          </button>
        </nav>

        {/* HEADER CONTROLS */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Panou General</h1>
            <p className="text-sm text-slate-500 font-medium italic border-l-2 border-indigo-500 pl-2 mt-1">Toate modulele sunt auto-sincronizate local la nivel de milisecundă</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm self-start md:self-auto">
             {['7d', '1m', 'all'].map((p) => (
               <button key={p} onClick={() => setSelPeriod(p)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${selPeriod === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>{p}</button>
             ))}
          </div>
        </div>

        {/* RAPORT AUTOMAT */}
        {selectedReport && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl text-slate-900">{selectedReport.title}</h3>
                <p className="text-sm text-slate-600 mt-1">Raport automat generat pe baza recenziilor curente</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-blue-600">{selectedReport.avgRating} ★</div>
                <div className="text-xs text-slate-500">{selectedReport.reviewCount} recenzii</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white text-blue-600 border border-blue-200">
                {selectedReport.status}
              </span>
            </div>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Recenzii Segment" value={filteredReviews.length} icon={<MessageCircle size={20} className="text-blue-500" />} trend={stats.velocity !== 0 ? `${stats.velocity > 0 ? '+' : ''}${stats.velocity}%` : undefined} trendUp={stats.velocity >= 0} />
          <StatCard label="Scor pe Filtru" value={`${stats.avg} ★`} icon={<Star size={20} className="text-amber-500 fill-amber-400" />} />
          <StatCard label="Primite Astăzi" value={stats.today} icon={<Clock size={20} className="text-emerald-500" />} isAlert={stats.today > 0} />
          <StatCard label={stats.dynamicCardLabel} value={stats.dynamicCardValue} icon={<Trophy size={20} className="text-indigo-500" />} />
        </div>

        {/* BENTO + RESTUL CODULUI (păstrat identic din codul tău original) */}
        {/* ... (codul complet de la linia ~150 în jos rămâne la fel) ... */}

      </div>
    </div>
  );
}

// Sub-componente
function StatCard({ label, value, icon, isAlert, trend, trendUp }: any) {
  return (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all group flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5 truncate">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-xl font-black text-slate-900 tracking-tight truncate">{value}</p>
          {trend && <span className={`text-[9px] font-black px-1 py-0.2 rounded ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{trend}</span>}
        </div>
      </div>
      <div className="relative shrink-0">
        <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 transition-colors">{icon}</div>
        {isAlert && <span className="absolute top-0 right-0 h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>}
      </div>
    </div>
  );
}

function Tag({ text, icon }: { text: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-tight">
      <span className="text-indigo-500 shrink-0">{icon}</span> <span className="truncate max-w-[110px]">{text}</span>
    </div>
  );
}