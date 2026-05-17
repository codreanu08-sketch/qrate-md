'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { 
  Star, ArrowLeft, User, 
  MessageSquare, TrendingUp, Award, Clock, Loader2, Download, Send, X
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function EmployeeStatsPage() {
  const params = useParams();
  const id = params?.id;
  const t = useTranslations('EmployeeStats');
  
  // Ref-ul este plasat doar pe zona care trebuie printată (fără butoanele de navigare)
  const reportRef = useRef<HTMLDivElement>(null);

  const [employee, setEmployee] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [period, setPeriod] = useState('7d');
  const [specificDate, setSpecificDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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
          .maybeSingle(); // Modificat în maybeSingle pentru siguranță
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
      setReviews(revs || []);

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

  async function handleSendReply(reviewId: string) {
    if (!replyText.trim()) return;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          reply_text: replyText.trim(),
          replied_at: new Date().toISOString() 
        })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, reply_text: replyText.trim() } : r
      ));
      setReplyingTo(null);
      setReplyText('');
    } catch (err: any) {
      alert("Eroare la trimiterea răspunsului: " + err.message);
    }
  }

  const avg = reviews.length > 0 
    ? (reviews.reduce((acc, c) => acc + c.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigarea de sus - Exclusă din PDF export */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <Link href="/dashboard/employees" className="group flex items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:text-slate-900 transition-all">
            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all">
              <ArrowLeft size={18} />
            </div>
            {t('nav_back')}
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Selectorul de perioadă vizibil pe ecrane medii/mari */}
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

            {/* Alternativă selector perioadă pentru ecrane mici (Mobile UX Improvement) */}
            <div className="flex md:hidden bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full justify-around">
              {['7d', '1m', 'custom'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)}
                  className={`flex-1 text-center py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${period === p ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
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
          /* DOAR ACEST CONTAINER VA FI EXPORTAT ÎN PDF */
          <div ref={reportRef} className="space-y-10 p-2 md:p-6 rounded-[3rem]">
            
            {/* CARD PROFILE ANGAJAT */}
            <div className="bg-white rounded-[4rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.04)] border border-slate-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-60" />
              
              <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10" />
                  {employee?.photo_url ? (
                    <img src={employee.photo_url} className="w-56 h-56 rounded-[4rem] object-cover border-[10px] border-white shadow-2xl relative z-10" alt={employee.name} />
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

            {/* SECTIUNE DETALII: REZUMAT STARS + LISTA RECENZII */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              
              {/* LISTA DE REVIEWS */}
              <div className="lg:col-span-2 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 px-6">
                  <h2 className="font-black text-xs uppercase tracking-[0.4em] text-slate-400">{t('reviews_title')}</h2>
                  {period === 'custom' && (
                    <input 
                      type="date" 
                      value={specificDate} 
                      onChange={e => setSpecificDate(e.target.value)} 
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-[11px] text-blue-600 outline-none focus:border-blue-500 shadow-sm" 
                    />
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="bg-white p-24 rounded-[4rem] border border-dashed border-slate-200 text-center">
                    <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">{t('no_reviews')}</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all duration-500">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={20} className={i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-100"} />
                          ))}
                        </div>
                        <div className="bg-slate-50 px-5 py-2 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(rev.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long' })}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xl font-medium leading-[1.8] italic mb-6">
                        "{rev.comment || t('default_comment')}"
                      </p>

                      <div className="pt-8 border-t border-slate-50">
                        {rev.reply_text ? (
                          <div className="bg-blue-50/50 p-6 rounded-[2rem] border-l-4 border-blue-500">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{t('your_reply')}</p>
                            <p className="text-slate-700 text-lg italic">{rev.reply_text}</p>
                          </div>
                        ) : (
                          <>
                            {replyingTo === rev.id ? (
                              <div className="space-y-4">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={t('reply_placeholder')}
                                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none transition-all italic text-slate-600 focus:bg-white focus:border-slate-400"
                                />
                                <div className="flex gap-3">
                                  <button onClick={() => handleSendReply(rev.id)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors">
                                    <Send size={14} /> {t('send_btn')}
                                  </button>
                                  <button onClick={() => setReplyingTo(null)} className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-colors">
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => { setReplyingTo(rev.id); setReplyText(''); }}
                                className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                              >
                                <MessageSquare size={14} /> {t('reply_btn')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* STATISTICI DISTRIBUTIE STELE */}
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

                {/* BADGE STATISTIC DE STATUS */}
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