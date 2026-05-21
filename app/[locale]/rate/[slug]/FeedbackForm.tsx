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
            return;
          }
        }
        
        const { data: locData } = await supabase
          .from('locations')
          .select('id, name, company_id')
          .eq('id', slug)
          .maybeSingle();

        if (locData) {
          setCompanyId(locData.company_id);
          setLocationId(locData.id);
          setTargetName(locData.name);
          setIsEmployee(false);
        } else {
          const { data: compData } = await supabase
            .from('companies')
            .select('id, name')
            .eq('slug', slug)
            .maybeSingle();

          if (compData) {
            setCompanyId(compData.id);
            setTargetName(compData.name);
            setIsEmployee(false);
          }
        }
      } catch (err) {
        console.error("Eroare la identificare:", err);
      } finally {
        setFetchingIds(false);
      }
    }
    if (slug) getCorrectIdentifiers();
  }, [slug, employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);

    try {
      let finalPhotoUrl = null;
      if (imageFile) {
        const fileName = `${slug}/${crypto.randomUUID()}.${imageFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('review-photos').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        finalPhotoUrl = supabase.storage.from('review-photos').getPublicUrl(fileName).data.publicUrl;
      }

      // Folosim employeeId-ul primit din props direct
      const { data: insertedReview, error: dbError } = await supabase
        .from('reviews')
        .insert([{
          company_slug: slug,
          company_id: companyId,
          location_id: locationId,
          employee_id: employeeId || null, 
          rating,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          comment: formData.comment || t.no_comment,
          photo_url: finalPhotoUrl
        }])
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">
                {t.heading_for} {isEmployee ? 'Staff' : 'Locație'}
              </span>
              <span className="text-sm font-black text-slate-950 uppercase tracking-widest truncate">{targetName}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
        <form onSubmit={handleSubmit} className="space-y-10">
          <section>
            <div className="flex justify-between items-center gap-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="p-1">
                  <Star size={48} className={(hover || rating) >= star ? 'fill-yellow-400 text-yellow-500' : 'text-slate-200 fill-slate-50'} />
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <input type="text" placeholder={t.placeholder_name} required className="w-full p-5 bg-white border border-slate-100 rounded-2xl" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            <textarea placeholder={t.placeholder_comment} rows={5} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem]" value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})} />
          </section>

          <button type="submit" disabled={loading || rating === 0} className="w-full py-6 rounded-[2rem] bg-slate-950 text-white font-black uppercase tracking-widest">
            {loading ? t.sending : t.btn_submit}
          </button>
        </form>
      </div>
    </div>
  );
}