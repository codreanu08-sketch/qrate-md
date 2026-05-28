'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  BarChart3, AlertTriangle, Star, MapPin, Clock,
  Trophy, Activity, Loader2, TrendingUp, TrendingDown, ExternalLink
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  full_name?: string;
  phone?: string;
  location_id: string;
  employee_id: string;
  redirected_to_google?: boolean;
  employees: { name: string } | null;
  locations: { name: string } | null;
}

const NEGATIVE_KEYWORDS_RO = ['lent', 'rece', 'așteptat', 'târziu', 'murdar', 'nepoliticos', 'groaznic', 'oribil', 'dezamăgit', 'neplăcut', 'frig', 'greșit', 'prost', 'îngrozitor', 'scump'];
const NEGATIVE_KEYWORDS_RU = ['медленно', 'холодный', 'ждал', 'грязно', 'грубый', 'ужасно', 'плохо', 'разочарован', 'неприятно', 'дорого', 'неправильно', 'отвратительно'];

export default function AnalyticsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ro';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [crisisAlert, setCrisisAlert] = useState(false);

  const fetchData = useCallback(async (cId: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const [revRes, locRes] = await Promise.all([
      supabase.from('reviews').select('*, employees(name), locations(name)').eq('company_id', cId).gte('created_at', cutoff.toISOString()).order('created_at', { ascending: false }),
      supabase.from('locations').select('id, name').eq('company_id', cId),
    ]);
    setReviews(revRes.data || []);
    setLocations(locRes.data || []);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
      if (company) await fetchData(company.id);
      else setLoading(false);
    };
    init();
  }, [fetchData]);

  // QRate Score
  const qrateScore = useMemo(() => {
    if (!reviews.length) return 0;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    const avgScore = (avg / 5) * 40;
    const last7 = reviews.filter(r => Date.now() - new Date(r.created_at).getTime() < 7 * 86400000).length;
    const freqScore = Math.min(last7 * 2, 20);
    const posRate = reviews.filter(r => r.rating >= 4).length / reviews.length;
    const trendScore = posRate * 20;
    const googleScore = Math.min((reviews.filter(r => r.redirected_to_google).length / reviews.length) * 20, 20);
    return Math.round(avgScore + freqScore + trendScore + googleScore);
  }, [reviews]);

  const scoreColor = qrateScore >= 75 ? '#10b981' : qrateScore >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = qrateScore >= 75 ? (locale === 'ru' ? 'Отлично' : 'Excelent') : qrateScore >= 50 ? (locale === 'ru' ? 'Bun' : 'Bun') : (locale === 'ru' ? 'Necesită îmbunătățire' : 'Necesită îmbunătățire');

  // Heatmap
  const heatmapData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, negative: 0, total: 0 }));
    reviews.forEach(r => {
      const h = new Date(r.created_at).getHours();
      hours[h].total++;
      if (r.rating <= 2) hours[h].negative++;
    });
    return hours.filter(h => h.total > 0);
  }, [reviews]);
  const maxTotal = Math.max(...heatmapData.map(h => h.total), 1);

  // Location comparison
  const locationComparison = useMemo(() => {
    return locations.map(loc => {
      const lr = reviews.filter(r => r.location_id === loc.id);
      const avg = lr.length > 0 ? lr.reduce((s, r) => s + r.rating, 0) / lr.length : 0;
      return { ...loc, avg: parseFloat(avg.toFixed(1)), count: lr.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [reviews, locations]);

  // Keywords
  const negativeKeywords = useMemo(() => {
    const neg = reviews.filter(r => r.rating <= 2 && r.comment);
    const kws = locale === 'ru' ? NEGATIVE_KEYWORDS_RU : NEGATIVE_KEYWORDS_RO;
    const counts: Record<string, number> = {};
    neg.forEach(r => { const t = r.comment.toLowerCase(); kws.forEach(k => { if (t.includes(k)) counts[k] = (counts[k] || 0) + 1; }); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [reviews, locale]);

  // Leaderboard
  const leaderboard = useMemo(() => {
    const m: Record<string, { name: string; ratings: number[] }> = {};
    reviews.forEach(r => {
      if (r.employee_id && r.employees?.name) {
        if (!m[r.employee_id]) m[r.employee_id] = { name: r.employees.name, ratings: [] };
        m[r.employee_id].ratings.push(r.rating);
      }
    });
    return Object.entries(m).map(([id, d]) => ({
      id, name: d.name,
      avg: parseFloat((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1)),
      count: d.ratings.length
    })).sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [reviews]);

  // Crisis
  useEffect(() => {
    const t2h = Date.now() - 2 * 3600000;
    setCrisisAlert(reviews.filter(r => r.rating <= 2 && new Date(r.created_at).getTime() > t2h).length >= 3);
  }, [reviews]);

  // Google stats
  const googleStats = useMemo(() => {
    const total = reviews.length;
    const redirected = reviews.filter(r => r.redirected_to_google).length;
    const eligible = reviews.filter(r => r.rating >= 4).length;
    const convRate = eligible > 0 ? Math.round((redirected / eligible) * 100) : 0;
    return { total, redirected, eligible, convRate };
  }, [reviews]);

  // Mood timeline
  const moodTimeline = useMemo(() => {
    const days = locale === 'ru' ? ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'] : ['Du','Lu','Ma','Mi','Jo','Vi','Sâ'];
    const d = Array.from({ length: 7 }, (_, i) => ({ day: days[i], ratings: [] as number[] }));
    reviews.forEach(r => { d[new Date(r.created_at).getDay()].ratings.push(r.rating); });
    return d.map(x => ({ day: x.day, avg: x.ratings.length > 0 ? parseFloat((x.ratings.reduce((a,b)=>a+b,0)/x.ratings.length).toFixed(1)) : null, count: x.ratings.length }));
  }, [reviews, locale]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-32 md:pb-12 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={28} />
              {locale === 'ru' ? 'Аналитика' : 'Analytics'}
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-0.5">
              {locale === 'ru' ? 'Детальный анализ бизнеса' : 'Analiză detaliată a afacerii'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {['7d','30d','90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${period === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* CRISIS */}
        {crisisAlert && (
          <div className="bg-rose-600 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-rose-200 animate-pulse">
            <AlertTriangle size={24} />
            <div>
              <p className="font-black text-sm uppercase">🚨 {locale === 'ru' ? 'Кризис обнаружен!' : 'Criză detectată!'}</p>
              <p className="text-rose-100 text-xs font-medium">{locale === 'ru' ? '3+ отзыва ≤2★ за 2 часа' : '3+ recenzii ≤2★ în ultimele 2 ore'}</p>
            </div>
          </div>
        )}

        {/* QRATE SCORE + GOOGLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* QRate Score */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="14"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${(qrateScore/100)*314} 314`}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black" style={{ color: scoreColor }}>{qrateScore}</span>
                <span className="text-[8px] font-black text-slate-400">/100</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">QRate Score</p>
              <p className="text-lg font-black" style={{ color: scoreColor }}>{scoreLabel}</p>
              <div className="mt-2 space-y-1">
                {[
                  { l: locale === 'ru' ? 'Nota medie' : 'Nota medie', v: `★${reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : '0'}` },
                  { l: locale === 'ru' ? 'Total recenzii' : 'Total', v: reviews.length },
                  { l: 'Google %', v: `${googleStats.convRate}%` },
                ].map(x => (
                  <div key={x.l} className="flex justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">{x.l}</span>
                    <span className="text-[10px] font-black text-slate-700">{x.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Google Stats */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <p className="font-black text-sm uppercase tracking-tight">Google vs QRate</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: 'QRate', v: googleStats.total, c: 'bg-slate-100 text-slate-700' },
                { l: locale === 'ru' ? 'Eligibili' : 'Eligibili', v: googleStats.eligible, c: 'bg-blue-50 text-blue-700' },
                { l: locale === 'ru' ? 'Google' : 'Google', v: googleStats.redirected, c: 'bg-emerald-50 text-emerald-700' },
              ].map(x => (
                <div key={x.l} className={`${x.c} rounded-2xl p-3 text-center`}>
                  <p className="text-xl font-black">{x.v}</p>
                  <p className="text-[9px] font-black uppercase mt-0.5 opacity-70">{x.l}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-2xl p-3">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase">Conversion</span>
                <span className="text-sm font-black text-blue-600">{googleStats.convRate}%</span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${googleStats.convRate}%` }}/>
              </div>
            </div>
          </div>
        </div>

        {/* HEATMAP */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-rose-50 rounded-xl"><Clock size={18} className="text-rose-500"/></div>
            <div>
              <p className="font-black text-sm uppercase">{locale === 'ru' ? 'Тепловая карта' : 'Heatmap orar'}</p>
              <p className="text-[10px] text-slate-400 font-medium">{locale === 'ru' ? 'Отрицательные отзывы по часам' : 'Recenzii negative pe ore'}</p>
            </div>
          </div>
          {heatmapData.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-6 text-sm">{locale === 'ru' ? 'Недостаточно данных' : 'Date insuficiente'}</p>
          ) : (
            <div className="space-y-2">
              {heatmapData.sort((a,b) => a.hour - b.hour).map(h => {
                const pct = (h.total / maxTotal) * 100;
                const isProb = h.negative >= 2;
                const color = h.negative / Math.max(h.total, 1) > 0.5 ? 'bg-rose-500' : h.negative > 0 ? 'bg-amber-400' : 'bg-emerald-400';
                return (
                  <div key={h.hour} className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 w-10 text-right">{String(h.hour).padStart(2,'0')}h</span>
                    <div className="flex-1 h-7 bg-slate-50 rounded-xl overflow-hidden relative">
                      <div className={`h-full rounded-xl ${color}`} style={{ width: `${Math.max(pct, 4)}%` }}/>
                      {isProb && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-600">⚠ {h.negative}</span>}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-8">{h.total}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LOCATIONS + LEADERBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Locations */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-50 rounded-xl"><MapPin size={18} className="text-blue-500"/></div>
              <p className="font-black text-sm uppercase">{locale === 'ru' ? 'Сравнение локаций' : 'Comparativ locații'}</p>
            </div>
            {locationComparison.length < 2 ? (
              <p className="text-center text-slate-400 font-bold py-6 text-xs">{locale === 'ru' ? 'Нужно минимум 2 локации' : 'Minim 2 locații pentru comparativ'}</p>
            ) : (
              <div className="space-y-3">
                {locationComparison.map((loc, i) => {
                  const pct = locationComparison[0].avg > 0 ? (loc.avg / locationComparison[0].avg) * 100 : 0;
                  const diff = i > 0 ? (loc.avg - locationComparison[0].avg).toFixed(1) : null;
                  return (
                    <div key={loc.id} className={`p-3 rounded-2xl border-2 ${i === 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100'}`}>
                      <div className="flex justify-between mb-2">
                        <span className="font-black text-xs text-slate-800 uppercase truncate flex-1 mr-2">{loc.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {diff && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ${parseFloat(diff) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{parseFloat(diff) >= 0 ? '+' : ''}{diff}</span>}
                          <span className={`font-black text-base ${i === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>★{loc.avg}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1 block">{loc.count} {locale === 'ru' ? 'отзывов' : 'recenzii'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-amber-50 rounded-xl"><Trophy size={18} className="text-amber-500"/></div>
              <p className="font-black text-sm uppercase">{locale === 'ru' ? 'Топ сотрудников' : 'Leaderboard angajați'}</p>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-center text-slate-400 font-bold py-6 text-xs">{locale === 'ru' ? 'Нет данных' : 'Date insuficiente'}</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((emp, i) => {
                  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
                  const bgs = ['bg-amber-50 border-amber-200','bg-slate-50 border-slate-200','bg-orange-50 border-orange-200','bg-slate-50 border-slate-100','bg-slate-50 border-slate-100'];
                  return (
                    <div key={emp.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${bgs[i]}`}>
                      <span className="text-xl shrink-0">{medals[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs text-slate-800 uppercase truncate">{emp.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{emp.count} {locale === 'ru' ? 'отз.' : 'rec.'}</p>
                      </div>
                      <span className={`font-black text-lg shrink-0 ${i === 0 ? 'text-amber-600' : 'text-slate-700'}`}>★{emp.avg}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* KEYWORDS + MOOD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Keywords */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-rose-50 rounded-xl"><AlertTriangle size={18} className="text-rose-500"/></div>
              <div>
                <p className="font-black text-sm uppercase">{locale === 'ru' ? 'Проблемные слова' : 'Keywords negativi'}</p>
                <p className="text-[10px] text-slate-400 font-medium">{locale === 'ru' ? 'Из отрицательных отзывов' : 'Din recenzii negative'}</p>
              </div>
            </div>
            {negativeKeywords.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-black text-emerald-600 text-sm">{locale === 'ru' ? 'Всё отлично!' : 'Nicio problemă detectată!'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {negativeKeywords.map(([word, count]) => {
                  const maxC = negativeKeywords[0][1];
                  const isAlert = count >= 3;
                  return (
                    <div key={word} className={`p-3 rounded-xl border ${isAlert ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex justify-between mb-1.5">
                        <span className={`font-black text-xs uppercase ${isAlert ? 'text-rose-700' : 'text-slate-700'}`}>{isAlert && '⚠ '}{word}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${isAlert ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>{count}x</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isAlert ? 'bg-rose-500' : 'bg-slate-400'}`} style={{ width: `${(count/maxC)*100}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mood Timeline */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-indigo-50 rounded-xl"><Activity size={18} className="text-indigo-500"/></div>
              <div>
                <p className="font-black text-sm uppercase">Mood Timeline</p>
                <p className="text-[10px] text-slate-400 font-medium">{locale === 'ru' ? 'По дням недели' : 'Pe zile săptămână'}</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-1 h-32">
              {moodTimeline.map(d => {
                const h = d.avg ? ((d.avg-1)/4)*100 : 0;
                const color = !d.avg ? 'bg-slate-100' : d.avg >= 4 ? 'bg-emerald-500' : d.avg >= 3 ? 'bg-amber-400' : 'bg-rose-500';
                const emoji = !d.avg ? '—' : d.avg >= 4 ? '😊' : d.avg >= 3 ? '😐' : '😞';
                return (
                  <div key={d.day} className="flex flex-col items-center gap-0.5 flex-1">
                    <span className="text-sm">{emoji}</span>
                    <div className="w-full flex items-end" style={{ height: '64px' }}>
                      <div className={`w-full rounded-t-lg ${color}`} style={{ height: `${Math.max(h, d.avg ? 10 : 4)}%` }}/>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase">{d.day}</span>
                    <span className="text-[8px] font-bold text-slate-400">{d.avg ? `★${d.avg}` : '-'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}