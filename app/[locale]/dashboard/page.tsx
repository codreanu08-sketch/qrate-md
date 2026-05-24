'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { 
  Star, MapPin, User, MessageCircle, Zap, Trophy, Clock, 
  Award, Download, RefreshCw, Bot, Copy, Check, TrendingUp, 
  AlertTriangle, Send, BarChart3, BrainCircuit, Smartphone
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

  // === FUNCȚII DE BAZĂ ===
  const calculateChurnRisk = () => {
    const negative = allReviews.filter(r => r.rating <= 2).length;
    return allReviews.length > 0 ? ((negative / allReviews.length) * 100).toFixed(0) : 0;
  };

  const getROI = () => allReviews.filter(r => r.rating >= 4).length * 15;

  const runAudit = async () => {
    if (!companyId) return;
    const { data } = await supabase.from('reviews').select('id').eq('company_id', companyId);
    if (data && data.length !== allReviews.length) {
      await fetchBaseReviews(companyId);
      alert("Date sincronizate cu succes!");
    } else {
      alert("Sistemul este la zi. Nu s-au pierdut date.");
    }
  };

  // === RĂSPUNS SMART ===
  const generateSmartReply = (rev: Review) => {
    const clientName = rev.full_name || 'Stimate Client';
    const empName = rev.employees?.name;
    if (rev.rating >= 4) {
      return `Bună, ${clientName}! Îți mulțumim enorm pentru recenzia de ${rev.rating} stele. Ne bucurăm că ai avut o experiență excelentă${empName ? ` alături de echipa noastră (${empName})` : ''}! Te mai așteptăm cu drag.`;
    } else {
      return `Ne cerem scuze, ${clientName}, pentru că nu ne-am ridicat la nivelul așteptărilor. Luăm nota de ${rev.rating}★ foarte în serios și am inițiat deja o verificare internă${empName ? ` privind interacțiunea raportată` : ''}. Am dori să remediem situația.`;
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
    link.download = `Raport_QRate_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // === PRELUARE DATE (FETCH) ===
  const fetchBaseReviews = useCallback(async (cId: string) => {
    setLoading(true);
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
      console.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  }, [selPeriod]);

  // === REALTIME SUPABASE ===
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
            setTimeout(() => setLiveEvent(false), 5000);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  // === FILTRARE LOCALĂ ===
  const filteredReviews = useMemo(() => {
    return allReviews.filter(r => {
      const matchLoc = selLocation === 'all' || r.location_id === selLocation;
      const matchEmp = selEmployee === 'all' || (r.employee_id && r.employee_id === selEmployee);
      return matchLoc && matchEmp;
    });
  }, [allReviews, selLocation, selEmployee]);

  // === STATISTICI AVANSATE & ANALIZĂ AI ===
  const analytics = useMemo(() => {
    if (!filteredReviews.length) return { 
      avg: "0.0", today: 0, velocity: 0, 
      dynamicCardLabel: "Top Performant", dynamicCardValue: "N/A",
      distribution: [ {star: 5, pct: 0, count: 0}, {star: 4, pct: 0, count: 0}, {star: 3, pct: 0, count: 0}, {star: 2, pct: 0, count: 0}, {star: 1, pct: 0, count: 0} ],
      aiInsight: "Nu există suficiente date pentru a genera o analiză.",
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

    // Distribuție stele
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

    // Extragere cuvinte cheie
    const stopWords = ['și', 'sau', 'cu', 'la', 'de', 'din', 'este', 'pentru', 'că', 'am', 'fost', 'mai', 'tot', 'nu', 'dar', 'pe', 'sunt', 'un', 'o', 'foarte', 'unul', 'care'];
    const words = allText.match(/[a-ăâîșțz]+/g) || [];
    const wordFreq: Record<string, number> = {};
    words.forEach(w => { if (w.length > 3 && !stopWords.includes(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);

    // AI Insight Generator
    let aiInsight = "";
    const targetName = selEmployee !== 'all' ? employees.find(e => e.id === selEmployee)?.name : (selLocation !== 'all' ? locations.find(l => l.id === selLocation)?.name : "nivel general");
    
    if (Number(avg) >= 4.5) {
      aiInsight = `Performanță excelentă la ${targetName}! Clienții apreciază în mod constant serviciile, folosind cuvinte precum "${topWords[0] || 'calitate'}" și "${topWords[1] || 'bun'}". Mențineți standardele actuale.`;
    } else if (Number(avg) >= 3.5) {
      aiInsight = `Performanță moderată la ${targetName}. Majoritatea feedback-urilor sunt pozitive, dar există loc de îmbunătățire. Fii atent la recenziile ce conțin termenul "${topWords[0] || 'timp'}".`;
    } else {
      aiInsight = `Atenție necesară la ${targetName}! Scorul mediu indică nemulțumiri frecvente din partea clienților. Se recomandă o evaluare imediată a procedurilor interne.`;
    }

    return { avg, today: filteredReviews.filter(r => r.created_at.startsWith(todayStr)).length, velocity: velocityPercent, dynamicCardLabel: selEmployee !== 'all' ? "Recenzii Angajat" : "MVP Echipă", dynamicCardValue: selEmployee !== 'all' ? filteredReviews.length : (leaderboard[0]?.name || "N/A"), distribution, aiInsight, topWords };
  }, [filteredReviews, selEmployee, selLocation, employees, locations]);

  // === INITIALIZARE (Aflare Companie) ===
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-24 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* NAV BAR */}
        <nav className={`bg-white/90 backdrop-blur-xl sticky top-4 z-50 rounded-2xl p-4 border flex flex-col md:flex-row md:items-center justify-between shadow-sm transition-all duration-500 gap-4 ${liveEvent ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 px-2">
            <div className={`p-2.5 rounded-xl text-white transition-colors duration-300 ${liveEvent ? 'bg-emerald-500 animate-pulse' : 'bg-slate-900'}`}>
              <Zap size={20} className={liveEvent ? 'animate-bounce' : ''} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl leading-none text-slate-800">QRate.MD Enterprise</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${liveEvent ? 'text-emerald-600' : 'text-slate-400'}`}>
                {liveEvent ? '🔥 O recenzie nouă tocmai a intrat!' : 'Panou de Control Avansat'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={runAudit} title="Sincronizare Bază Date" className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-all flex items-center justify-center">
              <RefreshCw size={18}/>
            </button>
            <button onClick={() => exportReviewsToCSV(filteredReviews)} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </nav>

        {/* HEADER & FILTERS */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Performanță Afacere</h1>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><TrendingUp size={16} className="text-emerald-500"/> ROI Estimat: <strong className="text-slate-700">+{getROI()} MDL</strong></span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5"><AlertTriangle size={16} className="text-rose-500"/> Risc Churn: <strong className="text-slate-700">{calculateChurnRisk()}%</strong></span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <select className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer" onChange={(e) => setSelLocation(e.target.value)} value={selLocation}>
              <option value="all">📍 Toate Locațiile</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer" onChange={(e) => setSelEmployee(e.target.value)} value={selEmployee}>
              <option value="all">👥 Toți Angajații</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
               {['7d', '1m', '3m', 'all'].map((p) => (
                 <button key={p} onClick={() => setSelPeriod(p)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selPeriod === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                   {p === 'all' ? 'Tot' : p}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Recenzii Totale" value={filteredReviews.length} icon={<MessageCircle size={24} className="text-blue-500" />} trend={analytics.velocity !== 0 ? `${analytics.velocity > 0 ? '+' : ''}${analytics.velocity}%` : undefined} trendUp={analytics.velocity >= 0} />
          <StatCard label="Scor Global" value={`${analytics.avg} ★`} icon={<Star size={24} className="text-amber-500 fill-amber-400" />} />
          <StatCard label="Feedback Astăzi" value={analytics.today} icon={<Clock size={24} className="text-emerald-500" />} isAlert={analytics.today > 0} />
          <StatCard label={analytics.dynamicCardLabel} value={analytics.dynamicCardValue} icon={<Trophy size={24} className="text-indigo-500" />} />
        </div>

        {/* SECTION: ENTERPRISE ANALYTICS (GRAFICE + AI) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* GRAFIC DISTRIBUȚIE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-indigo-500"/> Distribuția Calității (Grafic)</h3>
            <div className="space-y-4 flex-grow">
              {analytics.distribution.map((item) => (
                <div key={item.star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 text-sm font-bold text-slate-600">
                    {item.star} <Star size={14} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-grow h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${item.star >= 4 ? 'bg-emerald-500' : item.star === 3 ? 'bg-amber-400' : 'bg-rose-500'}`}
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                  <div className="w-10 text-right text-xs font-bold text-slate-500">{item.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI INSIGHTS */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-800 shadow-lg text-white flex flex-col relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10"><BrainCircuit size={150} /></div>
            <h3 className="text-lg font-black text-indigo-200 mb-4 flex items-center gap-2 z-10"><BrainCircuit size={20}/> Raport de Analiză AI</h3>
            <p className="text-indigo-50 leading-relaxed font-medium text-sm z-10 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm flex-grow">
              {analytics.aiInsight}
            </p>
            <div className="mt-4 z-10">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 block">Cuvinte Cheie Frecvente:</span>
              <div className="flex flex-wrap gap-2">
                {analytics.topWords.length > 0 ? analytics.topWords.map(w => (
                  <span key={w} className="bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-lg text-xs font-bold capitalize">{w}</span>
                )) : <span className="text-xs text-indigo-400">Nu există suficiente date textuale.</span>}
              </div>
            </div>
          </div>
        </div>

        {/* FLUX RECENZII (GRID MODERN) */}
        <div>
          <h2 className="text-2xl font-black mb-6 text-slate-900 flex items-center gap-2">
            Centralizator Feedback <span className="bg-indigo-100 text-indigo-700 text-xs py-1 px-2.5 rounded-full">{filteredReviews.length}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((rev) => (
                <div key={rev.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden">
                  
                  {/* Rating & Date */}
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
                  
                  {/* Comment */}
                  <div className="flex-grow mb-6">
                    <p className={`text-base font-medium leading-relaxed ${rev.comment ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                      {rev.comment ? `"${rev.comment}"` : "Clientul a acordat nota fără un comentariu detaliat."}
                    </p>
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col gap-2.5 py-4 border-t border-slate-100 mb-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500"><User size={16} className="text-slate-400" /> Client</span>
                      <span className="font-bold text-slate-900">{rev.full_name || 'Anonim'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500"><Award size={16} className="text-indigo-400" /> Angajat</span>
                      <span className="font-semibold text-slate-700">{rev.employees?.name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500"><MapPin size={16} className="text-emerald-400" /> Locație</span>
                      <span className="font-semibold text-slate-700">{rev.locations?.name || '-'}</span>
                    </div>
                  </div>

                  {/* Smart Reply & WhatsApp Actions */}
                  <div className="mt-auto">
                    {activeReplyId === rev.id ? (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-xs text-slate-700 font-medium mb-3 italic">"{generateSmartReply(rev)}"</p>
                        
                        <div className="flex gap-2">
                          {/* BUTON COPY */}
                          <button 
                            onClick={() => copyToClipboard(generateSmartReply(rev), rev.id)}
                            className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-colors"
                          >
                            {copiedId === rev.id ? <><Check size={14} /> Copiat</> : <><Copy size={14} /> Copiază</>}
                          </button>
                          
                          {/* BUTON WHATSAPP INTEGRAT */}
                          <button 
                            onClick={() => sendToWhatsApp(generateSmartReply(rev))}
                            className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-colors"
                          >
                            <Smartphone size={14} /> WhatsApp
                          </button>
                        </div>
                        
                        <button onClick={() => setActiveReplyId(null)} className="w-full text-center text-[10px] text-slate-400 mt-3 font-bold hover:text-slate-600">Anulează</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setActiveReplyId(rev.id)}
                        className="w-full flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black uppercase tracking-wider text-[10px] py-3.5 rounded-xl transition-colors group-hover:bg-indigo-600 group-hover:text-white"
                      >
                        <Bot size={16} /> Acționează / Răspunde
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed text-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4"><MessageCircle size={32} className="text-slate-300" /></div>
                <h3 className="text-lg font-black text-slate-700 mb-1">Fără date în acest interval</h3>
                <p className="text-sm text-slate-500 max-w-md">Modifică filtrele de locație, angajat sau perioada de timp pentru a vizualiza analizele.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-componentă pentru Cartonașele de Statistici
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