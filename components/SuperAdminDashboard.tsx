'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Users, MapPin, Star, CreditCard, TrendingUp, AlertTriangle,
  Check, X, Clock, Building2, BarChart3, Activity, DollarSign,
  Trash2, Eye, RefreshCw, Bell, Zap, Search, Globe, FileText,
  Award, Heart, ChevronRight, Edit3, Download, Send,
  TrendingDown, Shield, Calendar, Phone, Mail, Hash
} from 'lucide-react';

type Tab = 'overview'|'companies'|'employees'|'revenue'|'reviews'|'alerts'|'analytics';

function calcHealth(c: any, reviews: any[], locations: any[]) {
  let s = 0;
  if (c.is_active !== false) s += 25;
  if (c.is_subscribed && c.subscription_expires_at && new Date(c.subscription_expires_at) > new Date()) s += 25;
  const r = reviews.filter(x => x.company_id === c.id);
  if (r.length >= 5) s += 15; if (r.length >= 20) s += 5;
  if (r.length > 0) { const avg = r.reduce((a:number,x:any)=>a+(x.rating||0),0)/r.length; if(avg>=4)s+=15; else if(avg>=3)s+=7; }
  if (locations.filter(l => l.company_id === c.id).length > 0) s += 10;
  if (r.filter(x => Date.now()-new Date(x.created_at).getTime()<7*86400000).length > 0) s += 5;
  return Math.min(s, 100);
}

function getStatus(c: any) {
  const now = new Date();
  if (c.is_active === false) return { label:'Suspendat', badge:'red', days:null };
  if (c.is_subscribed && c.subscription_expires_at) {
    const exp = new Date(c.subscription_expires_at);
    if (exp > now) { const d=Math.ceil((exp.getTime()-now.getTime())/86400000); return {label:`Activ · ${d}z`,badge:'green',days:d}; }
    return { label:'Expirat', badge:'red', days:0 };
  }
  const end = c.trial_ends_at ? new Date(c.trial_ends_at) : c.trial_started_at ? new Date(new Date(c.trial_started_at).getTime()+7*86400000) : null;
  if (end) {
    if (end > now) { const d=Math.ceil((end.getTime()-now.getTime())/86400000); return {label:`Trial · ${d}z`,badge:'blue',days:d}; }
    return { label:'Trial Expirat', badge:'amber', days:0 };
  }
  return { label:'Nou', badge:'slate', days:null };
}

