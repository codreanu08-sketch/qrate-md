'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Users, MapPin, Star, CreditCard, TrendingUp, AlertTriangle,
  Check, X, Clock, Building2, BarChart3, Activity, DollarSign,
  Trash2, Eye, RefreshCw, Download, Bell, Zap, Search,
  Calendar, Shield, Globe, Phone, Mail, FileText, Award,
  Flame, ArrowUpRight, ChevronRight, User, Target, Sparkles,
  TrendingDown, Heart, Send, Edit3, Hash, Package, MessageCircle
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
type Tab = 'overview'|'companies'|'employees'|'revenue'|'reviews'|'alerts'|'analytics';

// ── Health Score ────────────────────────────────────────────────────
function calcHealth(company: any, reviews: any[], locations: any[], employees: any[]) {
  let score = 0;
  const now = Date.now();
  // Status aktiv = 30 pts
  if (company.is_active !== false) score += 30;
  // Abonament activ = +20
  if (company.is_subscribed && company.subscription_expires_at && new Date(company.subscription_expires_at) > new Date()) score += 20;
  const cRevs = reviews.filter(r => r.company_id === company.id);
  // Recenzii >= 5 = +15
  if (cRevs.length >= 5) score += 15;
  if (cRevs.length >= 20) score += 5;
  // Nota medie >= 4 = +15
  if (cRevs.length > 0) {
    const avg = cRevs.reduce((s, r) => s + (r.rating || 0), 0) / cRevs.length;
    if (avg >= 4) score += 15;
    else if (avg >= 3) score += 7;
  }
  // Locații = +10
  if (locations.filter(l => l.company_id === company.id).length > 0) score += 10;
  // Recenzi recente (7 zile) = +5
  const recent = cRevs.filter(r => now - new Date(r.created_at).getTime() < 7 * 86400000).length;
  if (recent > 0) score += 5;
  return Math.min(score, 100);
}

// ── Status ─────────────────────────────────────────────────────────
function getStatus(company: any) {
  const now = new Date();
  if (company.is_active === false)
    return { label: 'Suspendat', badge: 'red', days: null };
  if (company.is_subscribed && company.subscription_expires_at) {
    const exp = new Date(company.subscription_expires_at);
    if (exp > now) {
      const days = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
      return { label: `Activ · ${days}z`, badge: 'green', days };
    }
    return { label: 'Expirat', badge: 'red', days: 0 };
  }
  if (company.trial_ends_at || company.trial_started_at) {
    const end = company.trial_ends_at
      ? new Date(company.trial_ends_at)
      : new Date(new Date(company.trial_started_at || Date.now()).getTime() + 7 * 86400000);
    if (end > now) {
      const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return { label: `Trial · ${days}z`, badge: 'blue', days };
    }
    return { label: 'Trial Expirat', badge: 'amber', days: 0 };
  }
  return { label: 'Nou', badge: 'slate', days: null };
}

const BADGE: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  blue:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  red:   'bg-red-500/15 text-red-400 border-red-500/25',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

