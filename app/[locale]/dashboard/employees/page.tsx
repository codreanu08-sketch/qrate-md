'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, Trash2, Download, Star, 
  MapPin, AlertCircle, Loader2, Camera, User, 
  MessageSquare, ChevronRight, Briefcase
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';

export default function EmployeesPage() {
  const t = useTranslations('Employees');
  const params = useParams();
  const locale = params?.locale || 'ro';

  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ name: '', position: '', location_id: '', image: null as File | null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }

      // Obținem compania asociată utilizatorului curent
      const { data: company, error: compError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (compError) throw compError;
      
      if (!company) {
        setLoading(false);
        return;
      }

      setCompanyId(company.id);

      // Preluăm locațiile companiei
      const { data: locs, error: locsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('company_id', company.id);

      if (locsError) throw locsError;
      const currentLocs = locs || [];
      setLocations(currentLocs);
      
      // Preluăm angajații cu recenziile lor
      const { data: emps, error: empsError } = await supabase
        .from('employees')
        .select(`*, reviews(rating)`)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (empsError) throw empsError;

      if (emps) {
        const uniqueEmpIds = new Set();
        
        const formatted = emps
          .filter((emp: any) => { 
            if (uniqueEmpIds.has(emp.id)) return false;
            uniqueEmpIds.add(emp.id);
            return true;
          })
          .map((emp: any) => { 
            const totalReviews = emp.reviews?.length || 0;
            const avg = totalReviews > 0 
              ? emp.reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / totalReviews 
              : 0;
            
            const locationData = emp.location_id ? currentLocs.find((l: any) => l.id === emp.location_id) : null;

            return { 
              ...emp, 
              avgRating: avg.toFixed(1), 
              totalReviews,
              location_name: locationData ? locationData.name : (t.has('card.mobile_location') ? t('card.mobile_location') : 'Fără locație (Mobil)')
            };
          });
          
        setEmployees(formatted);
      }
    } catch (err: any) {
      console.error("Eroare la încărcarea datelor:", err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!companyId) {
      alert("Eroare: Trebuie să configurezi mai întâi compania în pagina de Locații.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesiune expirată. Te rugăm să te reautentifici.");

      let photoUrl = null;
      if (form.image) {
        const fileExt = form.image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, form.image);
        
        if (uploadError) throw uploadError;

        if (uploadData) {
          const { data: url } = supabase.storage.from('employee-photos').getPublicUrl(fileName);
          photoUrl = url.publicUrl;
        }
      }

      const { error: insertError } = await supabase.from('employees').insert([{
        name: form.name.trim(),
        position: form.position.trim(),
        location_id: form.location_id || null, 
        photo_url: photoUrl,
        company_id: companyId,
        user_id: user.id 
      }]);

      if (insertError) throw insertError;

      setForm({ name: '', position: '', location_id: '', image: null });
      await fetchInitialData();
    } catch (err: any) {
      alert("Eroare la adăugare: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = (id: string, name: string) => {
    const canvas = document.getElementById(`qr-download-${id}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-70x70-${name.replace(/\s+/g, '-')}.png`;
      downloadLink.click();
    } else {
      alert("Eroare la generarea fișierului QR.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteModal) return;
    setLoading(true);
    try {
      await supabase
        .from('reviews')
        .delete()
        .eq('employee_id', showDeleteModal.id);

      const { error: employeeDeleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', showDeleteModal.id);

      if (employeeDeleteError) throw employeeDeleteError;

      setShowDeleteModal(null);
      await fetchInitialData();
    } catch (err: any) {
      console.error(err);
      alert("Eroare la ștergere: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight uppercase text-slate-900 mb-2">{t('title')}</h1>
          <p className="text-slate-500 font-medium text-lg italic border-l-4 border-blue-500 pl-4">{t('subtitle')}</p>
        </header>

        {/* FORMULAR DE ÎNREGISTRARE */}
        <section className="bg-white p-8 md:p-14 rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-100 mb-16">
          <div className="mb-8">
            <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">{t('form.header')}</h2>
            <p className="text-slate-400 text-sm font-bold">{t('form.subheader')}</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{t('form.label_name')}</label>
                <input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder={t('form.placeholder_name')}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl p-5 text-base font-bold outline-none transition-all shadow-sm"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{t('form.label_position')}</label>
                <input 
                  value={form.position}
                  onChange={e => setForm({...form, position: e.target.value})}
                  placeholder={t('form.placeholder_position')}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl p-5 text-base font-bold outline-none transition-all shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{t('form.label_location')}</label>
                <select 
                  value={form.location_id}
                  onChange={e => setForm({...form, location_id: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl p-5 text-base font-bold outline-none transition-all appearance-none shadow-sm cursor-pointer"
                >
                  <option value="">{t('form.mobile_option') || 'Fără locație (Mobil)'}</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 pt-4 border-t border-slate-50">
              <div className="w-full md:w-1/3">
                <label className="flex items-center justify-center gap-3 w-full bg-blue-50/50 p-5 rounded-2xl border-2 border-dashed border-blue-100 cursor-pointer hover:bg-blue-100/50 transition-all group">
                  <Camera size={22} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-black text-blue-600 truncate">{form.image ? form.image.name : t('form.upload_photo')}</span>
                  <input type="file" className="hidden" onChange={e => setForm({...form, image: e.target.files?.[0] || null})} accept="image/*" />
                </label>
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full md:flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><UserPlus size={20} /> {t('form.submit_btn')}</>}
              </button>
            </div>
          </form>
        </section>

        {/* GRIDUL DE ANGAJAȚI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-full py-32 text-center">
              <Loader2 className="animate-spin mx-auto text-blue-500 mb-6" size={48} />
              <p className="font-black text-xs text-slate-400 uppercase tracking-[0.3em]">{t('loading')}</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="col-span-full bg-white py-32 rounded-[4rem] border-2 border-dashed border-slate-100 text-center shadow-inner">
              <p className="text-slate-300 font-black uppercase text-lg tracking-widest">{t('empty')}</p>
            </div>
          ) : (
            employees.map(emp => {
              // CONSTRUIRE CURATĂ A URL-ULUI PENTRU QR CODE
              const qrUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}/${locale}/rate?employee=${emp.id}` 
                : '';
              
              return (
                <div key={emp.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group p-8 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                  
                  {/* Canvas Ascuns pentru download - rezoluție optimă */}
                  <div className="hidden">
                    {qrUrl && (
                      <QRCodeCanvas 
                        id={`qr-download-${emp.id}`}
                        value={qrUrl}
                        size={512} // Generăm la rezoluție mare pentru print clar, chiar dacă eticheta e mică
                        level="H"
                        includeMargin={true}
                      />
                    )}
                  </div>

                  <div className="flex items-start gap-6 mb-6">
                    <div className="relative shrink-0">
                      {emp.photo_url ? (
                        <img 
                          src={emp.photo_url} 
                          className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md relative z-10"
                          alt={emp.name}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-slate-50 border-4 border-slate-50 flex items-center justify-center text-slate-200 shadow-md relative z-10">
                          <User size={40} />
                        </div>
                      )}
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm z-20 flex items-center gap-1">
                        <Star size={11} className="fill-white" /> {emp.avgRating}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-1"> 
                      <h3 className="font-[900] text-slate-900 text-2xl uppercase tracking-tighter leading-tight break-words mb-3">
                        {emp.name}
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        <span className="bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Briefcase size={12} /> {emp.position || (t.has('card.default_position') ? t('card.default_position') : 'Angajat')}
                        </span>
                        <span className="bg-slate-50 text-slate-400 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <MessageSquare size={12} /> {emp.totalReviews}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 bg-slate-50/60 p-5 rounded-2xl mb-6 border border-slate-100">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight">
                        <MapPin size={16} className="text-blue-500 shrink-0" />
                        <span className="truncate">{emp.location_name}</span>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ID: {emp.id.slice(0,8)}</p>
                    </div>
                    
                    <div className="bg-white p-2.5 rounded-xl shadow-sm shrink-0 border border-slate-100">
                      {qrUrl && (
                        <QRCodeCanvas 
                          id={`qr-${emp.id}`}
                          value={qrUrl} 
                          size={76} 
                          level="H"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link 
                      href={`/${locale}/dashboard/employees/${emp.id}`}
                      className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {t('card.btn_profile') || 'Profil'} <ChevronRight size={16} />
                    </Link>
                    <button 
                      onClick={() => downloadQR(emp.id, emp.name)}
                      className="w-14 h-14 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent shadow-sm"
                      type="button"
                      title={t('card.download_qr')}
                    >
                      <Download size={22} />
                    </button>
                    <button 
                      onClick={() => setShowDeleteModal(emp)}
                      className="w-14 h-14 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      type="button"
                      title={t('card.delete_btn')}
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL ȘTERGERE */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white p-10 md:p-14 rounded-[4rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-3xl font-[900] text-slate-900 mb-4 uppercase tracking-tighter">{t('delete_modal.title')}</h2>
            <p className="text-slate-400 font-medium mb-10 leading-relaxed italic">
              {t('delete_modal.subtitle')} <span className="text-slate-900 font-black not-italic">{showDeleteModal.name}</span>?
            </p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowDeleteModal(null)} className="flex-1 bg-slate-100 py-5 rounded-2xl font-black text-xs uppercase text-slate-400 tracking-widest hover:bg-slate-200 transition-colors">{t('delete_modal.cancel')}</button>
              <button 
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all"
              >
                {t('delete_modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}