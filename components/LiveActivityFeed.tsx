// components/LiveActivityFeed.tsx
// Pop-up animat în colțul ecranului când vine o recenzie nouă
// Folosește Supabase Realtime

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, MapPin, X, Zap } from 'lucide-react';

interface LiveReview {
  id: string;
  rating: number;
  comment?: string | null;
  full_name?: string | null;
  created_at: string;
  locations?: { name: string } | null;
}

interface LiveActivityFeedProps {
  companyId: string;
  locale?: string;
}

const STAR_COLORS: Record<number, string> = {
  5: 'text-emerald-400 fill-emerald-400',
  4: 'text-emerald-400 fill-emerald-400',
  3: 'text-amber-400 fill-amber-400',
  2: 'text-rose-400 fill-rose-400',
  1: 'text-rose-400 fill-rose-400',
};

const RATING_BG: Record<number, string> = {
  5: 'border-emerald-200 bg-emerald-50',
  4: 'border-emerald-200 bg-emerald-50',
  3: 'border-amber-200 bg-amber-50',
  2: 'border-rose-200 bg-rose-50',
  1: 'border-rose-200 bg-rose-50',
};

const RATING_BAR: Record<number, string> = {
  5: 'bg-emerald-500',
  4: 'bg-emerald-500',
  3: 'bg-amber-400',
  2: 'bg-rose-500',
  1: 'bg-rose-500',
};

export default function LiveActivityFeed({ companyId, locale = 'ro' }: LiveActivityFeedProps) {
  const [queue, setQueue] = useState<LiveReview[]>([]);
  const [current, setCurrent] = useState<LiveReview | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Procesează coada — arată un pop-up pe rând
  useEffect(() => {
    if (current || queue.length === 0) return;

    const next = queue[0];
    setQueue(prev => prev.slice(1));
    setCurrent(next);
    setVisible(true);
    setDismissed(false);

    // Auto-dismiss după 6 secunde
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => { setCurrent(null); }, 400);
    }, 6000);

    return () => clearTimeout(timer);
  }, [queue, current]);

  // Supabase Realtime
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`live:reviews:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `company_id=eq.${companyId}`
        },
        async (payload: any) => {
          // Fetch detalii complete cu locație
          const { data } = await supabase
            .from('reviews')
            .select('id, rating, comment, full_name, created_at, locations(name)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setQueue(prev => [...prev, data as LiveReview]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    setTimeout(() => { setCurrent(null); }, 400);
  }, []);

  if (!current) return null;

  const ratingBg = RATING_BG[current.rating] || RATING_BG[3];
  const starColor = STAR_COLORS[current.rating] || STAR_COLORS[3];
  const ratingBar = RATING_BAR[current.rating] || RATING_BAR[3];
  const clientName = current.full_name || (locale === 'ru' ? 'Client Anonim' : 'Client Anonim');
  const timeStr = new Date(current.created_at).toLocaleTimeString(
    locale === 'ru' ? 'ru-RU' : 'ro-RO',
    { hour: '2-digit', minute: '2-digit' }
  );
  const shortComment = current.comment && current.comment.length > 60
    ? current.comment.substring(0, 60) + '...'
    : current.comment;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] transition-all duration-500 ${
        visible && !dismissed
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
      style={{ maxWidth: '320px', width: 'calc(100vw - 48px)' }}
    >
      <div className={`bg-white rounded-3xl border-2 shadow-2xl overflow-hidden ${ratingBg}`}>
        {/* Bara colorată sus */}
        <div className={`h-1 w-full ${ratingBar}`} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-xl">
                <Zap size={12} className="text-white fill-white" />
              </div>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
                {locale === 'ru' ? 'Recenzie Nouă!' : 'Recenzie Nouă!'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">{timeStr}</span>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Client + Rating */}
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <p className="font-black text-sm text-slate-900 uppercase tracking-tight truncate">
                {clientName}
              </p>
              {current.locations?.name && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-slate-400 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 truncate">
                    {current.locations.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              <span className="font-black text-xl text-slate-900">{current.rating}</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} className={i <= current.rating ? starColor : 'text-slate-200 fill-slate-200'} />
                ))}
              </div>
            </div>
          </div>

          {/* Comentariu */}
          {shortComment && (
            <p className="text-xs text-slate-600 font-medium italic leading-relaxed bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              "{shortComment}"
            </p>
          )}

          {/* Progress bar auto-dismiss */}
          <div className="mt-3 h-0.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${ratingBar} rounded-full`}
              style={{
                animation: visible ? 'progress 6s linear forwards' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Counter dacă sunt mai multe în coadă */}
      {queue.length > 0 && (
        <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
          {queue.length}
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}