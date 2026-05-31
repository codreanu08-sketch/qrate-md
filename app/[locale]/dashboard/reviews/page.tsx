'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { 
  MapPin, User, Star, Loader2, Lock, 
  Calendar as CalendarIcon, MessageSquare, Phone,
  Trophy, ChevronLeft, ChevronRight, Download, Zap, X, Eye,
  Bot, Copy, Check, Smartphone, Camera, Image as ImageIcon
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  location_id: string;
  employee_id?: string | null;
  photo_url?: string | null;
  full_name?: string | null;
  phone?: string | null;
  redirected_to_google?: boolean;
  is_recovery_win?: boolean;
  locations?: { name: string } | null;
  employees?: { name: string; position: string; photo_url: string } | null;
}

interface BasicInfo { id: string; name: string; }

function generateScreenshot(rev: Review, companyName: string, locale: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    if (rev.rating >= 4) { gradient.addColorStop(0, '#ecfdf5'); gradient.addColorStop(1, '#d1fae5'); }
    else if (rev.rating === 3) { gradient.addColorStop(0, '#fffbeb'); gradient.addColorStop(1, '#fef3c7'); }
    else { gradient.addColorStop(0, '#fff1f2'); gradient.addColorStop(1, '#ffe4e6'); }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 20;
    roundRect(ctx, 80, 80, 920, 920, 48);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = rev.rating >= 4 ? '#10b981' : rev.rating === 3 ? '#f59e0b' : '#ef4444';
    roundRectTop(ctx, 80, 80, 920, 16, 48);
    ctx.fill();
    ctx.fillStyle = rev.rating >= 4 ? '#d1fae5' : rev.rating === 3 ? '#fef3c7' : '#ffe4e6';
    ctx.font = 'bold 180px serif';
    ctx.fillText('"', 120, 340);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 52px system-ui, sans-serif';
    const comment = rev.comment || 'Experiență excelentă!';
    const maxWidth = 800;
    const words = comment.split(' ');
    let line = '';
    let y = 340;
    const lineHeight = 72;
    const lines: string[] = [];
    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line !== '') { lines.push(line.trim()); line = word + ' '; }
      else { line = testLine; }
    }
    lines.push(line.trim());
    const maxLines = 5;
    const displayLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) displayLines[maxLines - 1] += '...';
    displayLines.forEach((l, i) => { ctx.fillText(l, 140, y + i * lineHeight); });
    const starY = 630;
    const starColor = rev.rating >= 4 ? '#10b981' : rev.rating === 3 ? '#f59e0b' : '#ef4444';
    ctx.font = 'bold 64px system-ui';
    ctx.fillStyle = starColor;
    ctx.fillText('★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating), 140, starY);
    ctx.font = 'black 120px system-ui, sans-serif';
    ctx.fillStyle = starColor;
    ctx.textAlign = 'right';
    ctx.fillText(`${rev.rating}/5`, 940, starY + 10);
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 680);
    ctx.lineTo(940, 680);
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'black 44px system-ui, sans-serif';
    ctx.fillText(rev.full_name || 'Client Anonim', 140, 750);
    if (rev.locations?.name) { ctx.fillStyle = '#64748b'; ctx.font = '500 36px system-ui, sans-serif'; ctx.fillText(`📍 ${rev.locations.name}`, 140, 810); }
    const dateStr = new Date(rev.created_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 32px system-ui, sans-serif';
    ctx.fillText(dateStr, 140, 860);
    ctx.fillStyle = starColor;
    ctx.font = 'black 36px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('QRate.md', 940, 940);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 26px system-ui, sans-serif';
    ctx.fillText(companyName, 940, 975);
    ctx.textAlign = 'left';
    resolve(canvas.toDataURL('image/png', 1.0));
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function ReviewCard({ rev, locale, companyName, onViewPhoto }: {
  rev: Review; locale: string; companyName?: string; onViewPhoto?: (url: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const ratingBg = rev.rating >= 4 ? 'bg-emerald-50 border-emerald-200' : rev.rating === 3 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';
  const ratingBar = rev.rating >= 4 ? 'bg-emerald-500' : rev.rating === 3 ? 'bg-amber-400' : 'bg-rose-500';
  const ratingText = rev.rating >= 4 ? 'text-emerald-700' : rev.rating === 3 ? 'text-amber-700' : 'text-rose-700';
  const starColor = rev.rating >= 4 ? 'text-emerald-400 fill-emerald-400' : rev.rating === 3 ? 'text-amber-400 fill-amber-400' : 'text-rose-400 fill-rose-400';
  const clientName = rev.full_name || (locale === 'ru' ? 'Клиент' : 'Client');
  const empName = rev.employees?.name;

  const replyText = rev.rating >= 4
    ? (locale === 'ru'
      ? `Здравствуйте, ${clientName}! Спасибо за оценку ${rev.rating}★${empName ? ` нашему сотруднику (${empName})` : ''}! Ждём вас снова!`
      : `Bună ziua, ${clientName}! Vă mulțumim pentru evaluarea de ${rev.rating}★${empName ? ` acordată colegului nostru (${empName})` : ''}! Vă mai așteptăm!`)
    : (locale === 'ru'
      ? `Здравствуйте, ${clientName}, нам жаль, что вы поставили ${rev.rating}★. Мы принимаем это близко к сердцу${empName ? ` и обсудим с сотрудником (${empName})` : ''}. Спасибо за отзыв!`
      : `Bună ziua, ${clientName}, ne pare rău pentru evaluarea de ${rev.rating}★. Luăm acest lucru foarte în serios${empName ? ` și vom discuta cu ${empName}` : ''}. Mulțumim pentru feedback!`);

  const followUpText = locale === 'ru'
    ? `Здравствуйте, ${clientName}! 👋\n\nМы заметили, что ваш визит в ${companyName || 'нашу компанию'} не оправдал ожиданий (${rev.rating}★).\n\nМы хотим исправить ситуацию. Что произошло?\n\nСпасибо! 🙏`
    : `Bună ziua, ${clientName}! 👋\n\nAm observat că vizita dvs. la ${companyName || 'noi'} nu a fost pe măsura așteptărilor (${rev.rating}★).\n\nDorim să remediem situația. Ce s-a întâmplat?\n\nVă mulțumim! 🙏`;

  const handleCopy = () => { navigator.clipboard.writeText(replyText); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const handleWhatsAppReply = () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(replyText)}`, '_blank');
  const handleWhatsAppContact = () => {
    if (!rev.phone) return;
    const phone = rev.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('373') ? phone : `373${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(followUpText)}`, '_blank');
  };
  const handleGenerateScreenshot = async () => {
    setGenerating(true);
    try { const url = await generateScreenshot(rev, companyName || 'QRate.md', locale); setPreviewUrl(url); }
    catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };
  const handleDownloadScreenshot = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `QRate-Review-${rev.id.slice(0, 8)}.png`;
    link.click();
  };

  const date = new Date(rev.created_at);
  const dateStr = date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'ro-RO', { day: '2-digit', month: 'short', year: '2-digit' });
  const timeStr = date.toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'ro-RO', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${ratingBg}`}>
        <div className={`h-1 w-full ${ratingBar}`} />
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border ${ratingBg}`}>
                <span className={`text-lg font-black leading-none ${ratingText}`}>{rev.rating}</span>
                <Star size={13} className={starColor} />
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= rev.rating ? starColor : 'text-slate-200 fill-slate-200'} />)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {rev.is_recovery_win && <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">🏆 Win</span>}
              {rev.redirected_to_google && (
                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 shrink-0"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </span>
              )}
              <div className="text-right">
                <p className="text-xs font-black text-slate-700 leading-none">{timeStr}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{dateStr}</p>
              </div>
            </div>
          </div>

          <div className="mb-3 min-h-[24px]">
            {rev.comment && rev.comment !== 'Clientul nu a lăsat un comentariu' && rev.comment !== 'Клиент не оставил комментария' ? (
              <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{rev.comment}"</p>
            ) : (
              <p className="text-sm text-slate-300 italic">— {locale === 'ru' ? 'Без комментария' : 'Fără comentariu'} —</p>
            )}
          </div>

          {rev.photo_url && rev.photo_url.trim() !== '' && rev.photo_url !== 'NULL' && (
            <div className="mb-3">
              <div onClick={() => onViewPhoto?.(rev.photo_url!)} className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer border border-slate-200 group/img">
                <img src={rev.photo_url} alt="Review" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"><Eye size={12} className="text-white" /></div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {rev.full_name && rev.full_name.trim() !== '' && rev.full_name !== 'EMPTY' && (
              <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl">
                <User size={10} className="text-slate-400 shrink-0" />
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{rev.full_name}</span>
              </div>
            )}
            {rev.phone && rev.phone.trim() !== '' && rev.phone !== 'EMPTY' && (
              <a href={`tel:${rev.phone}`} className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition-colors">
                <Phone size={10} className="text-blue-500 shrink-0" />
                <span className="text-[10px] font-black text-blue-700 tracking-tight">{rev.phone}</span>
              </a>
            )}
            {rev.employees?.name && (
              <div className="flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-xl">
                <User size={10} className="text-indigo-400 shrink-0" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight truncate max-w-[90px]">{rev.employees.name}</span>
              </div>
            )}
            {rev.locations?.name && (
              <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl">
                <MapPin size={10} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight truncate max-w-[90px]">{rev.locations.name}</span>
              </div>
            )}
          </div>

          {!replyOpen ? (
            <div className="flex gap-2">
              <button onClick={() => setReplyOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all">
                <Bot size={13} /> {locale === 'ru' ? 'AI Ответ' : 'AI Răspuns'}
              </button>
              {rev.rating >= 4 && (
                <button onClick={handleGenerateScreenshot} disabled={generating}
                  className="flex items-center justify-center gap-1.5 bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl transition-all">
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  <span className="hidden sm:inline">Post</span>
                </button>
              )}
              {rev.phone && rev.phone.trim() !== '' && rev.rating <= 3 && (
                <button onClick={handleWhatsAppContact}
                  className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl transition-all">
                  <Smartphone size={13} />
                  <span className="hidden sm:inline">{locale === 'ru' ? 'Contact' : 'Contact'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs text-slate-600 font-medium italic leading-relaxed">"{replyText}"</p>
              <div className="flex gap-2">
                <button onClick={handleCopy}
                  className={`flex-1 flex justify-center items-center gap-1.5 text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                  {copied ? <><Check size={12} /> {locale === 'ru' ? 'Скопировано!' : 'Copiat!'}</> : <><Copy size={12} /> {locale === 'ru' ? 'Копировать' : 'Copiază'}</>}
                </button>
                <button onClick={handleWhatsAppReply}
                  className="flex-1 flex justify-center items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-all">
                  <Smartphone size={12} /> WhatsApp
                </button>
              </div>
              <button onClick={() => setReplyOpen(false)} className="w-full text-[10px] text-slate-400 hover:text-slate-600 font-bold transition-colors">
                {locale === 'ru' ? 'Отмена' : 'Anulează'}
              </button>
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <p className="font-black text-sm uppercase tracking-wider text-slate-800">📸 Preview — Imagine Social Media</p>
              <button onClick={() => setPreviewUrl(null)} className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4">
              <img src={previewUrl} alt="Screenshot" className="w-full rounded-2xl border border-slate-100" />
              <div className="mt-4 flex gap-3">
                <button onClick={handleDownloadScreenshot}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all">
                  <Download size={16} /> Descarcă PNG
                </button>
                <button onClick={() => { handleDownloadScreenshot(); setPreviewUrl(null); }}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-2xl transition-all">
                  <Check size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">1080×1080px — perfect pentru Instagram, Facebook</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ label, icon, value, onChange, options, allLabel }: any) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">{label}</span>
      <div className="flex items-center gap-2 bg-gray-50 px-3.5 rounded-xl border border-gray-200/60 h-11 w-full">
        <div className="text-gray-400 shrink-0">{icon}</div>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent border-none text-xs font-black text-gray-700 outline-none cursor-pointer p-0 focus:ring-0 w-full">
          <option value="all">{allLabel}</option>
          {options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="bg-gray-50 w-11 h-11 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <h3 className="text-xl font-black text-gray-900 truncate leading-none">{value}</h3>
      </div>
    </div>
  );
}

export default function AllReviewsDashboard() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';

  const t = useTranslations('AdminReviews');
  const tStats = useTranslations('EmployeeStats.stats');
  const tCommon = useTranslations('Dashboard');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<BasicInfo[]>([]);
  const [employees, setEmployees] = useState<BasicInfo[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '1m' | '3m' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const smartStats = useMemo(() => {
    if (reviews.length === 0) return { bestEmp: 'N/A', avg: '0.0', count: 0 };
    const empMap: Record<string, { total: number; count: number }> = {};
    reviews.forEach(r => {
      if (r.employees?.name) {
        if (!empMap[r.employees.name]) empMap[r.employees.name] = { total: 0, count: 0 };
        empMap[r.employees.name].total += r.rating;
        empMap[r.employees.name].count += 1;
      }
    });
    let bestEmp = locale === 'ru' ? 'Команда' : 'Echipa';
    let maxAvg = 0;
    Object.entries(empMap).forEach(([name, d]) => { const avg = d.total / d.count; if (avg > maxAvg) { maxAvg = avg; bestEmp = name; } });
    return { bestEmp, avg: (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1), count: reviews.length };
  }, [reviews, locale]);

  // ✅ FIX PRINCIPAL — verifică toate câmpurile + admin bypass
  const checkAccessAndCompany = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/${locale}/login`); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, subscription_tier, is_admin, is_subscribed, subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (company) { setCompanyId(company.id); setCompanyName(company.name || ''); }

    if (profile) {
      // ✅ Admin + toate condițiile posibile
      const isPro =
        profile.is_admin === true ||
        profile.subscription_tier === 'pro' ||
        profile.is_subscribed === true ||
        profile.subscription_status === 'ACTIVE';

      const trialEnd = profile.trial_ends_at
        ? new Date(profile.trial_ends_at)
        : new Date(new Date(profile.created_at).getTime() + 7 * 86400000);

      setHasAccess(isPro || trialEnd.getTime() > Date.now());
    } else {
      setHasAccess(true); // fail-open: dacă profilul nu se găsește, acordă acces
    }
  }, [locale, router]);

  const loadInitialData = useCallback(async (cId: string) => {
    const [locRes, empRes] = await Promise.all([
      supabase.from('locations').select('id, name').eq('company_id', cId).order('name'),
      supabase.from('employees').select('id, name').eq('company_id', cId).order('name')
    ]);
    setLocations(locRes.data || []);
    setEmployees(empRes.data || []);
  }, []);

  const loadReviews = useCallback(async () => {
    if (!companyId || hasAccess === false) return;
    setLoading(true);
    let query = supabase.from('reviews')
      .select(`id, rating, comment, created_at, location_id, employee_id, photo_url, full_name, phone, redirected_to_google, is_recovery_win, locations(name), employees(name, position, photo_url)`)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (selectedLocation !== 'all') query = query.eq('location_id', selectedLocation);
    if (selectedEmployee !== 'all') query = query.eq('employee_id', selectedEmployee);
    if (timeFilter === 'custom' && customDate) {
      query = query.gte('created_at', `${customDate}T00:00:00Z`).lte('created_at', `${customDate}T23:59:59Z`);
    } else if (timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === '7d') now.setDate(now.getDate() - 7);
      else if (timeFilter === '1m') now.setMonth(now.getMonth() - 1);
      else if (timeFilter === '3m') now.setMonth(now.getMonth() - 3);
      query = query.gte('created_at', now.toISOString());
    }
    const { data } = await query;
    setReviews((data as unknown as Review[]) || []);
    setLoading(false);
  }, [selectedLocation, selectedEmployee, hasAccess, companyId, timeFilter, customDate]);

  const handleExportCSV = () => {
    if (reviews.length === 0) return;
    const headers = ['Data', 'Rating', 'Client', 'Telefon', 'Comentariu', 'Locatie', 'Angajat'];
    const rows = reviews.map(r => [new Date(r.created_at).toLocaleDateString(), r.rating, `"${r.full_name || 'Anonim'}"`, `"${r.phone || 'N/A'}"`, `"${r.comment?.replace(/"/g, '""') || ''}"`, r.locations?.name || 'General', r.employees?.name || 'Fără angajat']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a'); link.setAttribute('href', encodeURI(csvContent)); link.setAttribute('download', `QRate_Reviews_${timeFilter}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  useEffect(() => { checkAccessAndCompany(); }, [checkAccessAndCompany]);
  useEffect(() => { if (companyId) loadInitialData(companyId); }, [companyId, loadInitialData]);
  useEffect(() => { if (hasAccess === true && companyId) loadReviews(); }, [loadReviews, hasAccess, companyId]);
  useEffect(() => { setCurrentPage(1); }, [selectedLocation, selectedEmployee, timeFilter, customDate]);

  const paginatedReviews = useMemo(() => reviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [reviews, currentPage]);
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE) || 1;
  const followUpsNeeded = useMemo(() => reviews.filter(r => r.rating <= 2 && r.phone && r.phone.trim() !== ''), [reviews]);

  if (hasAccess === null) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {!hasAccess ? (
          <div className="min-h-[70vh] flex items-center justify-center text-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-md w-full">
              <Lock className="text-red-500 mx-auto mb-6" size={40} />
              <h2 className="text-3xl font-black mb-3 tracking-tight">Trial Expirat</h2>
              <p className="text-gray-500 mb-8 font-medium text-sm">{locale === 'ru' ? 'Activați un plan pentru acces.' : 'Activează un plan pentru a continua.'}</p>
              <button onClick={() => router.push(`/${locale}/dashboard/subscription`)} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-wider">
                {locale === 'ru' ? 'Vezi Planuri' : 'Vezi Planuri'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between py-8 md:py-10 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <Zap className="text-blue-600 fill-blue-600 shrink-0" size={28} /> {t('title')}
                </h1>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{t('subtitle')}</p>
              </div>
              <button onClick={handleExportCSV} disabled={reviews.length === 0}
                className="w-full sm:w-auto bg-white border border-gray-200 px-6 py-3.5 rounded-2xl font-black text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm text-xs uppercase tracking-wider">
                <Download size={16} /> {t('export_btn')}
              </button>
            </header>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <FilterGroup label={t('labels.location')} icon={<MapPin size={15}/>} value={selectedLocation} onChange={setSelectedLocation} options={locations} allLabel={t('options.all_locs')} />
                <FilterGroup label={t('labels.employee')} icon={<User size={15}/>} value={selectedEmployee} onChange={setSelectedEmployee} options={employees} allLabel={t('options.all_emps')} />
                <div className="flex flex-col gap-2 w-full">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">{locale === 'ru' ? 'Период' : 'Perioada'}</span>
                  <div className="grid grid-cols-4 gap-1.5 w-full bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 h-12 items-center">
                    {['7d', '1m', '3m', 'all'].map((period) => (
                      <button key={period} onClick={() => { setTimeFilter(period as any); setCustomDate(''); }}
                        className={`h-full rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-center px-1.5 whitespace-nowrap ${timeFilter === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                        {t(`options.${period}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">{locale === 'ru' ? 'Календарь' : 'Alege Data'}</span>
                  <div className={`flex items-center gap-2.5 px-3.5 rounded-xl border transition-all h-12 w-full ${timeFilter === 'custom' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200/60'}`}>
                    <CalendarIcon size={15} className={timeFilter === 'custom' ? 'text-blue-600' : 'text-gray-400'} />
                    <input type="date" value={customDate} onChange={(e) => { setCustomDate(e.target.value); setTimeFilter('custom'); }} className="bg-transparent border-none text-xs font-black text-gray-700 outline-none p-0 cursor-pointer w-full focus:ring-0" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => { setSelectedLocation('all'); setSelectedEmployee('all'); setTimeFilter('all'); setCustomDate(''); }} className="text-xs text-blue-600 hover:underline font-bold">
                  {locale === 'ru' ? 'Сбросить фильтры' : 'Resetează filtrele'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label={tCommon('stats.avg_rating')} value={`${smartStats.avg}/5.0`} icon={<Star className="text-yellow-400 fill-yellow-400" size={18} />} />
              <StatCard label={tCommon('stats.hero_day')} value={smartStats.bestEmp} icon={<Trophy className="text-orange-500" size={18} />} />
              <StatCard label={tStats('volume')} value={smartStats.count.toString()} icon={<MessageSquare className="text-blue-600" size={18} />} />
            </div>

            {followUpsNeeded.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-100 rounded-xl"><Smartphone size={18} className="text-rose-600" /></div>
                  <div>
                    <p className="font-black text-sm text-rose-800 uppercase tracking-tight">Follow-up necesar ({followUpsNeeded.length})</p>
                    <p className="text-[10px] text-rose-500 font-medium">{locale === 'ru' ? 'Clienți nemulțumiți cu telefon' : 'Clienți nemulțumiți cu telefon — contactează-i pe WhatsApp'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {followUpsNeeded.slice(0, 5).map(rev => {
                    const clientName = rev.full_name || (locale === 'ru' ? 'Клиент' : 'Client');
                    const followUpText = locale === 'ru'
                      ? `Здравствуйте, ${clientName}! 👋\n\nМы заметили, что ваш визит не оправдал ожиданий (${rev.rating}★).\n\nМы хотим исправить ситуацию. Что произошло?\n\nСпасибо! 🙏`
                      : `Bună ziua, ${clientName}! 👋\n\nAm observat că vizita dvs. nu a fost pe măsura așteptărilor (${rev.rating}★).\n\nDorim să remediem situația. Ce s-a întâmplat?\n\nVă mulțumim! 🙏`;
                    const phone = rev.phone!.replace(/\D/g, '');
                    const fullPhone = phone.startsWith('373') ? phone : `373${phone}`;
                    return (
                      <div key={rev.id} className="flex items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-rose-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex gap-0.5 shrink-0">{[1,2,3,4,5].map(i => <Star key={i} size={10} className={i <= rev.rating ? 'text-rose-400 fill-rose-400' : 'text-slate-200 fill-slate-200'} />)}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{rev.full_name || 'Anonim'}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{rev.phone}</p>
                          </div>
                          {rev.comment && <p className="text-[10px] text-slate-500 italic truncate hidden md:block">"{rev.comment}"</p>}
                        </div>
                        <a href={`https://wa.me/${fullPhone}?text=${encodeURIComponent(followUpText)}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl transition-all shrink-0">
                          <Smartphone size={12} /> WhatsApp
                        </a>
                      </div>
                    );
                  })}
                  {followUpsNeeded.length > 5 && <p className="text-[10px] text-rose-500 font-bold text-center pt-1">+{followUpsNeeded.length - 5} mai mulți</p>}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('loading_db')}</p>
                </div>
              ) : paginatedReviews.length === 0 ? (
                <div className="bg-white p-16 rounded-[2rem] text-center border border-dashed border-gray-200 shadow-sm">
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">{t('no_results')}</p>
                  <button onClick={() => { setSelectedLocation('all'); setSelectedEmployee('all'); setTimeFilter('all'); setCustomDate(''); }} className="text-blue-600 text-sm font-black underline">
                    {locale === 'ru' ? 'Сбросить фильтры' : 'Resetează filtrele'}
                  </button>
                </div>
              ) : (
                paginatedReviews.map(rev => (
                  <ReviewCard key={rev.id} rev={rev} locale={locale} companyName={companyName} onViewPhoto={(url) => setActivePhoto(url)} />
                ))
              )}
            </div>

            {reviews.length > ITEMS_PER_PAGE && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl z-40 flex items-center gap-1 border border-white/10">
                <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2.5 text-white/50 hover:text-white disabled:opacity-20 transition-colors"><ChevronLeft size={18} /></button>
                <span className="text-white font-black text-[10px] uppercase tracking-widest px-4 whitespace-nowrap">{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-2.5 text-white/50 hover:text-white disabled:opacity-20 transition-colors"><ChevronRight size={18} /></button>
              </div>
            )}
          </>
        )}
      </div>

      {activePhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setActivePhoto(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setActivePhoto(null)} className="absolute top-4 right-4 bg-slate-950/60 text-white p-2 rounded-full hover:bg-slate-950 transition-colors z-10"><X size={18} /></button>
            <img src={activePhoto} alt="Review attachment" className="w-full h-auto max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}