// ── Main Component ──────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [pageViews, setPageViews] = useState<any[]>([]);

  // Modals
  const [payModal, setPayModal] = useState<any>(null);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [noteModal, setNoteModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('500');
  const [planName, setPlanName] = useState('GROW');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [noteText, setNoteText] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [c, l, e, r, p, pv] = await Promise.all([
        supabase.from('companies').select('*').order('created_at', { ascending: false }),
        supabase.from('locations').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('paid_at', { ascending: false }),
        supabase.from('page_views').select('*').order('created_at', { ascending: false }).limit(500),
      ]);
      if (c.data) setCompanies(c.data);
      if (l.data) setLocations(l.data);
      if (e.data) setEmployees(e.data);
      if (r.data) setReviews(r.data);
      if (p.data) setPayments(p.data);
      if (pv.data) setPageViews(pv.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────
  const activate   = async (id: string) => { await supabase.from('companies').update({ is_active: true } as any).eq('id', id); load(); };
  const suspend    = async (id: string) => { await supabase.from('companies').update({ is_active: false } as any).eq('id', id); load(); };
  const stopTrial  = async (id: string) => { await supabase.from('companies').update({ trial_ends_at: new Date(0).toISOString() } as any).eq('id', id); load(); };
  const extTrial   = async (id: string, d = 7) => { await supabase.from('companies').update({ trial_ends_at: new Date(Date.now() + d * 86400000).toISOString(), is_active: true, is_subscribed: false } as any).eq('id', id); load(); };
  const delCo      = async (id: string, name: string) => { if (!confirm(`Ștergi definitiv "${name}"?`)) return; await supabase.from('companies').delete().eq('id', id); load(); };
  const saveNote   = async () => { if (!noteModal) return; await supabase.from('companies').update({ admin_note: noteText } as any).eq('id', noteModal.id); setNoteModal(null); load(); };
  const savePay    = async () => {
    if (!payModal) return;
    const exp = new Date(Date.now() + 30 * 86400000).toISOString();
    const inv = invoiceNo || `QR-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`;
    await supabase.from('companies').update({ is_subscribed: true, subscription_expires_at: exp, is_active: true } as any).eq('id', payModal.id);
    await supabase.from('payments').insert({ company_id: payModal.id, amount: parseFloat(payAmount), invoice_number: inv, plan_name: planName, paid_at: new Date().toISOString() } as any);
    setPayModal(null); setInvoiceNo('');
    load();
  };

  // ── Computed KPIs ────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const now = new Date();
    const active = companies.filter(c => {
      if (!c.is_subscribed || !c.subscription_expires_at) return false;
      return new Date(c.subscription_expires_at) > now;
    });
    const trial = companies.filter(c => {
      if (c.is_subscribed) return false;
      const end = c.trial_ends_at ? new Date(c.trial_ends_at) : c.trial_started_at ? new Date(new Date(c.trial_started_at).getTime() + 7 * 86400000) : null;
      return end && end > now;
    });
    const expiring = [...active, ...trial].filter(c => {
      const endStr = c.subscription_expires_at || c.trial_ends_at;
      if (!endStr) return false;
      const days = (new Date(endStr).getTime() - now.getTime()) / 86400000;
      return days >= 0 && days <= 3;
    });
    const mrr = payments
      .filter(p => { const d = new Date(p.paid_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, p) => s + (p.amount || 0), 0);
    const totalRev = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const todayRevs = reviews.filter(r => {
      const d = new Date(); return r.created_at?.startsWith(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    }).length;
    const avgR = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
    const todayViews = pageViews.filter(p => { const d = new Date(); return p.created_at?.startsWith(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }).length;
    return { total: companies.length, active: active.length, trial: trial.length, expiring: expiring.length, mrr, totalRev, todayRevs, totalRevs: reviews.length, avgR, suspended: companies.filter(c => c.is_active === false).length, todayViews, totalViews: pageViews.length };
  }, [companies, payments, reviews, pageViews]);

  const alerts = useMemo(() => {
    const list: any[] = [];
    companies.forEach(c => {
      const s = getStatus(c);
      if (s.days !== null && s.days <= 3 && s.days >= 0) list.push({ type: 'expiry', co: c.name, msg: `Expiră în ${s.days} zile — ${s.label}`, color: 'amber', id: c.id });
      if (reviews.filter(r => r.company_id === c.id).length === 0) list.push({ type: 'no_rev', co: c.name, msg: 'Zero recenzii colectate', color: 'slate', id: c.id });
      if (c.is_active === false) list.push({ type: 'suspended', co: c.name, msg: 'Cont suspendat', color: 'red', id: c.id });
    });
    return list;
  }, [companies, reviews]);

  const revenueMonths = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => {
      const key = new Date(p.paid_at).toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + (p.amount || 0);
    });
    return Object.entries(map).slice(-6).map(([m, a]) => ({ m, a }));
  }, [payments]);

  // Page views per day (last 7 days)
  const pvByDay = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return { day: d.toLocaleDateString('ro-RO', { weekday: 'short' }), count: pageViews.filter(p => p.created_at?.startsWith(ds)).length, isToday: i === 6 };
    });
  }, [pageViews]);

  const filtered = useMemo(() => companies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.idno?.includes(search) || c.email?.includes(search)
  ), [companies, search]);

  const TABS: { id: Tab; label: string; icon: any; alert?: boolean }[] = [
    { id: 'overview',   label: 'Overview',   icon: <BarChart3 size={14}/> },
    { id: 'companies',  label: 'Companii',   icon: <Building2 size={14}/> },
    { id: 'employees',  label: 'Angajați',   icon: <Users size={14}/> },
    { id: 'revenue',    label: 'Revenue',    icon: <DollarSign size={14}/> },
    { id: 'reviews',    label: 'Recenzii',   icon: <Star size={14}/> },
    { id: 'alerts',     label: `Alerte${alerts.length ? ` (${alerts.length})` : ''}`, icon: <Bell size={14}/>, alert: alerts.length > 0 },
    { id: 'analytics',  label: 'Analytics',  icon: <Globe size={14}/> },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse shadow-xl shadow-blue-500/30"><Zap size={22} className="text-white fill-white"/></div>
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">QRate SuperAdmin · Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white font-sans">

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-[#0d1017]/90 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30"><Zap size={16} className="text-white fill-white"/></div>
            <div>
              <p className="font-black text-sm text-white uppercase tracking-tight leading-none">SuperAdmin · QRate.MD</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">Panou intern · Acces restricționat</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live badge */}
            <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase">
              <span className="flex items-center gap-1"><Building2 size={11} className="text-blue-400"/> {kpi.total} co.</span>
              <span className="flex items-center gap-1"><Check size={11} className="text-emerald-400"/> {kpi.active} activi</span>
              <span className="flex items-center gap-1"><DollarSign size={11} className="text-emerald-400"/> {kpi.mrr.toLocaleString()} MDL MRR</span>
            </div>
            {alerts.length > 0 && (
              <button onClick={() => setTab('alerts')} className="relative flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500/15 transition-all">
                <Bell size={11}/> {alerts.length} alerte
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"/>
              </button>
            )}
            <button onClick={load} className={`p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={14} className="text-slate-400"/>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1400px] mx-auto px-6 flex gap-0.5 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${tab === t.id ? 'text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
              {t.icon} {t.label}
              {t.alert && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"/>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* ══════════════════════════════════════════════ */}
        {/* OVERVIEW                                      */}
        {/* ══════════════════════════════════════════════ */}
        {tab === 'overview' && (<>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3">
            {[
              { l: 'Total Companii',       v: kpi.total,       icon: <Building2 size={18}/>, c: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
              { l: 'Abonamente Active',    v: kpi.active,      icon: <Check size={18}/>,     c: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { l: 'Trial Active',         v: kpi.trial,       icon: <Clock size={18}/>,     c: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20' },
              { l: 'Expiră ≤3 zile',       v: kpi.expiring,    icon: <AlertTriangle size={18}/>, c: kpi.expiring > 0 ? 'text-amber-400' : 'text-slate-500', bg: kpi.expiring > 0 ? 'bg-amber-500/10 border-amber-500/20 animate-pulse' : 'bg-slate-500/10 border-slate-500/20' },
              { l: 'MRR Luna Curentă',     v: `${kpi.mrr.toLocaleString()} MDL`, icon: <TrendingUp size={18}/>, c: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { l: 'Venit Total',          v: `${kpi.totalRev.toLocaleString()} MDL`, icon: <DollarSign size={18}/>, c: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { l: 'Total Recenzii',       v: kpi.totalRevs,   icon: <Star size={18}/>,      c: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
              { l: 'Nota Medie Platformă', v: `${kpi.avgR} ★`, icon: <Award size={18}/>,     c: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map((k, i) => (
              <div key={i} className={`border rounded-2xl p-4 ${k.bg} hover:brightness-110 transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-tight">{k.l}</p>
                  <span className={k.c}>{k.icon}</span>
                </div>
                <p className={`text-2xl font-black ${k.c}`}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart + Recent companies */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Revenue chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-sm uppercase tracking-tight mb-4 flex items-center gap-2 text-slate-300"><BarChart3 size={14} className="text-blue-400"/> Venituri 6 luni (MDL)</h3>
              {revenueMonths.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-slate-600 text-sm font-bold">Nicio plată înregistrată</div>
              ) : (
                <div className="flex items-end justify-between gap-2" style={{ height: 80 }}>
                  {revenueMonths.map((m, i) => {
                    const max = Math.max(...revenueMonths.map(x => x.a), 1);
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[9px] text-slate-500 font-black">{m.a}</span>
                        <div className="w-full bg-blue-500 rounded-t-lg" style={{ height: `${Math.max((m.a / max) * 60, 4)}px` }}/>
                        <span className="text-[9px] text-slate-600 font-bold">{m.m}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Company health leaderboard */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-sm uppercase tracking-tight mb-4 flex items-center gap-2 text-slate-300"><Heart size={14} className="text-rose-400"/> Health Score Companii</h3>
              <div className="space-y-2.5">
                {companies.slice(0, 5).map((c, i) => {
                  const h = calcHealth(c, reviews, locations, employees);
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-600 w-4">{i+1}</span>
                      <span className="text-xs font-black text-white truncate flex-1">{c.name}</span>
                      <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${h >= 70 ? 'bg-emerald-500' : h >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${h}%` }}/>
                      </div>
                      <span className={`text-[10px] font-black w-8 text-right ${h >= 70 ? 'text-emerald-400' : h >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{h}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Latest 5 companies */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase text-slate-300 flex items-center gap-2"><Activity size={14} className="text-blue-400"/> Companii Recente</h3>
              <button onClick={() => setTab('companies')} className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase flex items-center gap-1">Toate <ChevronRight size={11}/></button>
            </div>
            {companies.slice(0, 5).map(c => {
              const s = getStatus(c);
              const h = calcHealth(c, reviews, locations, employees);
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${h >= 70 ? 'bg-emerald-500/20 text-emerald-400' : h >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>{h}</div>
                    <div>
                      <p className="font-black text-sm text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-600">{reviews.filter(r=>r.company_id===c.id).length} recenzii · {locations.filter(l=>l.company_id===c.id).length} locații</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${BADGE[s.badge]}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </>)}

        {/* ══════════════════════════════════════════════ */}
        {/* COMPANII                                      */}
        {/* ══════════════════════════════════════════════ */}
        {tab === 'companies' && (<>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută companie / IDNO / email..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-blue-500 transition-all"/>
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase">{filtered.length} / {companies.length} companii</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    {['Companie', 'Status', 'Health', 'Date', 'Statistici', 'Notă', 'Acțiuni'].map(h => (
                      <th key={h} className="p-3.5 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(c => {
                    const s = getStatus(c);
                    const h = calcHealth(c, reviews, locations, employees);
                    const cRevs = reviews.filter(r => r.company_id === c.id);
                    const avg = cRevs.length > 0 ? (cRevs.reduce((a,r) => a+(r.rating||0),0)/cRevs.length).toFixed(1) : '—';
                    return (
                      <tr key={c.id} className="hover:bg-white/4 transition-all">
                        <td className="p-3.5">
                          <p className="font-black text-white text-sm">{c.name}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{c.idno || '—'}</p>
                          <p className="text-[10px] text-slate-600">{c.email || '—'}</p>
                          <p className="text-[10px] text-slate-700 font-mono">{new Date(c.created_at).toLocaleDateString('ro-RO')}</p>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-xl border whitespace-nowrap ${BADGE[s.badge]}`}>{s.label}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${h>=70?'bg-emerald-500':h>=40?'bg-amber-500':'bg-rose-500'}`} style={{width:`${h}%`}}/>
                            </div>
                            <span className={`text-[10px] font-black ${h>=70?'text-emerald-400':h>=40?'text-amber-400':'text-rose-400'}`}>{h}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-[10px] text-slate-500 space-y-0.5">
                          <p>📍 {locations.filter(l=>l.company_id===c.id).length} locații</p>
                          <p>👥 {employees.filter(e=>e.company_id===c.id).length} angajați</p>
                        </td>
                        <td className="p-3.5 text-[10px] space-y-0.5">
                          <p className="text-slate-500">⭐ {cRevs.length} recenzii</p>
                          <p className="text-amber-400 font-black">{avg} ★</p>
                        </td>
                        <td className="p-3.5 max-w-[120px]">
                          {c.admin_note ? (
                            <p className="text-[10px] text-slate-400 italic truncate">{c.admin_note}</p>
                          ) : (
                            <span className="text-[10px] text-slate-700">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {c.is_active === false
                              ? <button onClick={() => activate(c.id)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black">Activează</button>
                              : <button onClick={() => suspend(c.id)} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black">Suspendă</button>}
                            <button onClick={() => extTrial(c.id, 7)} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black whitespace-nowrap">+7z</button>
                            <button onClick={() => extTrial(c.id, 30)} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black whitespace-nowrap">+30z</button>
                            <button onClick={() => stopTrial(c.id)} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-[10px] font-black">Stop</button>
                            <button onClick={() => setPayModal(c)} className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black">💰</button>
                            <button onClick={() => { setNoteModal(c); setNoteText(c.admin_note || ''); }} className="p-1 bg-white/10 hover:bg-white/20 text-slate-400 rounded-lg"><Edit3 size={11}/></button>
                            <button onClick={() => setDetailModal(c)} className="p-1 bg-white/10 hover:bg-white/20 text-slate-400 rounded-lg"><Eye size={11}/></button>
                            <button onClick={() => delCo(c.id, c.name)} className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={11}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ══════════════════════════════════════════════ */}
        {/* ANGAJAȚI                                      */}
        {/* ══════════════════════════════════════════════ */}
        {tab === 'employees' && (<>
          <div className="grid grid-cols-3 gap-4 mb-2">
            {[
              { l: 'Total Angajați', v: employees.length, c: 'text-blue-400' },
              { l: 'Cu QR generat', v: employees.filter(e => e.qr_code_url).length, c: 'text-emerald-400' },
              { l: 'Fără locație', v: employees.filter(e => !e.location_id).length, c: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{s.l}</p>
                <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    {['Angajat', 'Companie', 'Locație', 'Funcție', 'Recenzii', 'Nota Medie'].map(h => (
                      <th key={h} className="p-3 text-left text-[10px] font-black text-slate-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map(e => {
                    const eRevs = reviews.filter(r => r.employee_id === e.id);
                    const avg = eRevs.length > 0 ? (eRevs.reduce((s, r) => s + (r.rating || 0), 0) / eRevs.length).toFixed(1) : '—';
                    const loc = locations.find(l => l.id === e.location_id);
                    const co = companies.find(c => c.id === e.company_id);
                    return (
                      <tr key={e.id} className="hover:bg-white/4 transition-all">
                        <td className="p-3 font-black text-white">{e.name || '—'}</td>
                        <td className="p-3 text-slate-400 font-bold">{co?.name || '—'}</td>
                        <td className="p-3 text-slate-500">{loc?.name || 'Mobilă'}</td>
                        <td className="p-3 text-slate-500">{e.position || '—'}</td>
                        <td className="p-3 text-blue-400 font-black">{eRevs.length}</td>
                        <td className="p-3 font-black text-amber-400">{avg}{eRevs.length > 0 ? ' ★' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ══════════════════════════════════════════════ */}
        {/* REVENUE                                       */}
        {/* ══════════════════════════════════════════════ */}
        {tab === 'revenue' && (<>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { l: 'MRR Luna Curentă', v: `${kpi.mrr.toLocaleString()} MDL`, icon: <TrendingUp size={20}/>, c: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/10' },
              { l: 'Venit Total Cumulat', v: `${kpi.totalRev.toLocaleString()} MDL`, icon: <DollarSign size={20}/>, c: 'text-blue-400', bg: 'border-blue-500/20 bg-blue-500/10' },
              { l: 'Total Tranzacții', v: payments.length, icon: <CreditCard size={20}/>, c: 'text-violet-400', bg: 'border-violet-500/20 bg-violet-500/10' },
            ].map((s, i) => (
              <div key={i} className={`border rounded-2xl p-5 ${s.bg}`}>
                <div className="flex items-center justify-between mb-2"><p className="text-[10px] font-black text-slate-500 uppercase">{s.l}</p><span className={s.c}>{s.icon}</span></div>
                <p className={`text-3xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Pending payments */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10"><h3 className="font-black text-sm uppercase text-slate-300 flex items-center gap-2"><AlertTriangle size={13} className="text-amber-400"/> Companii fără plată activă</h3></div>
            <div className="divide-y divide-white/5">
              {companies.filter(c => { const s = getStatus(c); return ['amber','red','slate'].includes(s.badge); }).length === 0
                ? <div className="p-6 text-center text-slate-600 font-bold text-sm">✅ Toate companiile au status activ</div>
                : companies.filter(c => { const s = getStatus(c); return ['amber','red','slate'].includes(s.badge); }).map(c => {
                  const s = getStatus(c);
                  return (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/4">
                      <div>
                        <p className="font-black text-white text-sm">{c.name}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${BADGE[s.badge]}`}>{s.label}</span>
                      </div>
                      <button onClick={() => setPayModal(c)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
                        <DollarSign size={11}/> Încasează
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Payment history */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10"><h3 className="font-black text-sm uppercase text-slate-300 flex items-center gap-2"><FileText size={13} className="text-blue-400"/> Istoric Plăți</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/10">
                  {['Factură','Companie','Plan','Sumă','Data'].map(h => <th key={h} className="p-3 text-left text-[10px] font-black text-slate-600 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((p, i) => (
                    <tr key={i} className="hover:bg-white/4">
                      <td className="p-3 font-mono font-black text-blue-400">{p.invoice_number}</td>
                      <td className="p-3 font-bold text-white">{companies.find(c => c.id === p.company_id)?.name || '—'}</td>
                      <td className="p-3"><span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black">{p.plan_name || '—'}</span></td>
                      <td className="p-3 font-black text-emerald-400">{p.amount} MDL</td>
                      <td className="p-3 text-slate-500 font-mono">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('ro-RO') : '—'}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-600 font-bold">Nicio plată înregistrată</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ══════════════════════════════════════════════ */}
        {/* RECENZII                                      */}
        {/* ══════════════════════════════════════════════ */}
        {tab === 'reviews' && (<>
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: 'Total', v: reviews.length, c: 'text-blue-400' },
              { l: 'Nota medie', v: `${kpi.avgR} ★`, c: 'text-amber-400' },
              { l: 'Astăzi', v: kpi.todayRevs, c: 'text-emerald-400' },
            ].map((s, i) => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">{s.l}</p><p className={`text-2xl font-black ${s.c}`}>{s.v}</p></div>)}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {reviews.slice(0, 100).map(r => (
                <div key={r.id} className={`flex gap-4 p-4 hover:bg-white/4 border-l-2 ${r.rating<=2?'border-rose-500':r.rating>=4?'border-emerald-500':'border-amber-500'}`}>
                  <div className="shrink-0 w-12 text-center">
                    <div className="flex justify-center gap-0.5 flex-wrap mb-1">
                      {[1,2,3,4,5].map(i=><Star key={i} size={10} className={i<=r.rating?'text-amber-400 fill-amber-400':'text-slate-700'}/>)}
                    </div>
                    <p className="text-[9px] text-slate-700 font-mono leading-tight">{r.created_at?new Date(r.created_at).toLocaleDateString('ro-RO'):'—'}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 italic leading-snug">"{r.comment||'Fără comentariu'}"</p>
                    <p className="text-[10px] text-slate-600 mt-1">🏢 {companies.find(c=>c.id===r.company_id)?.name||'—'} · 👤 {r.full_name||'Anonim'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ══════════════════════════════════════════════ */}
        {/* ALERTS                                        */}
        {/* ══════════════════════════════════════════════ */}
        {tab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-10 text-center">
                <p className="text-emerald-400 font-black text-xl">✅ Zero alerte!</p>
                <p className="text-slate-500 text-sm mt-2">Totul e în ordine pe platformă.</p>
              </div>
            ) : alerts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${a.color==='red'?'bg-red-500/10 border-red-500/20':a.color==='amber'?'bg-amber-500/10 border-amber-500/20':'bg-slate-500/10 border-slate-500/20'}`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle size={15} className={a.color==='red'?'text-red-400':a.color==='amber'?'text-amber-400':'text-slate-500'}/>
                  <div>
                    <p className="font-black text-sm text-white">{a.co}</p>
                    <p className={`text-[10px] font-bold ${a.color==='red'?'text-red-400':a.color==='amber'?'text-amber-400':'text-slate-500'}`}>{a.msg}</p>
                  </div>
                </div>
                {a.type === 'expiry' && (
                  <button onClick={() => { const c = companies.find(x => x.id === a.id); if(c) setPayModal(c); }} className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1.5 rounded-xl uppercase hover:bg-emerald-500">Încasează</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ANALYTICS                                     */}
        {/* ══════════════════════════════════════════════ */}
        {tab === 'analytics' && (<>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: 'Vizite azi', v: kpi.todayViews, c: 'text-blue-400', icon: <Activity size={16}/> },
              { l: 'Vizite totale (DB)', v: kpi.totalViews, c: 'text-indigo-400', icon: <Globe size={16}/> },
              { l: 'Companii active', v: kpi.active, c: 'text-emerald-400', icon: <Building2 size={16}/> },
              { l: 'Reviews astăzi', v: kpi.todayRevs, c: 'text-amber-400', icon: <Star size={16}/> },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-500">{s.icon}<span className="text-[10px] font-black uppercase">{s.l}</span></div>
                <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Page views chart */}
          {pvByDay.some(d => d.count > 0) ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-sm uppercase text-slate-300 mb-4 flex items-center gap-2"><Activity size={13} className="text-blue-400"/> Vizite qrate.md — ultimele 7 zile</h3>
              <div className="flex items-end justify-between gap-2 h-20">
                {pvByDay.map((d, i) => {
                  const max = Math.max(...pvByDay.map(x => x.count), 1);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      {d.count > 0 && <span className="text-[9px] font-black text-slate-500">{d.count}</span>}
                      <div className={`w-full rounded-t-xl ${d.isToday ? 'bg-blue-500' : 'bg-blue-500/40'}`} style={{ height: `${Math.max((d.count/Math.max(...pvByDay.map(x=>x.count),1))*60, d.count>0?6:2)}px` }}/>
                      <span className={`text-[9px] font-black uppercase ${d.isToday ? 'text-blue-400' : 'text-slate-600'}`}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-xl shrink-0"><Globe size={20} className="text-indigo-400"/></div>
                <div className="flex-1">
                  <h3 className="font-black text-base text-white uppercase tracking-tight mb-2">Activează tracking vizite pe qrate.md</h3>
                  <p className="text-slate-400 text-sm mb-4">Adaugă tabelul în Supabase, apoi datele vor apărea automat aici.</p>
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-emerald-400 mb-4">
                    <p className="text-slate-500 mb-1">-- Rulează în Supabase → SQL Editor:</p>
                    <p>CREATE TABLE IF NOT EXISTS page_views (</p>
                    <p className="pl-4">id UUID DEFAULT gen_random_uuid() PRIMARY KEY,</p>
                    <p className="pl-4">page TEXT,</p>
                    <p className="pl-4">referrer TEXT,</p>
                    <p className="pl-4">user_agent TEXT,</p>
                    <p className="pl-4">created_at TIMESTAMPTZ DEFAULT NOW()</p>
                    <p>);</p>
                    <p className="mt-2 text-slate-500">-- Adaugă în app/api/track/route.ts un POST endpoint</p>
                    <p className="text-slate-500">-- Și în layout.tsx un useEffect care apelează /api/track</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      'Creează tabelul page_views în Supabase (SQL de mai sus)',
                      'Creează app/api/track/route.ts — inserează un rând la fiecare vizită',
                      'Adaugă în app/[locale]/layout.tsx un fetch la /api/track cu pagina curentă',
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl text-xs">
                        <span className="w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0">{i+1}</span>
                        <span className="text-slate-300">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recenzii per companie */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="font-black text-sm uppercase text-slate-300 mb-4 flex items-center gap-2"><BarChart3 size={13} className="text-blue-400"/> Recenzii per companie (top 10)</h3>
            <div className="space-y-2.5">
              {companies.map(c => ({ name: c.name, count: reviews.filter(r=>r.company_id===c.id).length }))
                .sort((a,b)=>b.count-a.count).slice(0,10).map((c,i) => {
                  const max = Math.max(...companies.map(x=>reviews.filter(r=>r.company_id===x.id).length),1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-600 w-4">{i+1}</span>
                      <span className="text-xs font-black text-white truncate w-32 shrink-0">{c.name}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width:`${(c.count/max)*100}%`}}/>
                      </div>
                      <span className="text-[10px] font-black text-blue-400 w-8 text-right">{c.count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </>)}

      </div>

      {/* ═══ MODAL PLATĂ ═══════════════════════════════ */}
      {payModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-white flex items-center gap-2"><DollarSign size={16} className="text-emerald-400"/> Înregistrare Plată</h3>
              <button onClick={() => setPayModal(null)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={13} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10"><p className="text-[10px] text-slate-500 font-black uppercase">Companie</p><p className="font-black text-white">{payModal.name}</p></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Sumă (MDL)</label>
                <input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xl outline-none focus:border-blue-500"/>
              </div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Plan</label>
                <select value={planName} onChange={e=>setPlanName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500">
                  {['START','GROW','SCALE','PRO','PRO+','ENTERPRISE'].map(p=><option key={p} value={p} className="bg-slate-900">{p}</option>)}
                </select>
              </div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Nr. Factură (auto dacă gol)</label>
                <input type="text" placeholder={`QR-${new Date().getFullYear()}-${String(payments.length+1).padStart(4,'0')}`} value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500 placeholder:text-slate-700"/>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 font-bold">✅ Se adaugă automat 30 zile abonament activ</div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 py-3 rounded-2xl font-black text-xs uppercase">Anulează</button>
              <button onClick={savePay} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20">Confirmă & Activează</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL FIȘĂ ════════════════════════════════ */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-white flex items-center gap-2"><FileText size={15} className="text-blue-400"/> Fișă Companie</h3>
              <button onClick={() => setDetailModal(null)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={13} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                { l: 'Denumire', v: detailModal.name },
                { l: 'IDNO', v: detailModal.idno || '—', mono: true },
                { l: 'IBAN', v: detailModal.iban || '—', mono: true },
                { l: 'Email', v: detailModal.email || '—' },
                { l: 'Telegram Chat ID', v: detailModal.telegram_chat_id || '—', mono: true },
                { l: 'Adresă juridică', v: detailModal.legal_address || '—' },
                { l: 'Înregistrat la', v: new Date(detailModal.created_at).toLocaleString('ro-RO') },
                { l: 'Recenzii totale', v: reviews.filter(r=>r.company_id===detailModal.id).length },
                { l: 'Locații', v: locations.filter(l=>l.company_id===detailModal.id).length },
                { l: 'Angajați', v: employees.filter(e=>e.company_id===detailModal.id).length },
                { l: 'Health Score', v: calcHealth(detailModal, reviews, locations, employees) + '/100' },
                { l: 'Notă Admin', v: detailModal.admin_note || '—' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-black text-slate-600 uppercase">{row.l}</span>
                  <span className={`text-sm font-black text-white ${row.mono ? 'font-mono text-blue-400 text-xs' : ''}`}>{String(row.v)}</span>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-white/10">
              <button onClick={() => setDetailModal(null)} className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-2xl font-black text-xs uppercase">Închide</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL NOTĂ ════════════════════════════════ */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-white flex items-center gap-2"><Edit3 size={15} className="text-violet-400"/> Notă Admin — {noteModal.name}</h3>
              <button onClick={() => setNoteModal(null)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><X size={13} className="text-slate-400"/></button>
            </div>
            <div className="p-5">
              <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={4} placeholder="Notițe interne despre această companie..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-violet-500 resize-none placeholder:text-slate-700"/>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setNoteModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 py-3 rounded-2xl font-black text-xs uppercase">Anulează</button>
              <button onClick={saveNote} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-2xl font-black text-xs uppercase">Salvează Nota</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}