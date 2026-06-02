'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import {
  Star, MapPin, User, MessageCircle, Zap, Trophy, Clock,
  Award, Download, RefreshCw, Bot, Copy, Check, TrendingUp,
  BrainCircuit, Smartphone, Lock, BarChart3, Building,
  TrendingDown, Sparkles, CheckCircle2, Circle, ChevronDown, ChevronUp,
  ExternalLink, Flame, ArrowUpRight, Activity, Settings,
  Sun, Moon, Coffee, Shield, ChevronRight, Eye, Target, Users
} from 'lucide-react';

interface Review {
  id: string; rating: number; comment: string; created_at: string;
  full_name?: string; location_id: string; employee_id: string;
  is_recovery_win?: boolean;
  employees: { name: string } | null; locations: { name: string } | null;
}

function getGreeting(locale: string) {
  const h = new Date().getHours();
  if (locale === 'ru') {
    if (h >= 5 && h < 12) return { text: 'Доброе утро', icon: <Coffee size={18} className="text-amber-400" /> };
    if (h >= 12 && h < 18) return { text: 'Добрый день', icon: <Sun size={18} className="text-yellow-400" /> };
    return { text: 'Добрый вечер', icon: <Moon size={18} className="text-indigo-400" /> };
  }
  if (h >= 5 && h < 12) return { text: 'Bună dimineața', icon: <Coffee size={18} className="text-amber-400" /> };
  if (h >= 12 && h < 18) return { text: 'Bună ziua', icon: <Sun size={18} className="text-yellow-400" /> };
  return { text: 'Bună seara', icon: <Moon size={18} className="text-indigo-400" /> };
}

