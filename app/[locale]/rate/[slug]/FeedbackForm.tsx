'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Star, CheckCircle2, Loader2, Camera, X } from 'lucide-react';
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
  const searchParams = useSearchParams();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [resolvedEmployeeId, setResolvedEmployeeId] = useState<string | null>(null); // ✅ NOU
  const [targetName, setTargetName] = useState<string>('');
  const [fetchingIds, setFetchingIds] = useState<boolean>(true);

  const messages = useMemo(() => (locale === 'ro' ? ro : ru), [locale]);

  const t = (messages as any)?.PublicFeedback || {
    step: locale === 'ro' ? 'Pasul 1/1' : 'Шаг 1/1',
    heading_for: locale === 'ro' ? 'Feedback pentru' : 'Отзыв для',
    label_step1: locale === 'ro' ? 'Alege nota ta' : 'Выберите оценку',
    label_step2: locale === 'ro' ? 'Detalii despre vizită' : 'Детали визита',
    label_step3: locale === 'ro' ? 'Atașează o poză (opțional)' : 'Прикрепить фото (опционально)',
    placeholder_name: locale === 'ro' ? 'Numele tău complet' : 'Ваше полное имя',
    placeholder_phone: locale === 'ro' ? 'Telefon (ex: 07xx...)' : 'Телефон',
    placeholder_comment: locale === 'ro' ? 'Comentariul tău (ce ți-a plăcut, ce putem îmbunătăți)...' : 'Ваш комментарий...',
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
    const fetchIds = async () => {
      setFetchingIds(true);
      try {
        // 1. Ia compania
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, telegram_chat_id')
          .eq('id', slug)
          .single();

        if (companyError || !company) {
          console.error('Company not found:', companyError);
          return;
        }

        setCompanyId(company.id);
        setTargetName(company.name);
        setTelegramChatId(company.telegram_chat_id ?? null);

        // 2. Citește toți query params din URL
        const locationFromUrl = searchParams.get('location');  // ?location=UUID
        const employeeFromUrl = searchParams.get('employee');  // ?employee=UUID

        // 3. ✅ Rezolvă employee_id — prioritate: URL > prop
        const finalEmployeeId = employeeFromUrl || employeeId || null;
        setResolvedEmployeeId(finalEmployeeId);

        // 4. Rezolvă location_id
        if (locationFromUrl) {
          // Location vine din URL direct (QR locație sau QR angajat)
          setLocationId(locationFromUrl);

          // Dacă e angajat, afișează numele lui în header
          if (finalEmployeeId) {
            const { data: employee } = await supabase
              .from('employees')
              .select('name')
              .eq('id', finalEmployeeId)
              .single();
            if (employee) setTargetName(employee.name);
          }
        } else if (finalEmployeeId) {
          // Nu avem location în URL — o luăm din tabelul employees
          const { data: employee } = await supabase
            .from('employees')
            .select('name, location_id')
            .eq('id', finalEmployeeId)
            .single();
          if (employee) {
            setLocationId(employee.location_id ?? null);
            setTargetName(employee.name);
          }
        } else {
          // Fallback — prima locație a companiei
          const { data: location } = await supabase
            .from('locations')
            .select('id')
            .eq('company_id', company.id)
            .limit(1)
            .single();
          if (location) setLocationId(location.id);
        }
      } catch (err) {
        console.error('fetchIds error:', err);
      } finally {
        setFetchingIds(false);
      }
    };

    fetchIds();
  }, [slug, employeeId, searchParams]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Imagine prea mare! Max 5MB.");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert(t.alert_stars);
      return;
    }
    setLoading(true);

    try {
      let finalPhotoUrl = null;
      if (imageFile) {
        const fileName = `${slug}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        finalPhotoUrl = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName).data.publicUrl;
      }

      const reviewData = {
        company_slug: slug,
        company_id: companyId,              // ✅ UUID real din companies
        location_id: locationId,            // ✅ din ?location= sau din employees
        rating: rating,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        comment: formData.comment || t.no_comment,
        photo_url: finalPhotoUrl,
        employee_id: resolvedEmployeeId,    // ✅ din ?employee= sau din prop
        telegram_chat_id: telegramChatId    // ✅ din companies
      };

      console.log("DEBUG - Trimit reviewData:", reviewData);

      const { error: dbError } = await supabase
        .from('reviews')
        .insert([reviewData]);

      if (dbError) throw dbError;

      if (rating <= 3) {
        await fetch('/api/send-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewData }),
        });
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

  if (fetchingIds) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
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
              <span className="text-sm font-black text-slate-950 uppercase tracking-widest truncate">{targetName || "Companie"}</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase">{t.step}</div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">{t.label_step1}</label>
            <div className="flex justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 focus:outline-none"
                >
                  <Star size={48} className={`transition-all ${(hover || rating) >= star ? 'fill-yellow-400 text-yellow-500' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">{t.label_step2}</label>
            <input type="text" placeholder={t.placeholder_name} required className="w-full p-5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-slate-400 transition-all" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            <input type="text" placeholder={t.placeholder_phone} className="w-full p-5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-slate-400 transition-all" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <textarea placeholder={t.placeholder_comment} rows={5} className="w-full p-5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-slate-400 transition-all resize-none" value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} />
          </section>

          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">{t.label_step3}</label>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 bg-white border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 transition-all p-8 rounded-2xl group"
              >
                <div className="bg-slate-50 group-hover:bg-blue-50 p-4 rounded-xl text-slate-400 group-hover:text-blue-500 transition-colors">
                  <Camera size={24} />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{t.btn_add_img}</span>
              </button>
            ) : (
              <div className="relative bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm animate-in fade-in duration-300">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight truncate">{imageFile?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{(imageFile ? (imageFile.size / (1024 * 1024)).toFixed(2) : 0)} MB</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-black uppercase tracking-wider rounded-lg transition-colors">
                    {t.btn_change_img}
                  </button>
                  <button type="button" onClick={removeImage} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" title={t.btn_del_img}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-slate-950 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={20} />{t.sending}</>
            ) : (
              t.btn_submit
            )}
          </button>
        </form>
      </div>
    </div>
  );
}