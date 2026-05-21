'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Zap, Star, Send, CheckCircle2, Phone, User, Loader2, Camera, X, MessageSquareQuote, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import ru from '@/messages/ru.json'; 
import ro from '@/messages/ro.json'; 

interface FeedbackFormProps {
  slug: string; // Acesta conține ID-ul/Slug-ul transmis din structura rutei dinamice
  locale: 'ro' | 'ru';
  employeeId?: string;
}

export default function FeedbackForm({ slug, locale, employeeId }: FeedbackFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stări pentru stocarea corectă a ID-urilor UUID și a numelui entității vizate
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('');
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [fetchingIds, setFetchingIds] = useState<boolean>(true);

  // Invocăm traducerile din fișierele JSON locale
  const messages = useMemo(() => (locale === 'ro' ? ro : ru), [locale]);
  
  const t = (messages as any)?.PublicFeedback || {
    step: locale === 'ro' ? 'Pasul 1/1' : 'Шаг 1/1',
    heading_for: locale === 'ro' ? 'Feedback pentru' : 'Отзыв для',
    title_line1: locale === 'ro' ? 'Părerea Ta' : 'Ваше Мнение',
    title_line2: locale === 'ro' ? 'Contează' : 'Важно Для Нас',
    subtitle: locale === 'ro' ? 'Ajută-ne să devenim mai buni evaluând experiența ta.' : 'Помогите нам стать лучше, оценив ваш визит.',
    label_step1: locale === 'ro' ? 'Alege nota ta' : 'Выберите оценку',
    label_step2: locale === 'ro' ? 'Detalii despre vizită' : 'Детали визита',
    label_step3: locale === 'ro' ? 'Atașează o poză (opțional)' : 'Прикрепить фото (опционально)',
    placeholder_name: locale === 'ro' ? 'Numele tău complet' : 'Ваше полное имя',
    placeholder_phone: locale === 'ro' ? 'Telefon (ex: 07xx...)' : 'Телефон',
    placeholder_comment: locale === 'ro' ? 'Comentariul tău (ce ți-a plăcut, ce putem îmbunătăți)...' : 'Ваш комментарий (что понравилось, что улучшить)...',
    btn_add_img: locale === 'ro' ? 'Adaugă imagine' : 'Добавить фото',
    btn_del_img: locale === 'ro' ? 'Șterge Poza' : 'Удалить фото',
    btn_change_img: locale === 'ro' ? 'Schimbă' : 'Изменить',
    btn_submit: locale === 'ro' ? 'Trimite Feedback Acum' : 'Отправить отзыв',
    sending: locale === 'ro' ? 'Se trimite...' : 'Отправка...',
    alert_stars: locale === 'ro' ? 'Te rugăm să alegi o notă (pasul 1)' : 'Пожалуйста, выберите оценку (шаг 1)',
    success_title: locale === 'ro' ? 'Super!' : 'Супер!',
    success_text: locale === 'ro' ? 'Feedback-ul tău a fost trimis cu succes. Apreciem implicarea ta!' : 'Ваш отзыв успешно отправлен. Мы ценим ваше участие!',
    no_comment: (messages as any)?.Dashboard?.feed?.no_comment || (locale === 'ro' ? 'Clientul nu a lăsat un comentariu' : 'Клиент не оставил комментария')
  };

  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    comment: ''
  });

  useEffect(() => {
    async function getCorrectIdentifiers() {
      try {
        setFetchingIds(true);
        let resolvedCompanyId = null;
        let resolvedLocationId = null;

        // Pasul 1: Dacă avem employeeId, aducem numele lui și datele de localizare
        if (employeeId) {
          const { data: empData } = await supabase
            .from('employees')
            .select('name, company_id, location_id')
            .eq('id', employeeId)
            .maybeSingle();

          if (empData) {
            setTargetName(empData.name);
            setIsEmployee(true);
            setCompanyId(empData.company_id);
            setLocationId(empData.location_id);
            return; // Identificare completă pentru angajat
          }
        }
        
        // Pasul 2: Fallback la Locație (verificăm dacă slug este UUID de locație)
        const { data: locData } = await supabase
          .from('locations')
          .select('id, name, company_id')
          .eq('id', slug)
          .maybeSingle();

        if (locData) {
          resolvedLocationId = locData.id;
          resolvedCompanyId = locData.company_id;
          setTargetName(locData.name);
          setIsEmployee(false);
        } else {
          // Pasul 3: Fallback la Companie (după text slug)
          const { data: compData } = await supabase
            .from('companies')
            .select('id, name')
            .eq('slug', slug)
            .maybeSingle();

          if (compData) {
            resolvedCompanyId = compData.id;
            setTargetName(compData.name);
            setIsEmployee(false);

            const { data: fallbackLoc } = await supabase
              .from('locations')
              .select('id')
              .eq('company_id', compData.id)
              .limit(1)
              .maybeSingle();

            if (fallbackLoc) {
              resolvedLocationId = fallbackLoc.id;
            }
          }
        }

        setCompanyId(resolvedCompanyId);
        setLocationId(resolvedLocationId);

        // Dacă nu s-a găsit niciun nume curat, curățăm slug-ul primit ca text secundar
        if (!targetName && !employeeId) {
          setTargetName(slug.replace(/-/g, ' '));
        }

      } catch (err) {
        console.error("Eroare la identificarea companiei/locației:", err);
      } finally {
        setFetchingIds(false);
      }
    }

    if (slug) {
      getCorrectIdentifiers();
    }
  }, [slug, employeeId, targetName]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(locale === 'ro' ? "Imaginea este prea mare! Maxim 5MB." : "Файл слишком большой! Максимум 5МБ.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setLoading(true);

    try {
      let finalPhotoUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const uniqueId = crypto.randomUUID();
        const fileName = `${slug}/${uniqueId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('review-photos').getPublicUrl(fileName);
        finalPhotoUrl = urlData.publicUrl;
      }

      const reviewData = {
        company_slug: slug,
        company_id: companyId,
        location_id: locationId,
        rating: rating,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        comment: formData.comment || t.no_comment,
        photo_url: finalPhotoUrl,
        employee_id: employeeId || null
      };

      const { data: insertedReview, error: dbError } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (dbError) throw dbError;

      if (rating <= 3 && insertedReview) {
        const { error: queueError } = await supabase
          .from('telegram_messages_queue')
          .insert([
            {
              review_id: insertedReview.id,
              status: 'pending'
            }
          ]);

        if (queueError) console.error("Queue Insert Error (Non-blocking):", queueError);
      }

      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error("Submit Error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 max-w-sm">
          <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white ring-8 ring-emerald-50">
            <CheckCircle2 size={56} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">{t.success_title}</h1>
            <p className="text-slate-600 font-medium text-lg">{t.success_text}</p>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pt-8">QRate Solutions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900">
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100 z-50">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-4">
            <div className="bg-blue-600 rounded-xl p-2 shadow-lg shadow-blue-100 shrink-0">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight flex items-center gap-1">
                {t.heading_for} 
                {fetchingIds ? '' : isEmployee ? (
                  <span className="text-blue-600 font-black text-[8px] bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-normal flex items-center gap-0.5"><Briefcase size={8}/> Staff</span>
                ) : (
                  <span className="text-emerald-600 font-black text-[8px] bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-normal flex items-center gap-0.5"><MapPin size={8}/> Locație</span>
                )}
              </span>
              <span className="text-sm font-black text-slate-950 uppercase tracking-widest leading-tight truncate">
                {fetchingIds ? '...' : targetName}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
            {t.step}
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase sm:text-5xl">
            {t.title_line1}<br/>{t.title_line2}
          </h1>
          <p className="text-slate-600 text-lg font-medium max-w-xs mx-auto">
            {t.subtitle}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-blue-700 text-[9px]">1</span>
              {t.label_step1}
            </label>
            <div className="flex justify-between items-center gap-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 md:p-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform active:scale-125 p-1 flex-1 flex justify-center"
                >
                  <Star 
                    size={48} 
                    strokeWidth={1}
                    className={`transition-all duration-150 sm:size-14 ${
                      (hover || rating) >= star 
                      ? 'fill-yellow-400 text-yellow-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                      : 'text-slate-200 fill-slate-50 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
             <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-blue-700 text-[9px]">2</span>
              {t.label_step2}
            </label>
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder={t.placeholder_name}
                  required
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm text-lg font-medium placeholder:text-slate-300"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder={t.placeholder_phone}
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm text-lg font-medium placeholder:text-slate-300"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="relative group">
                <MessageSquareQuote className="absolute left-5 top-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <textarea
                  placeholder={t.placeholder_comment}
                  rows={5}
                  className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm text-lg font-medium placeholder:text-slate-300 resize-none"
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-blue-700 text-[9px]">3</span>
              {t.label_step3}
            </label>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center gap-4 w-full bg-white border-2 border-dashed border-slate-200 p-10 rounded-[2rem] cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group shadow-sm active:scale-[0.99]">
                <div className="bg-slate-100 p-5 rounded-2xl group-hover:bg-blue-100 transition-colors">
                  <Camera size={32} className="text-slate-500 group-hover:text-blue-600" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-blue-700 uppercase tracking-widest">{t.btn_add_img}</span>
                  <p className="text-xs text-slate-400 mt-1">Format: JPG, PNG (Max 5MB)</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            ) : (
              <div className="relative w-full h-64 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl animate-in fade-in zoom-in-95">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 p-4">
                   <button 
                    type="button"
                    onClick={removeImage}
                    className="bg-red-500 text-white px-6 py-3.5 rounded-xl shadow-xl transform hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold text-xs uppercase tracking-widest"
                  >
                    <X size={18} /> {t.btn_del_img}
                  </button>
                   <label className="bg-white/20 backdrop-blur-sm text-white px-6 py-3.5 rounded-xl transform hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold text-xs uppercase tracking-widest cursor-pointer">
                    <Camera size={18} /> {t.btn_change_img}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
            )}
          </section>

          <div className="pt-6 sticky bottom-4 z-40">
            <button
              type="submit"
              disabled={loading || rating === 0 || fetchingIds}
              className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.25em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.97] ${
                rating > 0 && !fetchingIds
                ? 'bg-slate-950 text-white hover:bg-blue-600 hover:shadow-blue-200 disabled:bg-slate-400' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> {t.sending}</>
              ) : fetchingIds ? (
                <>Se încarcă datele...</>
              ) : (
                <>{t.btn_submit} <Send size={18} className="-rotate-12" /></>
              )}
            </button>
            {rating === 0 && (
                <p className="text-center text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider animate-pulse">{t.alert_stars}</p>
            )}
          </div>
        </form>
      </div>
      
      <footer className="text-center pb-8 pt-4">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Powered by QRate Solutions</p>
      </footer>
    </div>
  );
}