function WelcomeCard({ locale, companyId, onDismiss }: { locale: string; companyId: string; onDismiss: () => void }) {
  const [states, setStates] = useState({ loc: false, emp: false, tg: false, google: false, rev: false });
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    (async () => {
      const [a, b, c, d] = await Promise.all([
        supabase.from('locations').select('id').eq('company_id', companyId).limit(1),
        supabase.from('employees').select('id').eq('company_id', companyId).limit(1),
        supabase.from('companies').select('telegram_chat_id,google_review_url').eq('id', companyId).single(),
        supabase.from('reviews').select('id').eq('company_id', companyId).limit(1),
      ]);
      setStates({ loc: (a.data?.length||0)>0, emp: (b.data?.length||0)>0, tg: !!c.data?.telegram_chat_id, google: !!c.data?.google_review_url, rev: (d.data?.length||0)>0 });
    })();
  }, [companyId]);
  const steps = [
    { done: states.loc, label: locale==='ru'?'Добавь первую локацию':'Adaugă prima locație și generează QR', link:`/${locale}/dashboard/locations`, linkLabel: locale==='ru'?'Локации →':'Locații →' },
    { done: states.emp, label: locale==='ru'?'Добавь сотрудников':'Adaugă angajații echipei', link:`/${locale}/dashboard/employees`, linkLabel: locale==='ru'?'Сотрудники →':'Angajați →' },
    { done: states.tg,  label: locale==='ru'?'Настрой Telegram уведомления':'Setează notificările Telegram', link:`/${locale}/dashboard/settings`, linkLabel: locale==='ru'?'Настройки →':'Setări →' },
    { done: states.google, label: locale==='ru'?'Добавь ссылку Google Reviews':'Adaugă link Google Reviews (clienții fericiți vor fi redirecționați)', link:`/${locale}/dashboard/settings`, linkLabel: locale==='ru'?'Добавить →':'Adaugă →', highlight: true },
    { done: states.rev, label: locale==='ru'?'Получи первый отзыв':'Primește prima recenzie prin QR', link:null, linkLabel:null },
  ];
  const done = steps.filter(s=>s.done).length;
  if (done===steps.length) return null;
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1"><Sparkles size={13} className="text-yellow-300"/><span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">{locale==='ru'?'Начало работы':'Ghid de start'}</span></div>
          <p className="font-black text-lg">{done}/{steps.length} {locale==='ru'?'шагов выполнено':'pași completați'}</p>
          <div className="mt-2 h-1.5 bg-white/20 rounded-full w-44 overflow-hidden"><div className="h-full bg-white rounded-full" style={{width:`${(done/steps.length)*100}%`}}/></div>
        </div>
        <button onClick={()=>setExpanded(!expanded)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl">{expanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>
      </div>
      {expanded && <div className="mt-3 space-y-1.5 relative z-10">{steps.map((s,i)=>(
        <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-2xl ${s.done?'bg-white/10':s.highlight?'bg-yellow-400/20 border border-yellow-300/30':'bg-white/5'}`}>
          {s.done?<CheckCircle2 size={16} className="text-emerald-300 shrink-0 mt-0.5"/>:<Circle size={16} className={`shrink-0 mt-0.5 ${s.highlight?'text-yellow-300':'text-white/40'}`}/>}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold leading-snug ${s.done?'line-through text-white/50':'text-white'}`}>{s.label}</p>
            {!s.done&&s.link&&<a href={s.link} className={`text-[10px] font-black uppercase mt-0.5 inline-flex items-center gap-1 ${s.highlight?'text-yellow-300':'text-blue-200'}`}>{s.linkLabel}<ExternalLink size={9}/></a>}
          </div>
        </div>
      ))}</div>}
      <button onClick={onDismiss} className="mt-3 w-full text-[10px] text-white/40 hover:text-white/60 font-bold uppercase tracking-wider relative z-10">{locale==='ru'?'Не показывать':'Nu mai afișa'}</button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ro';
  const t = useTranslations('Dashboard');
  const router = useRouter();

  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [rawEmployees, setRawEmployees] = useState<any[]>([]);
  const [rawLocations, setRawLocations] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string|null>(null);
  const [companyName, setCompanyName] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [liveEvent, setLiveEvent] = useState(false);
  const [copiedId, setCopiedId] = useState<string|null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string|null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [limits, setLimits] = useState({ maxLocations: 99, maxEmployees: 99 });
  const [selLocation, setSelLocation] = useState('all');
  const [selEmployee, setSelEmployee] = useState('all');
  const [selPeriod, setSelPeriod] = useState('7d');
  const [showWelcome, setShowWelcome] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const greeting = useMemo(() => getGreeting(locale), [locale]);

  const fetchReviews = useCallback(async (cId: string, period: string) => {
    setReviewsLoading(true);
    try {
      let q = supabase.from('reviews').select(`*, employees(name), locations(name)`).eq('company_id', cId).order('created_at', { ascending: false });
      if (period !== 'all') {
        const days = period==='7d'?7:period==='1m'?30:90;
        const cut = new Date(); cut.setDate(cut.getDate()-days);
        q = q.gte('created_at', cut.toISOString());
      }
      const { data, error } = await q;
      if (!error) setAllReviews(data||[]);
    } catch(e){ console.error(e); } finally { setReviewsLoading(false); }
  }, []);

  useEffect(() => { if (companyId) fetchReviews(companyId, selPeriod); }, [companyId, selPeriod, fetchReviews]);

  useEffect(() => {
    if (!companyId) return;
    const ch = supabase.channel(`rt:${companyId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'reviews',filter:`company_id=eq.${companyId}`},async(p:any)=>{
      const {data} = await supabase.from('reviews').select(`*, employees(name), locations(name)`).eq('id',p.new.id).single();
      if (data) { setAllReviews(prev=>prev.some(r=>r.id===data.id)?prev:[data,...prev]); setLiveEvent(true); setTimeout(()=>setLiveEvent(false),5000); }
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId]);

  useEffect(() => {
    (async()=>{
      try {
        const {data:{user}} = await supabase.auth.getUser();
        if (!user) { router.push(`/${locale}/auth/login`); return; }

        // ✅ FIX: citim toate câmpurile relevante inclusiv is_admin
        const {data:profile} = await supabase
          .from('profiles')
          .select('subscription_tier,trial_ends_at,created_at,is_admin,is_subscribed,subscription_status')
          .eq('id',user.id)
          .single();

        const trialEnd = profile?.trial_ends_at
          ? new Date(profile.trial_ends_at)
          : new Date(new Date(profile?.created_at||Date.now()).getTime()+7*86400000);

        // ✅ FIX: admin are mereu acces + toate celelalte condiții
        const isPro = profile?.is_admin === true
          || profile?.subscription_tier === 'pro'
          || profile?.is_subscribed === true
          || profile?.subscription_status === 'ACTIVE';

        setHasAccess(isPro || trialEnd.getTime() > Date.now());
        setLimits(isPro ? {maxLocations:99,maxEmployees:99} : {maxLocations:1,maxEmployees:4});

        const {data:company} = await supabase.from('companies').select('id,name').eq('owner_id',user.id).maybeSingle();
        if (company) {
          setCompanyId(company.id); setCompanyName(company.name||'');
          const [emp,loc] = await Promise.all([
            supabase.from('employees').select('id,name').eq('company_id',company.id),
            supabase.from('locations').select('id,name').eq('company_id',company.id),
          ]);
          setRawEmployees(emp.data||[]); setRawLocations(loc.data||[]);
          if (!localStorage.getItem(`qrate_welcome_${company.id}`)) setShowWelcome(true);
        }
      } catch(e){ console.error(e); } finally { setInitializing(false); }
    })();
  }, [router, locale]);

  const activeLocations = useMemo(()=>rawLocations.slice(0,limits.maxLocations),[rawLocations,limits]);
  const activeEmployees = useMemo(()=>{
    const pool = rawEmployees.slice(0,limits.maxEmployees);
    if (selLocation!=='all') { const ids=allReviews.filter(r=>r.location_id===selLocation).map(r=>r.employee_id); return pool.filter(e=>ids.includes(e.id)); }
    return pool;
  },[rawEmployees,limits,selLocation,allReviews]);

  const filteredReviews = useMemo(()=>allReviews.filter(r=>{
    const matchLoc = selLocation==='all'||r.location_id===selLocation;
    const matchEmp = selEmployee==='all'||(r.employee_id&&r.employee_id===selEmployee);
    return matchLoc&&matchEmp;
  }),[allReviews,selLocation,selEmployee]);

  const generateSmartReply = (rev: Review) => {
    const c = rev.full_name||t('anonClient'), e = rev.employees?.name;
    if (rev.rating>=4) return `${t('replyPositivePrefix')} ${c}! ${t('replyPositiveStars')} ${rev.rating} ${t('replyPositiveStarsEnd')}${e?` ${t('replyWithEmp')} (${e})`:''}! ${t('replyPositiveSuffix')}`;
    return `${t('replyNegativePrefix')} ${c}, ${t('replyNegativeSuffix')} ${rev.rating}★ ${t('replyNegativeMiddle')}${e?` ${t('replyNegativeEmp')}`:''} ${t('replyNegativeEnd')}`;
  };
  const copyText = (text:string,id:string)=>{ navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(()=>setCopiedId(null),2500); };
  const openWA = (text:string)=>window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,'_blank');
  const exportCSV = ()=>{
    if (!filteredReviews.length) return;
    const rows = filteredReviews.map(r=>[new Date(r.created_at).toLocaleDateString('ro-RO'),r.employees?.name||'',r.locations?.name||'',r.rating,`"${(r.comment||'').replace(/"/g,'""')}"`,r.full_name||'Anonim'].join(','));
    const blob = new Blob([[['Data','Angajat','Locatie','Nota','Comentariu','Client'].join(','), ...rows].join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`QRate_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const todayStr = useMemo(()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; },[]);

  const analytics = useMemo(()=>{
    if (!filteredReviews.length) return { avg:'0.0', today:0, velocity:0, dist:[5,4,3,2,1].map(s=>({star:s,pct:0,count:0})), aiInsight:t('aiNoData'), topWords:[], mvp:'N/A', weeklyTrend:[] };
    let total=0; const empMap:Record<string,number[]>={}; const starCounts:Record<number,number>={5:0,4:0,3:0,2:0,1:0}; let allText='';
    const now=Date.now(); let recent=0,previous=0;
    filteredReviews.forEach(r=>{
      total+=r.rating; if(r.rating>=1&&r.rating<=5) starCounts[r.rating]++;
      if(r.comment) allText+=' '+r.comment.toLowerCase();
      if(r.employees?.name){ if(!empMap[r.employees.name]) empMap[r.employees.name]=[]; empMap[r.employees.name].push(r.rating); }
      const rt=new Date(r.created_at).getTime();
      if(rt>=now-48*3600000) recent++;
      if(rt>=now-96*3600000&&rt<now-48*3600000) previous++;
    });
    const avg=(total/filteredReviews.length).toFixed(1);
    const velocity=previous>0?Math.round(((recent-previous)/previous)*100):0;
    const leaderboard=Object.entries(empMap).map(([name,sc])=>({name,avg:sc.reduce((a,b)=>a+b,0)/sc.length})).sort((a,b)=>b.avg-a.avg);
    const dist=[5,4,3,2,1].map(star=>({star,count:starCounts[star],pct:Math.round((starCounts[star]/filteredReviews.length)*100)}));
    const stop=['și','sau','cu','la','de','din','este','pentru','că','am','fost','mai','tot','nu','dar','pe','sunt','un','o','и','в','не','на','я','с','как'];
    const wf:Record<string,number>={};
    (allText.match(/[a-ăâîșțа-яё]+/g)||[]).forEach(w=>{ if(w.length>3&&!stop.includes(w)) wf[w]=(wf[w]||0)+1; });
    const topWords=Object.entries(wf).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([w])=>w);
    const target=selEmployee!=='all'?activeEmployees.find(e=>e.id===selEmployee)?.name:selLocation!=='all'?activeLocations.find(l=>l.id===selLocation)?.name:t('aiGeneralLevel');
    const aiInsight=Number(avg)>=4.5?`${t('aiExcellentPrefix')} ${target}! ${t('aiExcellentMiddle')} "${topWords[0]||t('wordQuality')}". ${t('aiExcellentSuffix')}`:Number(avg)>=3.5?`${t('aiModeratePrefix')} ${target}. ${t('aiModerateMiddle')} "${topWords[0]||t('wordTime')}".`:`${t('aiCriticalPrefix')} ${target}! ${t('aiCriticalSuffix')}`;
    const weeklyTrend=Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i));
      const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dr=filteredReviews.filter(r=>r.created_at.startsWith(ds));
      return {day:d.toLocaleDateString(locale==='ru'?'ru-RU':'ro-RO',{weekday:'short'}),count:dr.length,avg:dr.length>0?dr.reduce((s,r)=>s+r.rating,0)/dr.length:0,isToday:i===6};
    });
    return {avg,today:filteredReviews.filter(r=>r.created_at.startsWith(todayStr)).length,velocity,dist,aiInsight,topWords,mvp:leaderboard[0]?.name||'N/A',weeklyTrend};
  },[filteredReviews,selEmployee,selLocation,activeEmployees,activeLocations,t,locale,todayStr]);

  const aiPrediction = useMemo(()=>{
    if (filteredReviews.length<5) return null;
    const now=Date.now();
    const weeks=[0,1,2,3].map(i=>{ const s=now-(i+1)*7*86400000,e=now-i*7*86400000; const wr=filteredReviews.filter(r=>{const t2=new Date(r.created_at).getTime(); return t2>=s&&t2<e;}); return {week:4-i,avg:wr.length>0?wr.reduce((a,r)=>a+r.rating,0)/wr.length:null,count:wr.length}; }).reverse();
    const valid=weeks.filter(w=>w.avg!==null);
    if (valid.length<2) return null;
    const avgs=valid.map(w=>w.avg as number);
    const trend=(avgs[avgs.length-1]-avgs[0])/avgs.length;
    const predicted=Math.min(5,Math.max(1,avgs[avgs.length-1]+trend*4));
    return {predicted:predicted.toFixed(1),dir:trend>0.05?'up':trend<-0.05?'down':'stable',conf:Math.min(95,60+valid.length*10),weeks,last:avgs[avgs.length-1].toFixed(1)};
  },[filteredReviews]);

  const crisisCount = useMemo(()=>filteredReviews.filter(r=>r.rating<=2&&Date.now()-new Date(r.created_at).getTime()<2*3600000).length,[filteredReviews]);

  if (initializing) return (
    <div className="min-h-screen bg-[#F0F2F8] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse shadow-xl shadow-indigo-200"><Zap size={22} className="text-white fill-white"/></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QRate.md</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F2F8] p-3 md:p-5 pb-28 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-4">

        {!hasAccess && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center max-w-sm mx-auto mt-10">
            <div className="p-5 bg-amber-50 text-amber-500 rounded-2xl mb-5"><Lock size={38}/></div>
            <h1 className="font-black text-xl mb-2">Trial expirat</h1>
            <p className="text-slate-500 text-sm mb-6">Activează un plan pentru a continua.</p>
            <button onClick={()=>router.push(`/${locale}/dashboard/subscription`)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider">Activează Acum</button>
          </div>
        )}

        {hasAccess && !companyId && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-6 shadow-xl text-center max-w-sm mx-auto mt-10">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-5"><Building size={34}/></div>
            <h1 className="font-black text-xl mb-2">Configurează Compania</h1>
            <p className="text-slate-500 text-sm mb-5">Introdu numele brandului tău.</p>
            <form onSubmit={async(e)=>{e.preventDefault();if(!newCompanyName.trim())return;setCreatingCompany(true);try{const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{data,error}=await supabase.from('companies').insert([{name:newCompanyName.trim(),owner_id:user.id}]).select().single();if(error)throw error;setCompanyId(data.id);setCompanyName(data.name);setShowWelcome(true);}catch(err:any){alert(err.message);}finally{setCreatingCompany(false);}}} className="w-full space-y-3">
              <input type="text" required placeholder="Ex: My Delivery SRL" value={newCompanyName} onChange={e=>setNewCompanyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"/>
              <button type="submit" disabled={creatingCompany} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-sm uppercase disabled:opacity-50">{creatingCompany?'Se salvează...':'Creează'}</button>
            </form>
          </div>
        )}

        {hasAccess && companyId && (<>
          {showWelcome && <WelcomeCard locale={locale} companyId={companyId} onDismiss={()=>{ localStorage.setItem(`qrate_welcome_${companyId}`,'1'); setShowWelcome(false); }}/>}

          {crisisCount>=3 && (
            <div className="bg-rose-600 rounded-3xl p-4 text-white flex items-center gap-3 shadow-lg shadow-rose-200 animate-pulse">
              <div className="p-2.5 bg-white/20 rounded-xl shrink-0"><Flame size={20}/></div>
              <div className="flex-1">
                <p className="font-black text-sm">🚨 Crisis Mode! — {crisisCount} {locale==='ru'?'негативных за 2 часа':'recenzii negative în 2 ore'}</p>
                <p className="text-rose-200 text-xs">{locale==='ru'?'Проверь немедленно.':'Verifică imediat situația.'}</p>
              </div>
              <a href={`/${locale}/dashboard/reviews`} className="bg-white text-rose-600 px-3 py-2 rounded-xl text-xs font-black uppercase shrink-0">{locale==='ru'?'Смотреть':'Vezi'}</a>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full -mr-24 -mt-24 pointer-events-none"/>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-16 -mb-16 pointer-events-none"/>
            <div className="relative z-10 p-5 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                {greeting.icon}
                <span className="text-slate-400 text-sm font-bold">{greeting.text}{companyName?`, ${companyName}`:''}</span>
                {liveEvent && (
                  <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase animate-pulse border border-emerald-500/30">
                    <Activity size={9}/> Live!
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-5">
                {locale==='ru'?'Панель управления':t('headerTitle')}
              </h1>
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { icon:<Star size={14} className="text-amber-400 fill-amber-400"/>, label:t('cardGlobalScore'), val:analytics.avg+'★', bg:'bg-amber-500/10 border-amber-500/20 text-amber-200' },
                  { icon:<MessageCircle size={14} className="text-blue-400"/>, label:t('cardTotalReviews'), val:String(filteredReviews.length), bg:'bg-blue-500/10 border-blue-500/20 text-blue-200' },
                  { icon:<Clock size={14} className="text-emerald-400"/>, label:t('cardTodayFeedback'), val:String(analytics.today), bg:`${analytics.today>0?'bg-emerald-500/15 border-emerald-400/30 text-emerald-200':'bg-white/5 border-white/10 text-slate-400'}` },
                  { icon:<Trophy size={14} className="text-violet-400"/>, label:'MVP', val:analytics.mvp, bg:'bg-violet-500/10 border-violet-500/20 text-violet-200' },
                  ...(analytics.velocity!==0?[{ icon:analytics.velocity>0?<TrendingUp size={14} className="text-emerald-400"/>:<TrendingDown size={14} className="text-rose-400"/>, label:'Trend', val:`${analytics.velocity>0?'+':''}${analytics.velocity}%`, bg:analytics.velocity>0?'bg-emerald-500/10 border-emerald-500/20 text-emerald-200':'bg-rose-500/10 border-rose-500/20 text-rose-200' }]:[]),
                ].map((kpi,i)=>(
                  <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black ${kpi.bg}`}>
                    {kpi.icon}
                    <span className="text-slate-400 font-semibold hidden sm:inline">{kpi.label}:</span>
                    <span>{kpi.val}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={()=>fetchReviews(companyId,selPeriod)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all border border-white/10">
                  <RefreshCw size={13} className={reviewsLoading?'animate-spin':''}/> Sync
                </button>
                <button onClick={exportCSV} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-md shadow-emerald-500/30">
                  <Download size={13}/> CSV
                </button>
                <a href={`/${locale}/dashboard/analytics`} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-md shadow-indigo-500/30">
                  <BarChart3 size={13}/> Analytics
                </a>
                <a href={`/${locale}/dashboard/reviews`} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all border border-white/10">
                  <Eye size={13}/> {locale==='ru'?'Отзывы':'Recenzii'}
                </a>
                <a href={`/${locale}/dashboard/settings`} className="flex items-center justify-center bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white p-2 rounded-xl transition-all border border-white/10">
                  <Settings size={14}/>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon:<MapPin size={20}/>, label:locale==='ru'?'Локации':'Locații', sub:`${rawLocations.length} ${locale==='ru'?'активных':'active'}`, href:`/${locale}/dashboard/locations`, iconBg:'bg-emerald-100 text-emerald-600', border:'hover:border-emerald-200' },
              { icon:<Users size={20}/>, label:locale==='ru'?'Сотрудники':'Angajați', sub:`${rawEmployees.length} ${locale==='ru'?'в системе':'în sistem'}`, href:`/${locale}/dashboard/employees`, iconBg:'bg-blue-100 text-blue-600', border:'hover:border-blue-200' },
              { icon:<Eye size={20}/>, label:locale==='ru'?'Все отзывы':'Recenzii', sub:`${filteredReviews.length} ${locale==='ru'?'всего':'total'}`, href:`/${locale}/dashboard/reviews`, iconBg:'bg-violet-100 text-violet-600', border:'hover:border-violet-200' },
              { icon:<Target size={20}/>, label:'Analytics', sub:'AI · Heatmap', href:`/${locale}/dashboard/analytics`, iconBg:'bg-amber-100 text-amber-600', border:'hover:border-amber-200' },
            ].map((item,i)=>(
              <a key={i} href={item.href} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center gap-3 ${item.border}`}>
                <div className={`p-2.5 rounded-xl ${item.iconBg} shrink-0 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs uppercase tracking-tight text-slate-800 truncate">{item.label}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">{item.sub}</p>
                </div>
                <ChevronRight size={14} className="text-slate-200 shrink-0 group-hover:text-slate-500 transition-colors"/>
              </a>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Shield size={15} className="text-indigo-500"/><span className="font-black text-sm uppercase tracking-tight">{locale==='ru'?'Фильтры':'Filtre date'}</span></div>
              <button onClick={()=>setFiltersOpen(!filtersOpen)} className="md:hidden flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase bg-slate-100 px-3 py-1.5 rounded-xl">
                {filtersOpen?<ChevronUp size={12}/>:<ChevronDown size={12}/>} Filtre
              </button>
            </div>
            <div className={`border-t border-slate-100 p-4 ${filtersOpen?'block':'hidden md:block'}`}>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                <select className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none cursor-pointer flex-1 min-w-0" value={selLocation} onChange={e=>{setSelLocation(e.target.value);setSelEmployee('all');}}>
                  <option value="all">📍 {t('filterAllLocations')}</option>
                  {activeLocations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <select className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none cursor-pointer flex-1 min-w-0" value={selEmployee} onChange={e=>setSelEmployee(e.target.value)}>
                  <option value="all">👥 {t('filterAllEmployees')}</option>
                  {activeEmployees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-0.5">
                  {['7d','1m','3m','all'].map(p=>(
                    <button key={p} onClick={()=>setSelPeriod(p)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selPeriod===p?'bg-indigo-600 text-white shadow-sm':'text-slate-500 hover:text-slate-800'}`}>
                      {p==='all'?t('periodAll'):p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><Activity size={15} className="text-indigo-500"/>{locale==='ru'?'Активность недели':'Activitate săptămânală'}</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">7 {locale==='ru'?'дней':'zile'}</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-20">
              {analytics.weeklyTrend.map((d,i)=>{
                const maxC=Math.max(...analytics.weeklyTrend.map(x=>x.count),1);
                const hPct=d.count>0?Math.max((d.count/maxC)*100,10):4;
                const barColor=d.isToday?'bg-indigo-600':d.avg>=4?'bg-emerald-400':d.avg>=3?'bg-amber-400':d.count>0?'bg-rose-400':'bg-slate-100';
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1 group/b">
                    <div className="relative w-full flex items-end justify-center" style={{height:'60px'}}>
                      {d.count>0&&<span className="absolute -top-5 text-[9px] font-black text-slate-500 opacity-0 group-hover/b:opacity-100 transition-opacity">{d.count}</span>}
                      <div className={`w-full rounded-t-xl transition-all ${barColor} ${d.isToday?'shadow-md shadow-indigo-200':''}`} style={{height:`${hPct}%`}}/>
                    </div>
                    <span className={`text-[9px] font-black uppercase ${d.isToday?'text-indigo-600':'text-slate-400'}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-indigo-500"/>{t('chartTitle')}</h3>
              <div className="space-y-3">
                {analytics.dist.map(item=>(
                  <div key={item.star} className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-slate-500 w-5">{item.star}★</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${item.star>=4?'bg-emerald-500':item.star===3?'bg-amber-400':'bg-rose-500'}`} style={{width:`${item.pct}%`}}/>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 w-8 text-right">{item.pct}%</span>
                    <span className="text-[10px] font-bold text-slate-300 w-5">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">{t('mvpCardLabel')}</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200"><Trophy size={16} className="text-white"/></div>
                  <span className="font-black text-sm text-slate-800 truncate">{analytics.mvp}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-5 rounded-3xl border border-indigo-800/50 shadow-lg text-white relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-5"><BrainCircuit size={110}/></div>
                <h3 className="font-black text-sm uppercase tracking-tight text-indigo-300 mb-3 flex items-center gap-2 relative z-10"><BrainCircuit size={15}/>{t('aiTitle')}</h3>
                <p className="text-slate-200 text-sm font-medium leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/10 relative z-10">{analytics.aiInsight}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 relative z-10">
                  {analytics.topWords.slice(0,5).map(w=><span key={w} className="bg-indigo-500/25 border border-indigo-400/25 px-2.5 py-0.5 rounded-lg text-[10px] font-bold capitalize text-indigo-200">{w}</span>)}
                </div>
              </div>
              {aiPrediction&&(
                <div className="bg-gradient-to-br from-violet-950 to-indigo-950 p-5 rounded-3xl border border-violet-700/40 shadow-lg text-white relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 opacity-5"><Sparkles size={90}/></div>
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider mb-1">AI Predicție · {aiPrediction.conf}% conf.</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black">★{aiPrediction.predicted}</p>
                        <span className="text-violet-300 text-sm font-bold">{locale==='ru'?'на следующий месяц':'luna viitoare'}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black shrink-0 ${aiPrediction.dir==='up'?'bg-emerald-500/20 text-emerald-300':aiPrediction.dir==='down'?'bg-rose-500/20 text-rose-300':'bg-slate-500/20 text-slate-300'}`}>
                      {aiPrediction.dir==='up'?<TrendingUp size={14}/>:aiPrediction.dir==='down'?<TrendingDown size={14}/>:'→'}
                      {aiPrediction.dir==='up'?(locale==='ru'?'Рост':'Creștere'):aiPrediction.dir==='down'?(locale==='ru'?'Спад':'Scădere'):'Stabil'}
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5 h-10 mt-3 relative z-10">
                    {aiPrediction.weeks.map((w,i)=><div key={i} className="flex-1 rounded-t bg-violet-400/40" style={{height:`${w.avg?Math.max(((w.avg-1)/4)*100,5):2}%`,minHeight:w.avg?'5px':'2px'}}/>)}
                    <div className="flex-1 rounded-t bg-violet-300" style={{height:`${Math.max(((parseFloat(aiPrediction.predicted)-1)/4)*100,10)}%`,minHeight:'10px'}}/>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                {t('feedTitle')}
                <span className="bg-indigo-100 text-indigo-700 text-xs py-1 px-2.5 rounded-full font-black">{filteredReviews.length}</span>
                {reviewsLoading&&<RefreshCw size={13} className="animate-spin text-slate-400"/>}
              </h2>
              <a href={`/${locale}/dashboard/reviews`} className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors">
                {locale==='ru'?'Все':'Toate'} <ArrowUpRight size={13}/>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {filteredReviews.length>0 ? filteredReviews.slice(0,9).map(rev=>{
                const isPos=rev.rating>=4,isNeg=rev.rating<=2;
                const barColor=isPos?'bg-emerald-400':isNeg?'bg-rose-400':'bg-amber-400';
                const borderColor=isPos?'border-emerald-100 hover:border-emerald-300':isNeg?'border-rose-100 hover:border-rose-300':'border-amber-100 hover:border-amber-200';
                return (
                  <div key={rev.id} className={`bg-white rounded-3xl p-4 shadow-sm border-2 hover:shadow-lg transition-all duration-200 flex flex-col group ${borderColor}`}>
                    <div className={`h-0.5 w-full rounded-full mb-3 ${barColor}`}/>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-0.5 bg-slate-50 px-1.5 py-1 rounded-lg border border-slate-100">
                        {[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=rev.rating?(isPos?'text-emerald-400 fill-emerald-400':isNeg?'text-rose-400 fill-rose-400':'text-amber-400 fill-amber-400'):'text-slate-200'}/>)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {rev.is_recovery_win&&<span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">🏆 Win</span>}
                        <span className="text-[10px] font-bold text-slate-400">{new Date(rev.created_at).toLocaleDateString('ro-RO')}</span>
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed flex-1 mb-3 ${rev.comment?'text-slate-700 italic font-medium':'text-slate-300 italic'}`}>
                      {rev.comment?`"${rev.comment}"`:t('feedNoComment')}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {rev.full_name&&<span className="flex items-center gap-1 text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg"><User size={9}/>{rev.full_name}</span>}
                      {rev.employees?.name&&<span className="flex items-center gap-1 text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100"><Award size={9}/>{rev.employees.name}</span>}
                      {rev.locations?.name&&<span className="flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100"><MapPin size={9}/>{rev.locations.name}</span>}
                    </div>
                    {activeReplyId===rev.id?(
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                        <p className="text-xs text-slate-600 italic leading-snug">"{generateSmartReply(rev)}"</p>
                        <div className="flex gap-2">
                          <button onClick={()=>copyText(generateSmartReply(rev),rev.id)} className={`flex-1 flex justify-center items-center gap-1 text-[10px] font-black py-2 rounded-xl transition-all ${copiedId===rev.id?'bg-emerald-500 text-white':'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                            {copiedId===rev.id?<><Check size={11}/>OK</>:<><Copy size={11}/>{t('btnCopy')}</>}
                          </button>
                          <button onClick={()=>openWA(generateSmartReply(rev))} className="flex-1 flex justify-center items-center gap-1 bg-[#25D366] hover:bg-[#1dbb5a] text-white text-[10px] font-black py-2 rounded-xl">
                            <Smartphone size={11}/> WA
                          </button>
                        </div>
                        <button onClick={()=>setActiveReplyId(null)} className="w-full text-[10px] text-slate-400 font-bold">{t('btnCancel')}</button>
                      </div>
                    ):(
                      <button onClick={()=>setActiveReplyId(rev.id)} className="w-full flex items-center justify-center gap-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white font-black uppercase text-[10px] py-2.5 rounded-xl transition-all group-hover:bg-indigo-600 group-hover:text-white">
                        <Bot size={13}/> {t('btnAction')}
                      </button>
                    )}
                  </div>
                );
              }) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-3"><MessageCircle size={28} className="text-slate-300"/></div>
                  <h3 className="font-black text-slate-600 text-sm">{t('noDataTitle')}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t('noDataSub')}</p>
                </div>
              )}
            </div>
            {filteredReviews.length>9&&(
              <div className="mt-4 text-center">
                <a href={`/${locale}/dashboard/reviews`} className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm">
                  {locale==='ru'?`Ещё ${filteredReviews.length-9} отзывов`:`Mai sunt ${filteredReviews.length-9} recenzii`} <ArrowUpRight size={14}/>
                </a>
              </div>
            )}
          </div>
        </>)}
      </div>
    </div>
  );
}