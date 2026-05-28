// components/ReviewCard.tsx
// Component reutilizabil pentru recenzii — folosit în Reviews, Dashboard, Locations, Employees

'use client';

import { useState } from 'react';
import { Star, User, MapPin, Phone, Bot, Copy, Check, Smartphone, Eye, MessageCircle, ExternalLink } from 'lucide-react';

interface ReviewCardProps {
  rev: {
    id: string;
    rating: number;
    comment?: string | null;
    created_at: string;
    full_name?: string | null;
    phone?: string | null;
    photo_url?: string | null;
    redirected_to_google?: boolean;
    is_recovery_win?: boolean;
    employees?: { name: string; position?: string; photo_url?: string } | null;
    locations?: { name: string } | null;
  };
  locale: 'ro' | 'ru';
  companyName?: string;
  onViewPhoto?: (url: string) => void;
}

function generateReply(rev: ReviewCardProps['rev'], locale: string, companyName?: string) {
  const clientName = rev.full_name || (locale === 'ru' ? 'Клиент' : 'Client');
  const empName = rev.employees?.name;
  if (rev.rating >= 4) {
    return locale === 'ru'
      ? `Здравствуйте, ${clientName}! Спасибо за оценку ${rev.rating}★${empName ? ` нашему сотруднику (${empName})` : ''}! Ждём вас снова!`
      : `Bună ziua, ${clientName}! Vă mulțumim pentru evaluarea de ${rev.rating}★${empName ? ` acordată colegului nostru (${empName})` : ''}! Vă mai așteptăm!`;
  }
  return locale === 'ru'
    ? `Здравствуйте, ${clientName}, нам жаль, что вы поставили ${rev.rating}★. Мы принимаем это близко к сердцу${empName ? ` и обсудим с сотрудником (${empName})` : ''}. Спасибо за отзыв!`
    : `Bună ziua, ${clientName}, ne pare rău pentru evaluarea de ${rev.rating}★. Luăm acest lucru foarte în serios${empName ? ` și vom discuta cu ${empName}` : ''}. Mulțumim pentru feedback!`;
}

function generateFollowUp(rev: ReviewCardProps['rev'], locale: string, companyName?: string) {
  const clientName = rev.full_name || (locale === 'ru' ? 'stimat client' : 'stimat client');
  return locale === 'ru'
    ? `Здравствуйте, ${clientName}! 👋\n\nМы заметили, что ваш визит в ${companyName || 'нашу компанию'} не оправдал ожиданий (${rev.rating}★).\n\nМы очень хотим исправить ситуацию. Можете рассказать, что произошло?\n\nСпасибо! 🙏`
    : `Bună ziua, ${clientName}! 👋\n\nAm observat că vizita dvs. la ${companyName || 'noi'} nu a fost pe măsura așteptărilor (${rev.rating}★).\n\nDorim foarte mult să remediem situația. Ne puteți spune ce s-a întâmplat?\n\nVă mulțumim! 🙏`;
}

