'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import Script from 'next/script';
import { 
  Star, MapPin, User, Loader2, MessageCircle, 
  Zap, Trophy, Clock, Activity, Globe, AlertTriangle, CheckCircle2, 
  TrendingUp, Award, Target, Sparkles, Copy, Check
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

  // Filtre UI
  const [selLocation, setSelLocation] = useState('all');
  const [selEmployee, setSelEmployee] = useState('all');
  const [selPeriod, setSelPeriod] = useState('7d');

  const handleOpenLiveProfile = useCallback(() => {
    if (!companyId) return;
    window.open(`https://qrate.md/p/${companyId}`, '_blank', 'noopener,noreferrer');
  }, [companyId]);

  // --- 1. FETCH BAZĂ (DOAR DUPĂ PERIOADĂ PENTRU VITEZĂ MAXIMĂ) ---
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

  // --- 2. REALTIME CHANNEL (CONECTAT LA TOATĂ COMPANIA) ---
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`realtime:reviews:company:${companyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews', filter: `company_id=eq.${companyId}` },
        async (payload) => {
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

  // --- 3. FILTRARE LOCALĂ INSTANTANEE (0ms) ---
  const filteredReviews = useMemo(() => {
    return allReviews.filter(r => {
      const matchLoc = selLocation === 'all' || r.location_id === selLocation;
      const matchEmp = selEmployee === 'all' || r.employee_id === selEmployee;
      return matchLoc && matchEmp;
    });
  }, [allReviews, selLocation, selEmployee]);

  // --- 4. ENGINE DE STATISTICI COMPLET SINCRONIZAT ---
  const stats = useMemo(() => {
    if (!filteredReviews.length) return {
      distribution: [0,0,0,0,0], avg: "0.0", satisfaction: 0, urgent: 0, 
      dynamicCardLabel: "Performant", dynamicCardValue: "N/A", peak: "N/A", today: 0, 
      leaderboard: [], aiText: "Nu există recenzii pentru filtrele selectate.", velocity: 0, 
      topKeywords: [], chartPoints: ""
    };

    const dist = [0,0,0,0,0];
    let totalScore = 0;
    const empPerformance: Record<string, number[]> = {};
    const locPerformance: Record<string, number[]> = {};
    const hourCounts: Record<number, number> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    let allText = "";

    // REPUTATION VELOCITY TIME-FRAME
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
      
      if (r.employees?.name) {
        if (!empPerformance[r.employees.name]) empPerformance[r.employees.name] = [];
        empPerformance[r.employees.name].push(r.rating);
      }
      if (r.locations?.name) {
        if (!locPerformance[r.locations.name]) locPerformance[r.locations.name] = [];
        locPerformance[r.locations.name].push(r.rating);
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

    // Calcul Viteză
    let velocityPercent = previousCount > 0 ? Math.round(((recentCount - previousCount) / previousCount) * 100) : (recentCount > 0 ? 100 : 0);

    // Coordonate SVG Area Chart
    const counts = Object.values(timelineData);
    const maxVal = Math.max(...counts, 1);
    const chartPoints = counts.map((val, index) => {
      const x = (index * (500 / 6)).toFixed(1);
      const y = (100 - (val / maxVal) * 80).toFixed(1);
      return `${x},${y}`;
    }).join(' ');

    // Cuvinte cheie automate
    const stopWords = ['și', 'sau', 'cu', 'la', 'de', 'din', 'este', 'pentru', 'că', 'am', 'fost', 'mai', 'tot', 'nu', 'dar', 'pe', 'sunt'];
    const words = allText.match(/[a-ăââîșțțz]+/g) || [];
    const wordFreq: Record<string, number> = {};
    words.forEach(w => { if (w.length > 4 && !stopWords.includes(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const topKeywords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);

    // Clasament Angajați
    const leaderboard = Object.entries(empPerformance)
      .map(([name, scores]) => ({ name, avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1), count: scores.length }))
      .sort((a, b) => Number(b.avg) - Number(a.avg) || b.count - a.count);

    // SINCRONIZARE INTELIGENTĂ CARD 4 (MVP Angajat vs Top Locație)
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

    let aiInsight = urgentCount > 0 
      ? `Atenție sporită! Sunt identificate ${urgentCount} recenzii cu rating scăzut pe filtrele curente. Se recomandă măsuri rapide.`
      : `Segment stabil. Media curentă este de ${(totalScore / filteredReviews.length).toFixed(1)}★. Clienții apreciază calitatea serviciilor oferite.`;

    return {
      distribution: dist,
      avg: (totalScore / filteredReviews.length).toFixed(1),
      satisfaction: Math.round((filteredReviews.filter(r => r.rating >= 4).length / filteredReviews.length) * 100),
      urgent: urgentCount,
      dynamicCardLabel,
      dynamicCardValue,
      peak: peakHr ? `${peakHr[0]}:00` : "N/A",
      today: filteredReviews.filter(r => r.created_at.startsWith(todayStr)).length,
      leaderboard: leaderboard.slice(0, 3),
      aiText: aiInsight,
      velocity: velocityPercent,
      topKeywords: topKeywords.length > 0 ? topKeywords : ['servicii', 'profesionalism', 'echipă', 'promptitudine'],
      chartPoints
    };
  }, [filteredReviews, selEmployee]);

  // --- 5. REPLIES GENERATOR LOCAL ---
  const generateSmartReply = (rev: Review) => {
    const clientName = rev.full_name || 'Stimate Client';
    const empName = rev.employees?.name;
    if (rev.rating >= 4) {
      return `Bună, ${clientName}! Îți mulțumim pentru recenzia de ${rev.rating} stele. Ne bucurăm că ai avut o experiență plăcută${empName ? ` alături de ${empName}` : ''}. O zi excelentă!`;
    } else {
      return `Bună ziua, ${clientName}. Ne pare rău că experiența nu a fost perfectă. Luăm nota de ${rev.rating}★ în serios${empName ? ` și vom discuta cu ${empName}` : ''} pentru a îmbunătăți serviciul.`;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- INITIALIZARE CONTEXT ---
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
        
        {/* NAV BAR */}
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
          <button onClick={handleOpenLiveProfile} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">
            <Globe size={14} /> <span>Profil Live</span>
          </button>
        </nav>

        {/* CONTROALE FILTRARE REZOLVATE */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Panou General</h1>
            <p className="text-sm text-slate-500 font-medium italic border-l-2 border-indigo-500 pl-2 mt-1">Toate datele sunt actualizate instantaneu la filtrare</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm self-start md:self-auto">
             {['7d', '1m', 'all'].map((p) => (
               <button key={p} onClick={() => setSelPeriod(p)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${selPeriod === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>{p}</button>
             ))}
          </div>
        </div>

        {/* CELE 4 CARDURI COMPLET SINCRONIZATE ACUM LOCAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Recenzii Filtrate" value={filteredReviews.length} icon={<MessageCircle size={20} className="text-blue-500" />} trend={stats.velocity !== 0 ? `${stats.velocity > 0 ? '+' : ''}${stats.velocity}%` : undefined} trendUp={stats.velocity >= 0} />
          <StatCard label="Rating pe Filtru" value={`${stats.avg} ★`} icon={<Star size={20} className="text-amber-500 fill-amber-400" />} />
          <StatCard label="Recenzii Noi Azi" value={stats.today} icon={<Clock size={20} className="text-emerald-500" />} isAlert={stats.today > 0} />
          <StatCard label={stats.dynamicCardLabel} value={stats.dynamicCardValue} icon={<Trophy size={20} className="text-indigo-500" />} />
        </div>

        {/* BENTO ZONE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* AI REPORT BOX */}
          <div className={`lg:col-span-2 rounded-[3rem] p-6 md:p-10 relative overflow-hidden flex flex-col justify-between shadow-lg ${stats.urgent > 0 ? 'bg-red-600' : 'bg-slate-900'} text-white`}>
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80 block mb-4">QRate AI Intel-Report</span>
              <h2 className="text-xl md:text-2xl font-bold mb-6 leading-snug">{stats.aiText}</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] flex-1">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Satisfacție Brand</p>
                <p className="text-3xl font-black">{stats.satisfaction}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] flex-1">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Vârf Activitate</p>
                <p className="text-xl font-black mt-1">Ora {stats.peak}</p>
              </div>
            </div>
          </div>

          {/* DISTRIBUȚIE ȘI LEADERBOARD */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-4">Grafic Distribuție Scor</h3>
              <div className="flex items-end justify-between gap-2 h-20 pb-2 border-b border-slate-50">
                {stats.distribution.map((count, i) => {
                  const height = filteredReviews.length > 0 ? (count / filteredReviews.length) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex-1 flex flex-col justify-end">
                        <div style={{ height: `${height || 5}%` }} className={`w-full rounded-t-md transition-all duration-700 ${i >= 3 ? 'bg-emerald-500' : i === 2 ? 'bg-amber-400' : 'bg-red-500'}`} />
                      </div>
                      <span className="text-[9px] font-black text-slate-400">{i + 1}★</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-3 flex items-center gap-1.5"><Award size={12} className="text-indigo-500" /> Top Performeri Activi</h4>
              <div className="space-y-2">
                {stats.leaderboard.map((emp: any, index) => (
                  <div key={emp.name} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 truncate">{index + 1}. {emp.name}</span>
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black">{emp.avg} ★</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* GRAFIC TENDINȚĂ & SCOPURI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Flux Cronologic Recenzii</h3>
                  <p className="text-xs text-slate-500 font-medium">Corelat direct cu filtrele alese</p>
                </div>
                <Activity size={18} className="text-indigo-500" />
              </div>
              <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                {filteredReviews.length > 0 ? (
                  <svg viewBox="0 0 500 100" className="w-full h-24 overflow-visible">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`M 0,100 L ${stats.chartPoints} L 500,100 Z`} fill="url(#g)" />
                    <path d={`M ${stats.chartPoints}`} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs text-slate-400 font-bold">Lipsă date segment filtru</div>
                )}
              </div>
            </div>
            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mt-2"><span>Acum 7 zile</span><span>Azi</span></div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2"><Target size={16} className="text-emerald-500" /><h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">QRate Trusted Pro</h3></div>
              <p className="text-xs text-slate-500 mb-4 font-medium">Nivelul de încredere atins pe baza segmentului curent.</p>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xl font-black text-slate-800">{filteredReviews.length} / 30</span>
                  <span className="text-xs bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded">{Math.min(Math.round((filteredReviews.length / 30) * 100), 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min((filteredReviews.length / 30) * 100, 100)}%` }} className="bg-emerald-500 h-full rounded-full" />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-1">
              {stats.topKeywords.map(w => <span key={w} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">#{w}</span>)}
            </div>
          </div>
        </div>

        {/* FEED SELECȚII CU SCHIMBARE LA CLICK STIL SAAS ENTERPRISE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 mb-6">
            <h3 className="text-xl font-black">Flux Comentarii</h3>
            <div className="flex flex-wrap gap-3">
              <select value={selLocation} onChange={(e) => setSelLocation(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer focus:border-indigo-500 shadow-sm">
                <option value="all">Toate Locațiile</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select value={selEmployee} onChange={(e) => setSelEmployee(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer focus:border-indigo-500 shadow-sm">
                <option value="all">Toți Angajații</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-24 rounded-[3rem] flex flex-col items-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white p-24 rounded-[3rem] text-center border border-dashed text-slate-400 font-bold">Nicio recenzie nu corespunde selecției.</div>
          ) : (
            filteredReviews.map((rev, idx) => (
              <div key={rev.id} className={`bg-white p-6 md:p-8 rounded-[2.5rem] border shadow-sm transition-all group relative overflow-hidden ${idx === 0 && liveEvent ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-slate-100'}`}>
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${rev.rating >= 4 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{rev.rating} ★</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(rev.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long' })}</span>
                      {rev.full_name && <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{rev.full_name}</span>}
                    </div>
                    <p className="text-base font-bold text-slate-800 italic">"{rev.comment || 'Fără comentariu text'}"</p>
                  </div>
                  <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                    <Tag text={rev.employees?.name || 'Echipă'} icon={<User size={12} />} />
                    <Tag text={rev.locations?.name || 'Sediu'} icon={<MapPin size={12} />} />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex flex-col gap-3">
                  <button onClick={() => setActiveReplyId(activeReplyId === rev.id ? null : rev.id)} className="flex items-center gap-1.5 self-start text-[11px] font-black uppercase text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-xl transition-all">
                    <Sparkles size={12} /> {activeReplyId === rev.id ? 'Închide Copilot' : '⚡ Copilot Răspuns Inteligent'}
                  </button>

                  {activeReplyId === rev.id && (
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <p className="text-xs font-medium leading-relaxed flex-1 text-slate-300">{generateSmartReply(rev)}</p>
                      <button onClick={() => copyToClipboard(generateSmartReply(rev), rev.id)} className={`flex items-center gap-1 text-[10px] font-black uppercase px-3 py-2 rounded-xl shrink-0 transition-all ${copiedId === rev.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
                        {copiedId === rev.id ? <Check size={12} /> : <Copy size={12} />} {copiedId === rev.id ? 'Copiat!' : 'Copiază'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

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