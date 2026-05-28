'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, Star,
  Users, MapPin, Clock, Zap, Trophy, Medal, Award,
  ExternalLink, RefreshCw, Loader2, ThumbsUp, ThumbsDown,
  Activity, Shield, Target, Eye
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

export default function AnalyticsPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || 'ro';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [crisisAlert, setCrisisAlert] = useState(false);

  const t = {
    title: locale === 'ru' ? 'Аналитика' : 'Analytics',
    subtitle: locale === 'ru' ? 'Детальный анализ вашего бизнеса' : 'Analiză detaliată a afacerii tale',
    qrate_score: locale === 'ru' ? 'QRate Score' : 'QRate Score',
    heatmap_title: locale === 'ru' ? 'Тепловая карта отзывов' : 'Heatmap recenzii pe ore',
    heatmap_sub: locale === 'ru' ? 'Негативные отзывы по часам' : 'Recenzii negative pe ore din zi',
    locations_title: locale === 'ru' ? 'Сравнение локаций' : 'Comparativ locații',
    keywords_title: locale === 'ru' ? 'Ключевые слова (негатив)' : 'Keywords negativi',
    keywords_sub: locale === 'ru' ? 'Слова из отрицательных отзывов' : 'Cuvinte din recenzii negative',
    leaderboard_title: locale === 'ru' ? 'Топ сотрудников' : 'Leaderboard angajați',
    crisis_title: locale === 'ru' ? 'ALERTĂ CRIZĂ DETECTATĂ' : 'ALERTĂ CRIZĂ DETECTATĂ',
    crisis_sub: locale === 'ru' ? '3+ recenzii negative în ultimele 2 ore' : '3+ recenzii negative în ultimele 2 ore',
    google_title: locale === 'ru' ? 'Google vs QRate' : 'Google vs QRate',
    google_sub: locale === 'ru' ? 'Rata de conversie spre Google Reviews' : 'Rata de conversie spre Google Reviews',
    mood_title: locale === 'ru' ? 'Mood Timeline' : 'Mood Timeline',
    mood_sub: locale === 'ru' ? 'Starea de spirit pe zilele săptămânii' : 'Starea de spirit pe zilele săptămânii',
    no_data: locale === 'ru' ? 'Недостаточно данных' : 'Date insuficiente',
    loading: locale === 'ru' ? 'Se încarcă...' : 'Se încarcă...',
  };

  const fetchData = useCallback(async (cId: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const [revRes, locRes, empRes] = await Promise.all([
      supabase.from('reviews')
        .select('*, employees(name), locations(name)')
        .eq('company_id', cId)
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false }),
      supabase.from('locations').select('id, name').eq('company_id', cId),
      supabase.from('employees').select('id, name').eq('company_id', cId),
    ]);

    setReviews(revRes.data || []);
    setLocations(locRes.data || []);
    setEmployees(empRes.data || []);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
      if (company) { setCompanyId(company.id); await fetchData(company.id); }
      else setLoading(false);
    };
    init();
  }, [fetchData]);

  // ============ CALCULE ============

  // 1. QRate Score (0-100)
  const qrateScore = useMemo(() => {
    if (!reviews.length) return 0;
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    const avgScore = (avgRating / 5) * 40; // max 40 pts

    const now = Date.now();
    const last7days = reviews.filter(r => now - new Date(r.created_at).getTime() < 7 * 86400000).length;
    const frequencyScore = Math.min(last7days * 2, 20); // max 20 pts

    const positiveRate = reviews.filter(r => r.rating >= 4).length / reviews.length;
    const trendScore = positiveRate * 20; // max 20 pts

    const googleRedirects = reviews.filter(r => r.redirected_to_google).length;
    const googleScore = reviews.length > 0 ? Math.min((googleRedirects / reviews.length) * 20, 20) : 0; // max 20 pts

    return Math.round(avgScore + frequencyScore + trendScore + googleScore);
  }, [reviews]);

  const scoreColor = qrateScore >= 75 ? 'text-emerald-600' : qrateScore >= 50 ? 'text-amber-500' : 'text-rose-600';
  const scoreLabel = qrateScore >= 75 ? (locale === 'ru' ? 'Отлично' : 'Excelent') : qrateScore >= 50 ? (locale === 'ru' ? 'Бuно' : 'Bun') : (locale === 'ru' ? 'Нужно улучшение' : 'Necesită îmbunătățire');

  // 2. Heatmap orar
  const heatmapData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, negative: 0, total: 0 }));
    reviews.forEach(r => {
      const hour = new Date(r.created_at).getHours();
      hours[hour].total++;
      if (r.rating <= 2) hours[hour].negative++;
    });
    return hours.filter(h => h.total > 0);
  }, [reviews]);

  const maxNegative = Math.max(...heatmapData.map(h => h.negative), 1);

  // 3. Comparativ locații
  const locationComparison = useMemo(() => {
    return locations.map(loc => {
      const locReviews = reviews.filter(r => r.location_id === loc.id);
      const avg = locReviews.length > 0 ? locReviews.reduce((s, r) => s + r.rating, 0) / locReviews.length : 0;
      return { ...loc, avg: parseFloat(avg.toFixed(1)), count: locReviews.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [reviews, locations]);

  // 4. Keywords negativi
  const negativeKeywords = useMemo(() => {
    const negativeReviews = reviews.filter(r => r.rating <= 2 && r.comment);
    const keywords = locale === 'ru' ? NEGATIVE_KEYWORDS_RU : NEGATIVE_KEYWORDS_RO;
    const counts: Record<string, number> = {};
    negativeReviews.forEach(r => {
      const text = r.comment.toLowerCase();
      keywords.forEach(kw => {
        if (text.includes(kw)) counts[kw] = (counts[kw] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [reviews, locale]);

  // 5. Employee leaderboard
  const leaderboard = useMemo(() => {
    const empMap: Record<string, { name: string; ratings: number[] }> = {};
    reviews.forEach(r => {
      if (r.employee_id && r.employees?.name) {
        if (!empMap[r.employee_id]) empMap[r.employee_id] = { name: r.employees.name, ratings: [] };
        empMap[r.employee_id].ratings.push(r.rating);
      }
    });
    return Object.entries(empMap)
      .map(([id, data]) => ({
        id, name: data.name,
        avg: parseFloat((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)),
        count: data.ratings.length
      }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 5);
  }, [reviews]);

  // 6. Crisis alert
  useEffect(() => {
    const twoHoursAgo = Date.now() - 2 * 3600000;
    const recentNegative = reviews.filter(r => r.rating <= 2 && new Date(r.created_at).getTime() > twoHoursAgo);
    setCrisisAlert(recentNegative.length >= 3);
  }, [reviews]);

  // 7. Google vs QRate
  const googleStats = useMemo(() => {
    const total = reviews.length;
    const redirected = reviews.filter(r => r.redirected_to_google).length;
    const eligible = reviews.filter(r => r.rating >= 4).length;
    const convRate = eligible > 0 ? Math.round((redirected / eligible) * 100) : 0;
    return { total, redirected, eligible, convRate };
  }, [reviews]);

  // 8. Mood Timeline (pe zile săptămână)
  const moodTimeline = useMemo(() => {
    const days = locale === 'ru'
      ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
      : ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'];
    const dayData = Array.from({ length: 7 }, (_, i) => ({ day: days[i], ratings: [] as number[] }));
    reviews.forEach(r => {
      const dow = new Date(r.created_at).getDay();
      dayData[dow].ratings.push(r.rating);
    });
    return dayData.map(d => ({
      day: d.day,
      avg: d.ratings.length > 0 ? parseFloat((d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1)) : null,
      count: d.ratings.length
    }));
  }, [reviews, locale]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-24 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={36} />
              {t.title}
            </h1>
            <p className="text-slate-500 font-medium mt-1">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {['7d', '30d', '90d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${period === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* CRISIS ALERT */}
        {crisisAlert && (
          <div className="bg-rose-600 text-white p-5 rounded-[2rem] flex items-center gap-4 shadow-2xl shadow-rose-200 animate-pulse">
            <div className="p-3 bg-white/20 rounded-xl"><AlertTriangle size={28} /></div>
            <div>
              <p className="font-black text-lg uppercase tracking-wider">🚨 {t.crisis_title}</p>
              <p className="text-rose-100 font-medium text-sm">{t.crisis_sub}</p>
            </div>
          </div>
        )}

        {/* TOP ROW — QRate Score + Google Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* QRate Score */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={qrateScore >= 75 ? '#10b981' : qrateScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(qrateScore / 100) * 314} 314`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${scoreColor}`}>{qrateScore}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">/100</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.qrate_score}</p>
              <p className={`text-2xl font-black ${scoreColor}`}>{scoreLabel}</p>
              <div className="mt-3 space-y-1">
                {[
                  { label: locale === 'ru' ? 'Nota medie' : 'Nota medie', val: `★${reviews.length ? (reviews.reduce((s,r) => s+r.rating,0)/reviews.length).toFixed(1) : '0'}` },
                  { label: locale === 'ru' ? 'Total recenzii' : 'Total recenzii', val: reviews.length },
                  { label: 'Google redirect', val: `${googleStats.convRate}%` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
                    <span className="text-xs font-black text-slate-700">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Google vs QRate */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </div>
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight">{t.google_title}</h3>
                <p className="text-xs text-slate-400 font-medium">{t.google_sub}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: locale === 'ru' ? 'Total' : 'Total QRate', val: googleStats.total, color: 'bg-slate-100 text-slate-700' },
                { label: locale === 'ru' ? 'Eligibili Google' : 'Eligibili Google', val: googleStats.eligible, color: 'bg-blue-50 text-blue-700' },
                { label: locale === 'ru' ? 'Redirectați' : 'Redirectați', val: googleStats.redirected, color: 'bg-emerald-50 text-emerald-700' },
              ].map(item => (
                <div key={item.label} className={`${item.color} rounded-2xl p-4 text-center`}>
                  <p className="text-2xl font-black">{item.val}</p>
                  <p className="text-[9px] font-black uppercase tracking-wider mt-1 opacity-70">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase">Conversion Rate</span>
                <span className="text-lg font-black text-blue-600">{googleStats.convRate}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${googleStats.convRate}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-2">
                {locale === 'ru' ? `${googleStats.redirected} din ${googleStats.eligible} clienți eligibili au mers pe Google` : `${googleStats.redirected} din ${googleStats.eligible} clienți eligibili au mers pe Google`}
              </p>
            </div>
          </div>
        </div>

        {/* HEATMAP ORAR */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-50 rounded-xl"><Clock size={20} className="text-rose-500" /></div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight">{t.heatmap_title}</h3>
              <p className="text-xs text-slate-400 font-medium">{t.heatmap_sub}</p>
            </div>
          </div>
          {heatmapData.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-8">{t.no_data}</p>
          ) : (
            <div className="space-y-2">
              {heatmapData.sort((a, b) => a.hour - b.hour).map(h => {
                const intensity = h.negative / maxNegative;
                const isProblematic = h.negative >= 2;
                return (
                  <div key={h.hour} className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 w-12 text-right">{String(h.hour).padStart(2, '0')}:00</span>
                    <div className="flex-1 h-8 bg-slate-50 rounded-xl overflow-hidden relative">
                      <div
                        className={`h-full rounded-xl transition-all duration-500 ${intensity > 0.7 ? 'bg-rose-500' : intensity > 0.4 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.max((h.total / Math.max(...heatmapData.map(x => x.total))) * 100, 5)}%` }}
                      />
                      {isProblematic && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-600 uppercase">
                          ⚠ {h.negative} neg
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-16">{h.total} total</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {[{ color: 'bg-emerald-400', label: locale === 'ru' ? 'Normal' : 'Normal' }, { color: 'bg-amber-400', label: locale === 'ru' ? 'Atenție' : 'Atenție' }, { color: 'bg-rose-500', label: locale === 'ru' ? 'Critic' : 'Critic' }].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COMPARATIV LOCAȚII + LEADERBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Comparativ locații */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 rounded-xl"><MapPin size={20} className="text-blue-500" /></div>
              <h3 className="font-black text-lg uppercase tracking-tight">{t.locations_title}</h3>
            </div>
            {locationComparison.length < 2 ? (
              <p className="text-center text-slate-400 font-bold py-8 text-sm">
                {locale === 'ru' ? 'Нужно минимум 2 локации' : 'Necesari minim 2 locații pentru comparativ'}
              </p>
            ) : (
              <div className="space-y-4">
                {locationComparison.map((loc, idx) => {
                  const best = locationComparison[0].avg;
                  const pct = best > 0 ? (loc.avg / best) * 100 : 0;
                  const diff = idx > 0 ? (loc.avg - locationComparison[0].avg).toFixed(1) : null;
                  return (
                    <div key={loc.id} className={`p-4 rounded-2xl border-2 ${idx === 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-sm text-slate-800 uppercase truncate">{loc.name}</span>
                        <div className="flex items-center gap-2">
                          {diff && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${parseFloat(diff) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {parseFloat(diff) >= 0 ? '+' : ''}{diff}
                            </span>
                          )}
                          <span className={`font-black text-lg ${idx === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>★{loc.avg}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 block">{loc.count} {locale === 'ru' ? 'отзывов' : 'recenzii'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Employee Leaderboard */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-50 rounded-xl"><Trophy size={20} className="text-amber-500" /></div>
              <h3 className="font-black text-lg uppercase tracking-tight">{t.leaderboard_title}</h3>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-center text-slate-400 font-bold py-8 text-sm">{t.no_data}</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((emp, idx) => {
                  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                  const bgColors = ['bg-amber-50 border-amber-200', 'bg-slate-50 border-slate-200', 'bg-orange-50 border-orange-200', 'bg-slate-50 border-slate-100', 'bg-slate-50 border-slate-100'];
                  return (
                    <div key={emp.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${bgColors[idx] || 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-2xl">{medals[idx] || `${idx + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-800 uppercase truncate">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{emp.count} {locale === 'ru' ? 'отзывов' : 'recenzii'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-xl ${idx === 0 ? 'text-amber-600' : 'text-slate-700'}`}>★{emp.avg}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* KEYWORDS NEGATIVI + MOOD TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Keywords negativi */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-50 rounded-xl"><AlertTriangle size={20} className="text-rose-500" /></div>
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight">{t.keywords_title}</h3>
                <p className="text-xs text-slate-400 font-medium">{t.keywords_sub}</p>
              </div>
            </div>
            {negativeKeywords.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-black text-emerald-600 uppercase text-sm">{locale === 'ru' ? 'Nicio problemă detectată!' : 'Nicio problemă detectată!'}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{locale === 'ru' ? 'Nu există cuvinte negative frecvente' : 'Nu există cuvinte negative frecvente'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {negativeKeywords.map(([word, count]) => {
                  const maxCount = negativeKeywords[0][1];
                  const pct = (count / maxCount) * 100;
                  const isAlert = count >= 3;
                  return (
                    <div key={word} className={`p-3 rounded-xl border ${isAlert ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-black text-sm uppercase ${isAlert ? 'text-rose-700' : 'text-slate-700'}`}>
                          {isAlert && '⚠ '}{word}
                        </span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${isAlert ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'}`}>
                          {count}x
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isAlert ? 'bg-rose-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mood Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 rounded-xl"><Activity size={20} className="text-indigo-500" /></div>
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight">{t.mood_title}</h3>
                <p className="text-xs text-slate-400 font-medium">{t.mood_sub}</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-40">
              {moodTimeline.map(d => {
                const height = d.avg ? ((d.avg - 1) / 4) * 100 : 0;
                const color = !d.avg ? 'bg-slate-100' : d.avg >= 4 ? 'bg-emerald-500' : d.avg >= 3 ? 'bg-amber-400' : 'bg-rose-500';
                const emoji = !d.avg ? '—' : d.avg >= 4 ? '😊' : d.avg >= 3 ? '😐' : '😞';
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-base">{emoji}</span>
                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                      <div className={`w-full rounded-t-xl transition-all duration-700 ${color}`} style={{ height: `${Math.max(height, d.avg ? 8 : 4)}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">{d.day}</span>
                    <span className="text-[9px] font-bold text-slate-400">{d.avg ? `★${d.avg}` : '-'}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
              {[{ emoji: '😊', label: '≥4★' }, { emoji: '😐', label: '3★' }, { emoji: '😞', label: '≤2★' }].map(item => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}