export default function ReviewCard({ rev, locale, companyName, onViewPhoto }: ReviewCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const ratingColor = rev.rating >= 4 ? 'emerald' : rev.rating === 3 ? 'amber' : 'rose';
  const ratingBg = rev.rating >= 4 ? 'bg-emerald-50 border-emerald-100' : rev.rating === 3 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100';
  const ratingText = rev.rating >= 4 ? 'text-emerald-700' : rev.rating === 3 ? 'text-amber-700' : 'text-rose-700';
  const ratingBar = rev.rating >= 4 ? 'bg-emerald-500' : rev.rating === 3 ? 'bg-amber-400' : 'bg-rose-500';
  const starColor = rev.rating >= 4 ? 'text-emerald-400 fill-emerald-400' : rev.rating === 3 ? 'text-amber-400 fill-amber-400' : 'text-rose-400 fill-rose-400';

  const replyText = generateReply(rev, locale, companyName);
  const followUpText = generateFollowUp(rev, locale, companyName);

  const handleCopy = () => {
    navigator.clipboard.writeText(replyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppReply = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(replyText)}`, '_blank');
  };

  const handleWhatsAppContact = () => {
    if (!rev.phone) return;
    const phone = rev.phone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('373') ? phone : `373${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(followUpText)}`, '_blank');
  };

  const date = new Date(rev.created_at);
  const dateStr = date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'ro-RO', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'ro-RO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${ratingBg}`}>
      
      {/* Bara colorată sus */}
      <div className={`h-1 w-full ${ratingBar}`} />

      <div className="p-4 md:p-5">
        
        {/* ROW 1 — Rating + Data + Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${ratingBg} border`}>
              <span className={`text-lg font-black ${ratingText}`}>{rev.rating}</span>
              <Star size={14} className={starColor} />
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={11} className={i <= rev.rating ? starColor : 'text-slate-200 fill-slate-200'} />
              ))}
            </div>
          </div>

          {/* Badges + Data */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {rev.is_recovery_win && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                🏆 Recovery Win
              </span>
            )}
            {rev.redirected_to_google && (
              <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </span>
            )}
            <div className="text-right">
              <p className="text-xs font-black text-slate-700">{timeStr}</p>
              <p className="text-[10px] font-bold text-slate-400">{dateStr}</p>
            </div>
          </div>
        </div>

        {/* ROW 2 — Comentariu */}
        <div className="mb-3">
          {rev.comment && rev.comment !== 'Clientul nu a lăsat un comentariu' && rev.comment !== 'Клиент не оставил комментария' ? (
            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
              "{rev.comment}"
            </p>
          ) : (
            <p className="text-sm text-slate-300 italic">
              {locale === 'ru' ? '— Fără comentariu —' : '— Fără comentariu —'}
            </p>
          )}
        </div>

        {/* ROW 3 — Foto */}
        {rev.photo_url && (
          <div className="mb-3">
            <div onClick={() => onViewPhoto?.(rev.photo_url!)} className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer border border-slate-200 group">
              <img src={rev.photo_url} alt="Review" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Eye size={14} className="text-white" />
              </div>
            </div>
          </div>
        )}

        {/* ROW 4 — Client info + Locație + Angajat */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Client */}
          {rev.full_name && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl">
              <User size={11} className="text-slate-400 shrink-0" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{rev.full_name}</span>
            </div>
          )}

          {/* Telefon — clickabil */}
          {rev.phone && (
            <a href={`tel:${rev.phone}`} className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl transition-colors group">
              <Phone size={11} className="text-blue-500 shrink-0" />
              <span className="text-[11px] font-black text-blue-700 tracking-tight">{rev.phone}</span>
            </a>
          )}

          {/* Angajat */}
          {rev.employees?.name && (
            <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1.5 rounded-xl">
              <User size={11} className="text-indigo-400 shrink-0" />
              <span className="text-[11px] font-black text-indigo-700 uppercase tracking-tight truncate max-w-[100px]">{rev.employees.name}</span>
            </div>
          )}

          {/* Locație */}
          {rev.locations?.name && (
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-xl">
              <MapPin size={11} className="text-emerald-500 shrink-0" />
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-tight truncate max-w-[100px]">{rev.locations.name}</span>
            </div>
          )}
        </div>

        {/* ROW 5 — Butoane acțiuni */}
        {!replyOpen ? (
          <div className="flex gap-2">
            <button
              onClick={() => setReplyOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all"
            >
              <Bot size={14} /> {locale === 'ru' ? 'AI Răspuns' : 'AI Răspuns'}
            </button>

            {/* Buton WhatsApp direct cu clientul — doar dacă are telefon și rating ≤3 */}
            {rev.phone && rev.rating <= 3 && (
              <button
                onClick={handleWhatsAppContact}
                className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl transition-all"
                title={locale === 'ru' ? 'Contactează clientul pe WhatsApp' : 'Contactează clientul pe WhatsApp'}
              >
                <Smartphone size={14} />
                <span className="hidden sm:inline">{locale === 'ru' ? 'Contact' : 'Contact'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <p className="text-xs text-slate-600 font-medium italic leading-relaxed">"{replyText}"</p>
            <div className="flex gap-2">
              <button onClick={handleCopy} className={`flex-1 flex justify-center items-center gap-1.5 text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {copied ? <><Check size={12} /> {locale === 'ru' ? 'Скопировано!' : 'Copiat!'}</> : <><Copy size={12} /> {locale === 'ru' ? 'Копировать' : 'Copiază'}</>}
              </button>
              <button onClick={handleWhatsAppReply} className="flex-1 flex justify-center items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] uppercase tracking-wider font-black py-2.5 rounded-xl transition-all">
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
  );
}