const B: Record<string,string> = {
  green:'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  blue:'bg-blue-500/15 text-blue-400 border-blue-500/25',
  amber:'bg-amber-500/15 text-amber-400 border-amber-500/25',
  red:'bg-red-500/15 text-red-400 border-red-500/25',
  slate:'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');

  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [pageViews, setPageViews] = useState<any[]>([]);

  const [payModal, setPayModal] = useState<any>(null);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [noteModal, setNoteModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{msg:string;fn:()=>void}|null>(null);
  const [payAmount, setPayAmount] = useState('500');
  const [planName, setPlanName] = useState('GROW');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [noteText, setNoteText] = useState('');
  const [trialDays, setTrialDays] = useState('7');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Load ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setBusy('loading');
    try {
      const [c,l,e,r,p,pv] = await Promise.all([
        supabase.from('companies').select('*').order('created_at',{ascending:false}),
        supabase.from('locations').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('reviews').select('*').order('created_at',{ascending:false}),
        supabase.from('payments').select('*').order('paid_at',{ascending:false}),
        supabase.from('page_views').select('*').order('created_at',{ascending:false}).limit(500),
      ]);
      if(c.data) setCompanies(c.data);
      if(l.data) setLocations(l.data);
      if(e.data) setEmployees(e.data);
      if(r.data) setReviews(r.data);
      if(p.data) setPayments(p.data);
      if(pv.data) setPageViews(pv.data);
    } catch(err) { console.error(err); }
    finally { setLoading(false); setBusy(''); }
  }, []);
  useEffect(()=>{ load(); },[load]);

  // ── Actions ───────────────────────────────────────────────────────
  const run = async (fn: ()=>Promise<void>, label='') => {
    setBusy(label);
    try { await fn(); await load(); }
    catch(e:any) { alert('Eroare: '+e.message); }
    finally { setBusy(''); }
  };

  const activate = (id:string) => run(()=>supabase.from('companies').update({is_active:true} as any).eq('id',id).then(r=>{ if(r.error) throw r.error; }),'act-'+id);
  const suspend  = (id:string) => setConfirmModal({msg:`Suspendezi compania?`, fn:()=>run(()=>supabase.from('companies').update({is_active:false} as any).eq('id',id).then(r=>{ if(r.error) throw r.error; }),'sus-'+id)});
  const stopTrial = (id:string) => setConfirmModal({msg:'Oprești trial-ul?', fn:()=>run(()=>supabase.from('companies').update({trial_ends_at:new Date(0).toISOString()} as any).eq('id',id).then(r=>{ if(r.error) throw r.error; }),'stop-'+id)});
  const extTrial = (id:string, days:number) => run(async()=>{
    const res = await supabase.from('companies').update({
      trial_ends_at: new Date(Date.now()+days*86400000).toISOString(),
      is_active: true,
      is_subscribed: false
    } as any).eq('id',id);
    if(res.error) throw res.error;
  },'ext-'+id);
  const delCo = (id:string, name:string) => setConfirmModal({msg:`Ștergi definitiv "${name}"? Ireversibil!`, fn:()=>run(async()=>{
    const res = await supabase.from('companies').delete().eq('id',id);
    if(res.error) throw res.error;
  },'del-'+id)});
  const saveNote = () => run(async()=>{
    if(!noteModal) return;
    const res = await supabase.from('companies').update({admin_note:noteText} as any).eq('id',noteModal.id);
    if(res.error) throw res.error;
    setNoteModal(null);
  },'note');
  const savePay = () => run(async()=>{
    if(!payModal) return;
    const exp = new Date(Date.now()+30*86400000).toISOString();
    const inv = invoiceNo||`QR-${new Date().getFullYear()}-${String(payments.length+1).padStart(4,'0')}`;
    const r1 = await supabase.from('companies').update({is_subscribed:true,subscription_expires_at:exp,is_active:true,plan_name:planName} as any).eq('id',payModal.id);
    if(r1.error) throw r1.error;
    const r2 = await supabase.from('payments').insert({company_id:payModal.id,amount:parseFloat(payAmount),invoice_number:inv,plan_name:planName,paid_at:new Date().toISOString()} as any);
    if(r2.error) throw r2.error;
    setPayModal(null); setInvoiceNo('');
  },'pay');

  // ── Export CSV ───────────────────────────────────────────────────
  const exportCompaniesCSV = () => {
    const rows = [
      ['Nume','IDNO','Email','Status','Recenzii','Locatii','Creeat la'],
      ...companies.map(c=>[c.name||'',c.idno||'',c.email||'',getStatus(c).label,reviews.filter(r=>r.company_id===c.id).length,locations.filter(l=>l.company_id===c.id).length,new Date(c.created_at).toLocaleDateString('ro-RO')])
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`QRate_Companii_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };
  const exportPaymentsCSV = () => {
    const rows = [
      ['Factura','Companie','Plan','Suma','Data'],
      ...payments.map(p=>[p.invoice_number||'',companies.find(c=>c.id===p.company_id)?.name||'',p.plan_name||'',p.amount,p.paid_at?new Date(p.paid_at).toLocaleDateString('ro-RO'):''])
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`QRate_Plati_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  // ── KPIs ─────────────────────────────────────────────────────────
  const kpi = useMemo(()=>{
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const active = companies.filter(c=>c.is_subscribed&&c.subscription_expires_at&&new Date(c.subscription_expires_at)>now);
    const trial = companies.filter(c=>{ if(c.is_subscribed)return false; const e=c.trial_ends_at?new Date(c.trial_ends_at):c.trial_started_at?new Date(new Date(c.trial_started_at).getTime()+7*86400000):null; return e&&e>now; });
    const expiring=[...active,...trial].filter(c=>{ const e=c.subscription_expires_at||c.trial_ends_at; if(!e)return false; return (new Date(e).getTime()-now.getTime())/86400000<=3; });
    const mrr=payments.filter(p=>{ const d=new Date(p.paid_at); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).reduce((s,p)=>s+(p.amount||0),0);
    const totalRev=payments.reduce((s,p)=>s+(p.amount||0),0);
    const todayRevs=reviews.filter(r=>r.created_at?.startsWith(todayStr)).length;
    const avgR=reviews.length>0?(reviews.reduce((s,r)=>s+(r.rating||0),0)/reviews.length).toFixed(1):'0.0';
    const prevMonthMrr=payments.filter(p=>{ const d=new Date(p.paid_at); const prev=new Date(now.getFullYear(),now.getMonth()-1,1); return d.getMonth()===prev.getMonth()&&d.getFullYear()===prev.getFullYear(); }).reduce((s,p)=>s+(p.amount||0),0);
    return { total:companies.length, active:active.length, trial:trial.length, expiring:expiring.length, mrr, totalRev, todayRevs, totalRevs:reviews.length, avgR, suspended:companies.filter(c=>c.is_active===false).length, todayViews:pageViews.filter(p=>p.created_at?.startsWith(todayStr)).length, totalViews:pageViews.length, prevMonthMrr };
  },[companies,payments,reviews,pageViews]);

  const alerts = useMemo(()=>{
    const list:any[]=[];
    companies.forEach(c=>{
      const s=getStatus(c);
      if(s.days!==null&&s.days<=3&&s.days>=0) list.push({type:'expiry',co:c.name,msg:`Expiră în ${s.days} zile`,color:'amber',id:c.id});
      if(reviews.filter(r=>r.company_id===c.id).length===0) list.push({type:'no_rev',co:c.name,msg:'Zero recenzii colectate',color:'slate',id:c.id});
      if(c.is_active===false) list.push({type:'suspended',co:c.name,msg:'Cont suspendat',color:'red',id:c.id});
    });
    return list;
  },[companies,reviews]);

  const revenueMonths=useMemo(()=>{
    const map:Record<string,number>={};
    payments.forEach(p=>{ const k=new Date(p.paid_at).toLocaleDateString('ro-RO',{month:'short',year:'2-digit'}); map[k]=(map[k]||0)+(p.amount||0); });
    return Object.entries(map).slice(-6).map(([m,a])=>({m,a}));
  },[payments]);

  const pvByDay=useMemo(()=>Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return {day:d.toLocaleDateString('ro-RO',{weekday:'short'}),count:pageViews.filter(p=>p.created_at?.startsWith(ds)).length,isToday:i===6};
  }),[pageViews]);

  const filtered=useMemo(()=>companies.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||c.idno?.includes(search)||c.email?.toLowerCase().includes(search.toLowerCase())),[companies,search]);

  const TABS=[
    {id:'overview' as Tab,label:'Overview',icon:<BarChart3 size={13}/>},
    {id:'companies' as Tab,label:'Companii',icon:<Building2 size={13}/>},
    {id:'employees' as Tab,label:'Angajați',icon:<Users size={13}/>},
    {id:'revenue' as Tab,label:'Revenue',icon:<DollarSign size={13}/>},
    {id:'reviews' as Tab,label:'Recenzii',icon:<Star size={13}/>},
    {id:'alerts' as Tab,label:`Alerte${alerts.length?` (${alerts.length})`:''}`,icon:<Bell size={13}/>,alert:alerts.length>0},
    {id:'analytics' as Tab,label:'Analytics',icon:<Globe size={13}/>},
  ];

  if(loading) return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse"><Zap size={22} className="text-white fill-white"/></div>
        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">SuperAdmin Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white font-sans">

      {/* TOP BAR */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-[#0d1017]/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30"><Zap size={15} className="text-white fill-white"/></div>
            <div>
              <p className="font-black text-sm text-white uppercase tracking-tight leading-none">SuperAdmin · QRate.MD</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">Panou intern · Acces restricționat</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase">
              <span className="flex items-center gap-1"><Building2 size={10} className="text-blue-400"/> {kpi.total}</span>
              <span className="flex items-center gap-1"><Check size={10} className="text-emerald-400"/> {kpi.active} activi</span>
              <span className="flex items-center gap-1"><DollarSign size={10} className="text-emerald-400"/> {kpi.mrr.toLocaleString()} MDL/lună</span>
            </div>
            <button onClick={exportCompaniesCSV} className="hidden md:flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all">
              <Download size={11}/> CSV
            </button>
            {alerts.length>0&&<button onClick={()=>setTab('alerts')} className="relative flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
              <Bell size={11}/>{alerts.length}<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"/>
            </button>}
            <button onClick={load} className={`p-2 bg-white/5 hover:bg-white/10 rounded-xl ${busy==='loading'?'animate-spin':''}`}><RefreshCw size={13} className="text-slate-400"/></button>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-5 flex gap-0 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${tab===t.id?'text-blue-400 border-blue-500':'text-slate-600 border-transparent hover:text-slate-300'}`}>
              {t.icon}{t.label}
              {t.alert&&<span className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"/>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-5 space-y-4">

        {/* ═══ OVERVIEW ═══ */}
        {tab==='overview'&&(<>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {l:'Total Companii',v:kpi.total,icon:<Building2 size={17}/>,c:'text-blue-400',bg:'bg-blue-500/10 border-blue-500/20'},
              {l:'Abonamente Active',v:kpi.active,icon:<Check size={17}/>,c:'text-emerald-400',bg:'bg-emerald-500/10 border-emerald-500/20'},
              {l:'Trial Active',v:kpi.trial,icon:<Clock size={17}/>,c:'text-indigo-400',bg:'bg-indigo-500/10 border-indigo-500/20'},
              {l:'Expiră ≤3 zile',v:kpi.expiring,icon:<AlertTriangle size={17}/>,c:kpi.expiring>0?'text-amber-400':'text-slate-500',bg:kpi.expiring>0?'bg-amber-500/10 border-amber-500/20 animate-pulse':'bg-slate-500/10 border-slate-500/20'},
              {l:'MRR Luna Curentă',v:`${kpi.mrr.toLocaleString()} MDL`,icon:<TrendingUp size={17}/>,c:'text-emerald-400',bg:'bg-emerald-500/10 border-emerald-500/20'},
              {l:'Venit Total',v:`${kpi.totalRev.toLocaleString()} MDL`,icon:<DollarSign size={17}/>,c:'text-blue-400',bg:'bg-blue-500/10 border-blue-500/20'},
              {l:'Total Recenzii',v:kpi.totalRevs,icon:<Star size={17}/>,c:'text-amber-400',bg:'bg-amber-500/10 border-amber-500/20'},
              {l:'Nota Medie',v:`${kpi.avgR} ★`,icon:<Award size={17}/>,c:'text-amber-400',bg:'bg-amber-500/10 border-amber-500/20'},
            ].map((k,i)=>(
              <div key={i} className={`border rounded-2xl p-4 ${k.bg} hover:brightness-110 transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase leading-tight">{k.l}</p>
                  <span className={k.c}>{k.icon}</span>
                </div>
                <p className={`text-2xl font-black ${k.c}`}>{k.v}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-sm uppercase text-slate-300 mb-4 flex items-center gap-2"><BarChart3 size={13} className="text-blue-400"/> Venituri 6 luni</h3>
              {revenueMonths.length===0 ? <div className="h-20 flex items-center justify-center text-slate-600 text-sm">Nicio plată</div> : (
                <div className="flex items-end justify-between gap-2 h-20">
                  {revenueMonths.map((m,i)=>{
                    const max=Math.max(...revenueMonths.map(x=>x.a),1);
                    return <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[9px] text-slate-500 font-black">{m.a}</span>
                      <div className="w-full bg-blue-500 rounded-t-lg" style={{height:`${Math.max((m.a/max)*60,4)}px`}}/>
                      <span className="text-[9px] text-slate-600 font-bold">{m.m}</span>
                    </div>;
                  })}
                </div>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-sm uppercase text-slate-300 mb-4 flex items-center gap-2"><Heart size={13} className="text-rose-400"/> Health Score Top 5</h3>
              <div className="space-y-2.5">
                {companies.slice(0,5).map((c,i)=>{
                  const h=calcHealth(c,reviews,locations);
                  return <div key={c.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-600 w-4">{i+1}</span>
                    <span className="text-xs font-black text-white truncate flex-1">{c.name}</span>
                    <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${h>=70?'bg-emerald-500':h>=40?'bg-amber-500':'bg-rose-500'}`} style={{width:`${h}%`}}/>
                    </div>
                    <span className={`text-[10px] font-black w-6 text-right ${h>=70?'text-emerald-400':h>=40?'text-amber-400':'text-rose-400'}`}>{h}</span>
                  </div>;
                })}
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase text-slate-300 flex items-center gap-2"><Activity size={13} className="text-blue-400"/> Companii Recente</h3>
              <button onClick={()=>setTab('companies')} className="text-[10px] font-black text-blue-400 flex items-center gap-1">Toate <ChevronRight size={11}/></button>
            </div>
            {companies.slice(0,6).map(c=>{
              const s=getStatus(c); const h=calcHealth(c,reviews,locations);
              return <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${h>=70?'bg-emerald-500/20 text-emerald-400':h>=40?'bg-amber-500/20 text-amber-400':'bg-rose-500/20 text-rose-400'}`}>{h}</div>
                  <div>
                    <p className="font-black text-sm text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-600">{reviews.filter(r=>r.company_id===c.id).length} recenzii · {locations.filter(l=>l.company_id===c.id).length} locații</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${B[s.badge]}`}>{s.label}</span>
                  <button onClick={()=>setPayModal(c)} className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all text-[10px] font-black">💰</button>
                </div>
              </div>;
            })}
          </div>
        </>)}

        {/* ═══ COMPANII ═══ */}
        {tab==='companies'&&(<>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Caută companie / IDNO / email..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-blue-500"/>
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase">{filtered.length}/{companies.length}</span>
            <button onClick={exportCompaniesCSV} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ml-auto">
              <Download size={11}/> Export CSV
            </button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Companie','Status','Health','Statistici','Notă Admin','Acțiuni'].map(h=>(
                      <th key={h} className="p-3 text-left text-[10px] font-black text-slate-600 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(c=>{
                    const s=getStatus(c); const h=calcHealth(c,reviews,locations);
                    const cRevs=reviews.filter(r=>r.company_id===c.id);
                    const avg=cRevs.length>0?(cRevs.reduce((a:number,r:any)=>a+(r.rating||0),0)/cRevs.length).toFixed(1):'—';
                    const isbusy=busy.endsWith(c.id);
                    return (
                      <tr key={c.id} className="hover:bg-white/3 transition-all">
                        <td className="p-3">
                          <p className="font-black text-white">{c.name}</p>
                          <p className="text-[10px] text-slate-600 font-mono">{c.idno||'—'}</p>
                          <p className="text-[10px] text-slate-700">{new Date(c.created_at).toLocaleDateString('ro-RO')}</p>
                          {c.plan_name&&<span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md">{c.plan_name}</span>}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-xl border whitespace-nowrap ${B[s.badge]}`}>{s.label}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${h>=70?'bg-emerald-500':h>=40?'bg-amber-500':'bg-rose-500'}`} style={{width:`${h}%`}}/>
                            </div>
                            <span className={`text-[10px] font-black ${h>=70?'text-emerald-400':h>=40?'text-amber-400':'text-rose-400'}`}>{h}</span>
                          </div>
                        </td>
                        <td className="p-3 text-[10px] space-y-0.5">
                          <p className="text-slate-500">📍 {locations.filter(l=>l.company_id===c.id).length} locații</p>
                          <p className="text-slate-500">👥 {employees.filter(e=>e.company_id===c.id).length} angajați</p>
                          <p className="text-slate-500">⭐ {cRevs.length} recenzii</p>
                          <p className="text-amber-400 font-black">{avg} ★</p>
                        </td>
                        <td className="p-3 max-w-[100px]">
                          {c.admin_note?<p className="text-[10px] text-slate-400 italic truncate">{c.admin_note}</p>:<span className="text-[10px] text-slate-700">—</span>}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {c.is_active===false
                              ? <button onClick={()=>activate(c.id)} disabled={isbusy} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black">✅ Activează</button>
                              : <button onClick={()=>suspend(c.id)} disabled={isbusy} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black">⏸ Suspendă</button>
                            }
                            <div className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/20 rounded-lg px-1.5 py-1">
                              <input type="number" min="1" max="365" value={trialDays} onChange={e=>setTrialDays(e.target.value)}
                                className="w-8 bg-transparent text-blue-300 text-[10px] font-black outline-none text-center"/>
                              <span className="text-[9px] text-blue-400 font-black">z</span>
                              <button onClick={()=>extTrial(c.id,parseInt(trialDays)||7)} disabled={isbusy}
                                className="text-[10px] font-black text-blue-400 hover:text-blue-300 disabled:opacity-50 ml-1">+Trial</button>
                            </div>
                            <button onClick={()=>stopTrial(c.id)} disabled={isbusy} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-[10px] font-black">Stop</button>
                            <button onClick={()=>setPayModal(c)} disabled={isbusy} className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black">💰</button>
                            <button onClick={()=>{setNoteModal(c);setNoteText(c.admin_note||'');}} className="p-1.5 bg-white/10 hover:bg-violet-500/20 text-slate-400 hover:text-violet-400 rounded-lg transition-all"><Edit3 size={11}/></button>
                            <button onClick={()=>setDetailModal(c)} className="p-1.5 bg-white/10 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all"><Eye size={11}/></button>
                            <button onClick={()=>delCo(c.id,c.name)} disabled={isbusy} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg disabled:opacity-50"><Trash2 size={11}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length===0&&<tr><td colSpan={6} className="p-8 text-center text-slate-600 font-bold">Nicio companie găsită</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ═══ ANGAJAȚI ═══ */}
        {tab==='employees'&&(<>
          <div className="grid grid-cols-3 gap-3 mb-1">
            {[{l:'Total',v:employees.length,c:'text-blue-400'},{l:'Cu QR',v:employees.filter(e=>e.qr_code_url).length,c:'text-emerald-400'},{l:'Fără locație',v:employees.filter(e=>!e.location_id).length,c:'text-amber-400'}].map((s,i)=>(
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{s.l}</p>
                <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/10">{['Angajat','Companie','Locație','Funcție','Recenzii','Nota Medie'].map(h=><th key={h} className="p-3 text-left text-[10px] font-black text-slate-600 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map(e=>{
                    const eR=reviews.filter(r=>r.employee_id===e.id);
                    const avg=eR.length>0?(eR.reduce((s:number,r:any)=>s+(r.rating||0),0)/eR.length).toFixed(1):'—';
                    const loc=locations.find(l=>l.id===e.location_id);
                    const co=companies.find(c=>c.id===e.company_id);
                    return (
                      <tr key={e.id} className="hover:bg-white/3">
                        <td className="p-3 font-black text-white">{e.name||'—'}</td>
                        <td className="p-3 text-slate-400 font-bold">{co?.name||'—'}</td>
                        <td className="p-3 text-slate-500">{loc?.name||'Mobilă'}</td>
                        <td className="p-3 text-slate-500">{e.position||'—'}</td>
                        <td className="p-3 text-blue-400 font-black">{eR.length}</td>
                        <td className="p-3 font-black text-amber-400">{avg}{eR.length>0?' ★':''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ═══ REVENUE ═══ */}
        {tab==='revenue'&&(<>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {l:'MRR Luna Curentă',v:`${kpi.mrr.toLocaleString()} MDL`,trend:kpi.prevMonthMrr>0?Math.round(((kpi.mrr-kpi.prevMonthMrr)/kpi.prevMonthMrr)*100):null,icon:<TrendingUp size={20}/>,c:'text-emerald-400',bg:'border-emerald-500/20 bg-emerald-500/10'},
              {l:'Venit Total',v:`${kpi.totalRev.toLocaleString()} MDL`,icon:<DollarSign size={20}/>,c:'text-blue-400',bg:'border-blue-500/20 bg-blue-500/10'},
              {l:'Tranzacții',v:payments.length,icon:<CreditCard size={20}/>,c:'text-violet-400',bg:'border-violet-500/20 bg-violet-500/10'},
            ].map((s,i)=>(
              <div key={i} className={`border rounded-2xl p-5 ${s.bg}`}>
                <div className="flex items-center justify-between mb-2"><p className="text-[10px] font-black text-slate-500 uppercase">{s.l}</p><span className={s.c}>{s.icon}</span></div>
                <p className={`text-3xl font-black ${s.c}`}>{s.v}</p>
                {s.trend!==undefined&&s.trend!==null&&<p className={`text-[10px] font-black mt-1 ${s.trend>=0?'text-emerald-400':'text-rose-400'}`}>{s.trend>=0?'↑':'↓'} {Math.abs(s.trend)}% față de luna trecută</p>}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={exportPaymentsCSV} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
              <Download size={11}/> Export Plăți CSV
            </button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase text-slate-300 flex items-center gap-2"><AlertTriangle size={13} className="text-amber-400"/> Companii fără plată</h3>
            </div>
            <div className="divide-y divide-white/5">
              {companies.filter(c=>['amber','red','slate'].includes(getStatus(c).badge)).length===0
                ?<div className="p-6 text-center text-slate-600 font-bold">✅ Toate au status activ</div>
                :companies.filter(c=>['amber','red','slate'].includes(getStatus(c).badge)).map(c=>{
                  const s=getStatus(c);
                  return <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/4">
                    <div>
                      <p className="font-black text-white text-sm">{c.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${B[s.badge]}`}>{s.label}</span>
                    </div>
                    <button onClick={()=>setPayModal(c)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase">
                      <DollarSign size={11}/>Încasează
                    </button>
                  </div>;
                })}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10"><h3 className="font-black text-sm uppercase text-slate-300 flex items-center gap-2"><FileText size={13} className="text-blue-400"/>Istoric Plăți ({payments.length})</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/10">{['Factură','Companie','Plan','Sumă','Data'].map(h=><th key={h} className="p-3 text-left text-[10px] font-black text-slate-600 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((p,i)=>(
                    <tr key={i} className="hover:bg-white/3">
                      <td className="p-3 font-mono font-black text-blue-400">{p.invoice_number}</td>
                      <td className="p-3 font-bold text-white">{companies.find(c=>c.id===p.company_id)?.name||'—'}</td>
                      <td className="p-3"><span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg text-[10px] font-black">{p.plan_name||'—'}</span></td>
                      <td className="p-3 font-black text-emerald-400">{p.amount} MDL</td>
                      <td className="p-3 text-slate-500 font-mono">{p.paid_at?new Date(p.paid_at).toLocaleDateString('ro-RO'):'—'}</td>
                    </tr>
                  ))}
                  {payments.length===0&&<tr><td colSpan={5} className="p-8 text-center text-slate-600 font-bold">Nicio plată</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ═══ RECENZII ═══ */}
        {tab==='reviews'&&(<>
          <div className="grid grid-cols-3 gap-3">
            {[{l:'Total',v:reviews.length,c:'text-blue-400'},{l:'Nota medie',v:`${kpi.avgR} ★`,c:'text-amber-400'},{l:'Astăzi',v:kpi.todayRevs,c:'text-emerald-400'}].map((s,i)=>(
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{s.l}</p>
                <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {reviews.slice(0,100).map(r=>(
                <div key={r.id} className={`flex gap-4 p-4 hover:bg-white/3 border-l-2 ${r.rating<=2?'border-rose-500':r.rating>=4?'border-emerald-500':'border-amber-500'}`}>
                  <div className="shrink-0 w-12">
                    <div className="flex gap-0.5 flex-wrap mb-1">{[1,2,3,4,5].map(i=><Star key={i} size={10} className={i<=r.rating?'text-amber-400 fill-amber-400':'text-slate-700'}/>)}</div>
                    <p className="text-[9px] text-slate-700 font-mono">{r.created_at?new Date(r.created_at).toLocaleDateString('ro-RO'):'—'}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 italic">"{r.comment||'Fără comentariu'}"</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">🏢 {companies.find(c=>c.id===r.company_id)?.name||'—'} · 👤 {r.full_name||'Anonim'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ═══ ALERTS ═══ */}
        {tab==='alerts'&&(
          <div className="space-y-3">
            {alerts.length===0
              ?<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-10 text-center"><p className="text-emerald-400 font-black text-xl">✅ Zero alerte!</p></div>
              :alerts.map((a,i)=>(
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${a.color==='red'?'bg-red-500/10 border-red-500/20':a.color==='amber'?'bg-amber-500/10 border-amber-500/20':'bg-slate-500/10 border-slate-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={15} className={a.color==='red'?'text-red-400':a.color==='amber'?'text-amber-400':'text-slate-500'}/>
                    <div>
                      <p className="font-black text-sm text-white">{a.co}</p>
                      <p className={`text-[10px] font-bold ${a.color==='red'?'text-red-400':a.color==='amber'?'text-amber-400':'text-slate-500'}`}>{a.msg}</p>
                    </div>
                  </div>
                  {a.type==='expiry'&&<button onClick={()=>{const c=companies.find(x=>x.id===a.id);if(c)setPayModal(c);}} className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1.5 rounded-xl uppercase hover:bg-emerald-500">Încasează</button>}
                  {a.type==='suspended'&&<button onClick={()=>activate(a.id)} className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-xl uppercase hover:bg-blue-500">Activează</button>}
                </div>
              ))
            }
          </div>
        )}

        {/* ═══ ANALYTICS ═══ */}
        {tab==='analytics'&&(<>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{l:'Vizite azi',v:kpi.todayViews,c:'text-blue-400',icon:<Activity size={15}/>},{l:'Vizite totale',v:kpi.totalViews,c:'text-indigo-400',icon:<Globe size={15}/>},{l:'Companii active',v:kpi.active,c:'text-emerald-400',icon:<Building2 size={15}/>},{l:'Recenzii azi',v:kpi.todayRevs,c:'text-amber-400',icon:<Star size={15}/>}].map((s,i)=>(
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-500">{s.icon}<span className="text-[10px] font-black uppercase">{s.l}</span></div>
                <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          {pvByDay.some(d=>d.count>0)?(
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-black text-sm uppercase text-slate-300 mb-4 flex items-center gap-2"><Activity size={13} className="text-blue-400"/>Vizite ultimele 7 zile</h3>
              <div className="flex items-end justify-between gap-2 h-20">
                {pvByDay.map((d,i)=>{
                  const max=Math.max(...pvByDay.map(x=>x.count),1);
                  return <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    {d.count>0&&<span className="text-[9px] font-black text-slate-500">{d.count}</span>}
                    <div className={`w-full rounded-t-xl ${d.isToday?'bg-blue-500':'bg-blue-500/40'}`} style={{height:`${Math.max((d.count/max)*60,d.count>0?6:2)}px`}}/>
                    <span className={`text-[9px] font-black uppercase ${d.isToday?'text-blue-400':'text-slate-600'}`}>{d.day}</span>
                  </div>;
                })}
              </div>
            </div>
          ):(
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="font-black text-base text-white mb-2 flex items-center gap-2"><Globe size={16} className="text-indigo-400"/>Activează tracking vizite</h3>
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-emerald-400 mb-3">
                <p className="text-slate-500 mb-1">-- Supabase SQL Editor:</p>
                <p>{'CREATE TABLE IF NOT EXISTS page_views ('}</p>
                <p className="pl-4">{'id UUID DEFAULT gen_random_uuid() PRIMARY KEY,'}</p>
                <p className="pl-4">{'page TEXT, referrer TEXT,'}</p>
                <p className="pl-4">{'created_at TIMESTAMPTZ DEFAULT NOW()'}</p>
                <p>{')'}</p>
              </div>
              <p className="text-slate-400 text-xs">Rulează SQL-ul din fișierul <code className="bg-white/10 px-1 rounded">superadmin_fix_sql.sql</code> pentru toate setările necesare.</p>
            </div>
          )}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="font-black text-sm uppercase text-slate-300 mb-4 flex items-center gap-2"><BarChart3 size={13} className="text-blue-400"/>Recenzii per companie</h3>
            <div className="space-y-2">
              {companies.map(c=>({name:c.name,count:reviews.filter(r=>r.company_id===c.id).length})).sort((a,b)=>b.count-a.count).slice(0,10).map((c,i)=>{
                const max=Math.max(...companies.map(x=>reviews.filter(r=>r.company_id===x.id).length),1);
                return <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-600 w-4">{i+1}</span>
                  <span className="text-xs font-black text-white truncate w-32 shrink-0">{c.name}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${(c.count/max)*100}%`}}/></div>
                  <span className="text-[10px] font-black text-blue-400 w-6 text-right">{c.count}</span>
                </div>;
              })}
            </div>
          </div>
        </>)}

      </div>

      {/* ═══ MODAL PLATĂ ═══ */}
      {payModal&&(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-white flex items-center gap-2"><DollarSign size={15} className="text-emerald-400"/>Înregistrare Plată</h3>
              <button onClick={()=>setPayModal(null)} className="p-2 bg-white/10 rounded-xl"><X size={13} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] text-slate-500 font-black uppercase">Companie</p>
                <p className="font-black text-white">{payModal.name}</p>
              </div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Sumă (MDL)</label>
                <input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xl outline-none focus:border-blue-500"/>
              </div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Plan</label>
                <select value={planName} onChange={e=>setPlanName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500">
                  {['START','GROW','SCALE','PRO','PRO+','ENTERPRISE'].map(p=><option key={p} value={p} className="bg-slate-900">{p}</option>)}
                </select>
              </div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Nr. Factură</label>
                <input type="text" placeholder={`QR-${new Date().getFullYear()}-${String(payments.length+1).padStart(4,'0')}`} value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-blue-500 placeholder:text-slate-700"/>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 font-bold">✅ Se adaugă 30 zile abonament activ</div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={()=>setPayModal(null)} className="flex-1 bg-white/5 text-slate-400 py-3 rounded-2xl font-black text-xs uppercase">Anulează</button>
              <button onClick={savePay} disabled={busy==='pay'} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white py-3 rounded-2xl font-black text-xs uppercase">
                {busy==='pay'?'Se procesează...':'Confirmă & Activează'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL FIȘĂ ═══ */}
      {detailModal&&(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-white flex items-center gap-2"><FileText size={14} className="text-blue-400"/>Fișă Companie</h3>
              <button onClick={()=>setDetailModal(null)} className="p-2 bg-white/10 rounded-xl"><X size={13} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-2">
              {[
                {l:'Denumire',v:detailModal.name},
                {l:'IDNO',v:detailModal.idno||'—',mono:true},
                {l:'IBAN',v:detailModal.iban||'—',mono:true},
                {l:'Email',v:detailModal.email||'—'},
                {l:'Telegram Chat ID',v:detailModal.telegram_chat_id||'—',mono:true},
                {l:'Plan',v:detailModal.plan_name||'—'},
                {l:'Înregistrat',v:new Date(detailModal.created_at).toLocaleString('ro-RO')},
                {l:'Recenzii',v:reviews.filter(r=>r.company_id===detailModal.id).length},
                {l:'Locații',v:locations.filter(l=>l.company_id===detailModal.id).length},
                {l:'Angajați',v:employees.filter(e=>e.company_id===detailModal.id).length},
                {l:'Health Score',v:calcHealth(detailModal,reviews,locations)+'/100'},
                {l:'Notă Admin',v:detailModal.admin_note||'—'},
              ].map((row,i)=>(
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-black text-slate-600 uppercase">{row.l}</span>
                  <span className={`text-sm font-black text-white ${row.mono?'font-mono text-blue-400 text-xs':''}`}>{String(row.v)}</span>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-white/10">
              <button onClick={()=>setDetailModal(null)} className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-2xl font-black text-xs uppercase">Închide</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL NOTĂ ═══ */}
      {noteModal&&(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-white flex items-center gap-2"><Edit3 size={14} className="text-violet-400"/>Notă Admin — {noteModal.name}</h3>
              <button onClick={()=>setNoteModal(null)} className="p-2 bg-white/10 rounded-xl"><X size={13} className="text-slate-400"/></button>
            </div>
            <div className="p-5">
              <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={4} placeholder="Notițe interne..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-violet-500 resize-none placeholder:text-slate-700"/>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={()=>setNoteModal(null)} className="flex-1 bg-white/5 text-slate-400 py-3 rounded-2xl font-black text-xs uppercase">Anulează</button>
              <button onClick={saveNote} disabled={busy==='note'} className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white py-3 rounded-2xl font-black text-xs uppercase">Salvează</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL CONFIRMARE ═══ */}
      {confirmModal&&(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-3xl max-w-sm w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto"><AlertTriangle size={22} className="text-amber-400"/></div>
            <p className="font-black text-white text-base">{confirmModal.msg}</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmModal(null)} className="flex-1 bg-white/5 text-slate-400 py-3 rounded-2xl font-black text-xs uppercase">Anulează</button>
              <button onClick={()=>{confirmModal.fn();setConfirmModal(null);}} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-black text-xs uppercase">Confirmă</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}