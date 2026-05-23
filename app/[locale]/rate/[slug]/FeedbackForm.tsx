'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Zap, Star, Send, CheckCircle2, Phone, User, Loader2, Camera, X, MessageSquareQuote, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import ru from '@/messages/ru.json'; 
import ro from '@/messages/ro.json'; 

interface FeedbackFormProps {
  slug: string;
  locale: 'ro' | 'ru';
  employeeId?: string;
}

export default function FeedbackForm({ slug, locale, employeeId }: FeedbackFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('');
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [fetchingIds, setFetchingIds] = useState<boolean>(true);

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
            setFetchingIds(false);
            return;
          }
        }
        
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
            if (fallbackLoc) resolvedLocationId = fallbackLoc.id;
          }
        }
        setCompanyId(resolvedCompanyId);
        setLocationId(resolvedLocationId);
      } catch (err) {
        console.error("Eroare la identificare:", err);
      } finally {
        setFetchingIds(false);
      }
    }
    if (slug) getCorrectIdentifiers();
  }, [slug, employeeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Imagine prea mare!");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);

    try {
      let finalPhotoUrl = null;
      if (imageFile) {
        const fileName = `${slug}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('review-photos').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        finalPhotoUrl = supabase.storage.from('review-photos').getPublicUrl(fileName).data.publicUrl;
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
        employee_id: employeeId || null // Aici este fix-ul!
      };

      // DEBUG pentru verificare
      console.log("DEBUG - Trimit obiectul acesta la Supabase:", reviewData);

      const { data: insertedReview, error: dbError } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (dbError) throw dbError;

      if (rating <= 3 && insertedReview) {
        await supabase.from('telegram_messages_queue').insert([{ review_id: insertedReview.id, status: 'pending' }]);
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
          <h1 className="text-4xl font-black text-slate-950 uppercase">{t.success_title}</h1>
          <p className="text-slate-600 font-medium text-lg">{t.success_text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900">
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100 z-50">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 rounded-xl p-2"><Zap className="text-white fill-white" size={16} /></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.heading_for}</span>
              <span className="text-sm font-black text-slate-950 uppercase tracking-widest truncate">{targetName}</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase">{t.step}</div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* SECȚIUNEA 1: Rating */}
          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">{t.label_step1}</label>
            <div className="flex justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="p-1">
                  <Star size={48} className={`transition-all ${(hover || rating) >= star ? 'fill-yellow-400 text-yellow-500' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
          </section>

          {/* SECȚIUNEA 2: Detalii */}
          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">{t.label_step2}</label>
            <input type="text" placeholder={t.placeholder_name} required className="w-full p-5 bg-white border border-slate-100 rounded-2xl" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            <input type="text" placeholder={t.placeholder_phone} className="w-full p-5 bg-white border border-slate-100 rounded-2xl" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <textarea placeholder={t.placeholder_comment} rows={5} className="w-full p-5 bg-white border border-slate-100 rounded-2xl" value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} />
          </section>

          {/* SECȚIUNEA 3: Submit */}
          <button type="submit" disabled={loading} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl">
            {loading ? t.sending : t.btn_submit}
          </button>
        </form>
      </div>
    </div>
  );
}