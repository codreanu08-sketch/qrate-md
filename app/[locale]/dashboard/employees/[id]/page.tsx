'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { 
  Star, ArrowLeft, User, 
  MessageSquare, TrendingUp, Award, Clock, Loader2, Download, MessageCircle,
  Bot, Copy, Check, Smartphone
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function EmployeeStatsPage() {
  const params = useParams();
  const id = params?.id;
  const t = useTranslations('EmployeeStats');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const [employee, setEmployee] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState('7d');
  const [specificDate, setSpecificDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // === STATE PENTRU AI RĂSPUNS ===
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateSmartReply = (rev: any) => {
    const clientName = rev.full_name || (t.has('anonClient') ? t('anonClient') : 'Client');
    const empName = employee?.name;

    if (rev.rating >= 4) {
      return `${t.has('replyPositivePrefix') ? t('replyPositivePrefix') : 'Bună ziua'}, ${clientName}! ${t.has('replyPositiveStars') ? t('replyPositiveStars') : 'Vă mulțumim pentru evaluarea de'} ${rev.rating} ${t.has('replyPositiveStarsEnd') ? t('replyPositiveStarsEnd') : 'stele'}${empName ? ` ${t.has('replyWithEmp') ? t('replyWithEmp') : 'cu colegul nostru'} (${empName})` : ''}! ${t.has('replyPositiveSuffix') ? t('replyPositiveSuffix') : 'Vă așteptăm din nou!'}`;
    } else {
      return `${t.has('replyNegativePrefix') ? t('replyNegativePrefix') : 'Bună ziua'}, ${clientName}, ${t.has('replyNegativeSuffix') ? t('replyNegativeSuffix') : 'ne pare rău că ați acordat'} ${rev.rating}★. ${t.has('replyNegativeMiddle') ? t('replyNegativeMiddle') : 'Luăm acest lucru foarte în serios'}${empName ? ` ${t.has('replyNegativeEmp') ? t('replyNegativeEmp') : 'și vom discuta cu angajatul'}` : ''}. ${t.has('replyNegativeEnd') ? t('replyNegativeEnd') : 'Vă mulțumim pentru feedback!'}`;
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

  const generateSignedUrls = async (reviewsList: any[]) => {
    const urls: Record<string, string> = {};
    for (const rev of reviewsList) {
      if (rev.image_url) {
        const { data } = await supabase.storage
          .from('reviews')
          .createSignedUrl(rev.image_url, 3600);
        if (data) urls[rev.image_url] = data.signedUrl;
      }
      if (rev.video_url) {
        const { data } = await supabase.storage
          .from('reviews')
          .createSignedUrl(rev.video_url, 3600);
        if (data) urls[rev.video_url] = data.signedUrl;
      }
    }
    setSignedUrls(urls);
  };

  const fetchEmployeeData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: emp, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (empError) throw empError;

      if (emp && emp.location_id) {
        const { data: locData } = await supabase
          .from('locations')
          .select('name')
          .eq('id', emp.location_id)
          .maybeSingle();
        emp.locations = locData;
      }
      setEmployee(emp);

      let query = supabase
        .from('reviews')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: false });

      if (period === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        query = query.gte('created_at', d.toISOString());
      } else if (period === '1m') {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        query = query.gte('created_at', d.toISOString());
      } else if (period === 'custom' && specificDate) {
        query = query.gte('created_at', `${specificDate}T00:00:00Z`).lte('created_at', `${specificDate}T23:59:59Z`);
      }

      const { data: revs, error: revsError } = await query;
      if (revsError) throw revsError;
      
      const reviewsData = revs || [];
      setReviews(reviewsData);
      await generateSignedUrls(reviewsData);

    } catch (err: any) {
      console.error("Eroare încărcare date:", err.message);
    } finally {
      setLoading(false);
    }
  }, [id, period, specificDate]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFC'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Raport_QRate_${employee?.name || 'Angajat'}.pdf`);
    } catch (err) {
      console.error("Eroare export:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const generateWhatsAppUrl = (phone: string, rating: number, clientName: string | null, revId?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;

    if (cleanPhone.startsWith('0')) {
      if (cleanPhone.length === 10) formattedPhone = '40' + cleanPhone.substring(1);
      else if (cleanPhone.length === 9) formattedPhone = '373' + cleanPhone.substring(1);
    }

    const nameToUse = clientName || 'Stimate client';
    const locationName = employee?.locations?.name || 'companiei noastre';
    
    const textMessage = rating <= 3
      ? `Bună ziua, ${nameToUse}! Vă contactăm din partea echipei ${locationName}. Am primit feedback-ul dumneavoastră de ${rating} ⭐ oferit colegului nostru ${employee?.name || ''} și ne pare rău pentru experiența neplăcută.`
      : `Bună ziua, ${nameToUse}! Vă mulțumim din suflet pentru recenzia de ${rating} ⭐ oferită colegului nostru ${employee?.name || ''}. Ne bucurăm că ați avut o experiență excelentă la ${locationName}!`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMessage)}`;
  };

  const avg = reviews.length > 0 
    ? (reviews.reduce((acc, c) => acc + c.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <Link href="/dashboard/employees" className="group flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:text-slate-900 transition-all">
            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all">
              <ArrowLeft size={18} />
            </div>
            {t('nav_back')}
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="hidden md:flex bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100">
               {['7d', '1m', 'custom'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)}
                  className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${period === p ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t(`periods.${p}`)}
                </button>
              ))}
            </div>

            <button 
              onClick={exportToPDF}
              disabled={isExporting || loading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {t('export_btn')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">{t('loading')}</p>
          </div>
        ) : (
          <div ref={reportRef} className="space-y-10 p-2 md:p-6 rounded-[3rem]">
            
            {/* CARD PROFILE ANGAJAT */}
            <div className="bg-white rounded-[4rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.04)] border border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-60" />
              
              <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10" />
                  {employee?.photo_url ? (
                    <img src={employee.photo_url} crossOrigin="anonymous" className="w-56 h-56 rounded-[4rem] object-cover border-[10px] border-white shadow-2xl relative z-10" alt={employee.name} />
                  ) : (
                    <div className="w-56 h-56 rounded-[4rem] bg-slate-50 border-[10px] border-white flex items-center justify-center text-slate-200 shadow-2xl relative z-10">
                      <User size={80} />
                    </div>
                  )}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl border-4 border-white z-20">
                    {t('badge_elite')}
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-4">
                    <h1 className="text-5xl md:text-6xl font-[900] text-slate-900 uppercase tracking-tighter leading-none">
                      {employee?.name || t('no_name')}
                    </h1>
                    <div className="flex items-center justify-center lg:justify-start gap-2 bg-yellow-400 text-white px-5 py-2.5 rounded-2xl shadow-lg w-max mx-auto lg:mx-0">
                      <Star size={20} className="fill-white" />
                      <span className="text-xl font-black">{avg}</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px] mb-10 flex items-center justify-center lg:justify-start gap-3">
                    <Award size={18} className="text-blue-500" />
                    {employee?.position || t('default_pos')} <span className="text-slate-200">/</span> {employee?.locations?.name || t('no_loc')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                      <TrendingUp className="text-blue-600 mb-3 mx-auto lg:mx-0" size={24} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('stats.volume')}</p>
                      <p className="text-4xl font-black text-slate-900">{reviews.length}</p>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                      <MessageSquare className="text-emerald-500 mb-3 mx-auto lg:mx-0" size={24} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('stats.positive')}</p>
                      <p className="text-4xl font-black text-slate-900">{reviews.filter(r => r.rating >= 4).length}</p>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                      <Clock className="text-slate-400 mb-3 mx-auto lg:mx-0" size={24} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('stats.last_vote')}</p>
                      <p className="text-xs font-black text-slate-900 uppercase">
                        {reviews[0] ? new Date(reviews[0].created_at).toLocaleDateString('ro-RO') : '-- / --'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              
              <div className="lg:col-span-2 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 px-6">
                  <h2 className="font-black text-xs uppercase tracking-[0.4em] text-slate-400">{t('reviews_title')}</h2>
                  {period === 'custom' && (
                    <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-[11px] text-blue-600 outline-none focus:border-blue-500 shadow-sm" />
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="bg-white p-24 rounded-[4rem] border border-dashed border-slate-200 text-center">
                    <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">{t('no_reviews')}</p>
                  </div>
                ) : (
                  reviews.map((rev) => {
                    const isReplyOpen = activeReplyId === rev.id;
                    const smartReplyText = generateSmartReply(rev);

                    return (
                      <div key={rev.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all duration-500">
                        
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-2xl flex items-center justify-center font-black uppercase text-base border border-slate-200 shadow-sm">
                              {(rev.full_name || 'A')[0]}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900 text-lg leading-tight">
                                {rev.full_name || 'Client Anonim'}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={16} className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-100"} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="bg-slate-50 px-5 py-2 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(rev.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long' })}
                          </div>
                        </div>

                        <p className="text-slate-600 text-xl font-medium leading-[1.8] italic mb-6 pl-1">
                          "{rev.comment || t('default_comment')}"
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                          {rev.image_url && signedUrls[rev.image_url] && (
                            <img src={signedUrls[rev.image_url]} crossOrigin="anonymous" alt="Review media" className="rounded-2xl w-full h-64 object-cover border border-slate-100 shadow-sm" />
                          )}
                          {rev.video_url && signedUrls[rev.video_url] && (
                            <video src={signedUrls[rev.video_url]} controls className="rounded-2xl w-full h-64 object-cover border bg-black shadow-sm" />
                          )}
                        </div>

                        {/* BUTON AI RĂSPUNS */}
                        <div className="pt-6 border-t border-slate-50">
                          {isReplyOpen ? (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                              <p className="text-xs text-slate-700 font-medium mb-3 italic">"{smartReplyText}"</p>
                              
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => copyToClipboard(smartReplyText, rev.id)}
                                  className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase tracking-wider font-black py-3 rounded-xl transition-colors"
                                >
                                  {copiedId === rev.id ? <><Check size={14} /> {t.has('btnCopied') ? t('btnCopied') : 'Copiat!'}</> : <><Copy size={14} /> {t.has('btnCopy') ? t('btnCopy') : 'Copiază'}</>}
                                </button>
                                
                                <button 
                                  onClick={() => sendToWhatsApp(smartReplyText)}
                                  className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white text-[10px] uppercase tracking-wider font-black py-3 rounded-xl transition-colors"
                                >
                                  <Smartphone size={14} /> WhatsApp
                                </button>
                              </div>
                              
                              <button onClick={() => setActiveReplyId(null)} className="w-full text-center text-[10px] text-slate-400 mt-3 font-bold hover:text-slate-600">
                                {t.has('btnCancel') ? t('btnCancel') : 'Anulează'}
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setActiveReplyId(rev.id)}
                              className="w-full flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black uppercase tracking-wider text-[10px] py-3.5 rounded-xl transition-colors"
                            >
                              <Bot size={16} /> {t.has('btnAction') ? t('btnAction') : 'AI Răspuns'}
                            </button>
                          )}
                        </div>

                        {/* WHATSAPP DIRECT */}
                        {rev.phone && (
                          <div className="pt-4">
                            <a
                              href={generateWhatsAppUrl(rev.phone, rev.rating, rev.full_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-5 py-2 rounded-xl transition-all"
                            >
                              <MessageCircle size={16} className="fill-current" />
                              {t.has('reply_whatsapp') ? t('reply_whatsapp') : 'Răspunde pe WhatsApp'}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-8 lg:sticky lg:top-8">
                <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] mb-10 text-blue-400">{t('distribution_title')}</h3>
                  <div className="space-y-8">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star}>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                            <span className="opacity-60">{star} {t('stars')}</span>
                            <span className="text-blue-400">{count}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                   <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-xl border border-white/20 z-10">
                    <Award size={40} />
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-4 z-10 text-blue-100">{t('performance_status')}</h4>
                  <div className="text-5xl font-black mb-4 z-10 tracking-tighter">
                    {parseFloat(avg) >= 4.5 ? 'PRO' : parseFloat(avg) >= 3.5 ? 'GOLD' : 'BASE'}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}