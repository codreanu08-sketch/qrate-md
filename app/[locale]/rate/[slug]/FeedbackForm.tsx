'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Star, CheckCircle2, Loader2, Camera, X, User, ExternalLink } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import ru from '@/messages/ru.json';
import ro from '@/messages/ro.json';

interface FeedbackFormProps {
  slug: string;
  locale: 'ro' | 'ru';
  employeeId?: string;
  locationId?: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
}

export default function FeedbackForm({ slug, locale, employeeId, locationId: locationIdProp }: FeedbackFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null);
  const [resolvedEmployeeId, setResolvedEmployeeId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('');
  const [fetchingIds, setFetchingIds] = useState<boolean>(true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null); // ✅ NOU
  const [reviewId, setReviewId] = useState<string | null>(null); // ✅ NOU - pentru tracking

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const messages = useMemo(() => (locale === 'ro' ? ro : ru), [locale]);

  const t = (messages as any)?.PublicFeedback || {
    step: locale === 'ro' ? 'Pasul 1/1' : 'Шаг 1/1',
    heading_for: locale === 'ro' ? 'Feedback pentru' : 'Отзыв для',
    label_step1: locale === 'ro' ? 'Alege nota ta' : 'Выберите оценку',
    label_step2: locale === 'ro' ? 'Detalii despre vizită' : 'Детали визита',
    label_step3: locale === 'ro' ? 'Atașează o poză (opțional)' : 'Прикрепить фото (опционально)',
    label_employee: locale === 'ro' ? 'Cui adresezi recenzia? (opțional)' : 'Кому адресуете отзыв? (необязательно)',
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
    no_comment: (messages as any)?.Dashboard?.feed?.no_comment || (locale === 'ro' ? 'Clientul nu a lăsat un comentariu' : 'Клиент не оставил комментария'),
    google_title: locale === 'ro' ? 'Ți-a plăcut experiența?' : 'Вам понравился опыт?',
    google_subtitle: locale === 'ro' ? 'Ajută-ne și pe Google! Lasă o recenzie și acolo.' : 'Помогите нам и на Google! Оставьте отзыв и там.',
    google_btn: locale === 'ro' ? 'Lasă recenzie pe Google' : 'Оставить отзыв на Google',
    google_skip: locale === 'ro' ? 'Nu acum' : 'Не сейчас',
  };

  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [cooldownActive, setCooldownActive] = useState(false);
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
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, telegram_chat_id, google_review_url')
          .eq('id', slug)
          .single();

        if (companyError || !company) {
          console.error('Company not found:', companyError);
          setFetchingIds(false);
          return;
        }

        setCompanyId(company.id);
        setTargetName(company.name);
        setTelegramChatId(company.telegram_chat_id ?? null);
        // ✅ Setează URL-ul Google al companiei ca fallback
        setGoogleReviewUrl(company.google_review_url ?? null);

        const finalLocationId = locationIdProp || searchParams.get('location');
        const finalEmployeeId = employeeId || searchParams.get('employee');

        if (finalLocationId) {
          setLocationId(finalLocationId);

          // ✅ Ia google_review_url din locație (prioritate față de companie)
          const { data: loc } = await supabase
            .from('locations')
            .select('google_review_url')
            .eq('id', finalLocationId)
            .single();

          if (loc?.google_review_url) {
            setGoogleReviewUrl(loc.google_review_url); // locația are prioritate
          }
        }

        if (finalEmployeeId) {
          setResolvedEmployeeId(finalEmployeeId);
          const { data: emp } = await supabase
            .from('employees')
            .select('id, name, position, photo_url, location_id')
            .eq('id', finalEmployeeId)
            .single();
          if (emp) {
            setTargetName(emp.name);
            setSelectedEmployee(emp);
            if (!finalLocationId && emp.location_id) {
              setLocationId(emp.location_id);

              // ✅ Ia google_review_url din locația angajatului
              const { data: empLoc } = await supabase
                .from('locations')
                .select('google_review_url')
                .eq('id', emp.location_id)
                .single();
              if (empLoc?.google_review_url) {
                setGoogleReviewUrl(empLoc.google_review_url);
              }
            }
          }
        } else {
          let query = supabase
            .from('employees')
            .select('id, name, position, photo_url')
            .eq('company_id', company.id)
            .order('name');

          if (finalLocationId) {
            query = query.eq('location_id', finalLocationId);
          }

          const { data: empList } = await query;
          setEmployees(empList || []);

          if (!finalLocationId) {
            const { data: loc } = await supabase
              .from('locations')
              .select('id, google_review_url')
              .eq('company_id', company.id)
              .limit(1)
              .single();
            if (loc) {
              setLocationId(loc.id);
              if (loc.google_review_url) setGoogleReviewUrl(loc.google_review_url);
            }
          }
        }
      } catch (err) {
        console.error('fetchIds error:', err);
      } finally {
        setFetchingIds(false);
      }
    };

    fetchIds();
  }, [slug, employeeId, locationIdProp, searchParams]);

  // Cooldown: verifică dacă dispozitivul a trimis recent o recenzie pentru acest slug
  useEffect(() => {
    const key = `qrate_cooldown_${slug}`;
    const ts = localStorage.getItem(key);
    if (ts && Date.now() - Number(ts) < 60 * 60 * 1000) {
      setCooldownActive(true);
    }
  }, [slug]);

  const handleSelectEmployee = (emp: Employee) => {
    if (selectedEmployee?.id === emp.id) {
      setSelectedEmployee(null);
      setResolvedEmployeeId(null);
    } else {
      setSelectedEmployee(emp);
      setResolvedEmployeeId(emp.id);
    }
  };

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

  // ✅ Tracking redirect Google
  const handleGoogleRedirect = async () => {
    if (!googleReviewUrl) return;

    try {
      // Marchează recenzia ca redirectată spre Google
      if (reviewId) {
        await supabase
          .from('reviews')
          .update({
            redirected_to_google: true,
            redirected_to_google_at: new Date().toISOString()
          })
          .eq('id', reviewId);
      }

      // Inserează în tabelul de tracking detaliat
      await supabase.from('google_redirects').insert([{
        company_id: companyId,
        location_id: locationId,
        employee_id: resolvedEmployeeId,
        review_id: reviewId,
        rating: rating,
      }]);
    } catch (err) {
      console.error('Google tracking error:', err);
    }

    // Deschide Google în tab nou
    window.open(googleReviewUrl, '_blank');
    setShowGooglePrompt(false);
    setSubmitted(true);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Honeypot — bot-urile completează câmpul ascuns
    if (honeypot) return;

    // 2. Cooldown — același dispozitiv, max 1 recenzie/oră per companie
    if (cooldownActive) {
      alert(locale === 'ro' ? 'Ai trimis deja o recenzie recent. Revino mai târziu.' : 'Вы уже отправили отзыв недавно. Попробуйте позже.');
      return;
    }

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
        company_id: companyId,
        location_id: locationId,
        rating: rating,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        comment: formData.comment || t.no_comment,
        photo_url: finalPhotoUrl,
        employee_id: resolvedEmployeeId,
        telegram_chat_id: telegramChatId,
        redirected_to_google: false,
      };

      console.log("DEBUG - Trimit reviewData:", reviewData);

      const { data: insertedReview, error: dbError } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select('id')
        .single();

      if (dbError) throw dbError;

      // ✅ Salvează ID-ul recenziei pentru tracking Google
      if (insertedReview?.id) setReviewId(insertedReview.id);

      // Notificare Telegram doar pentru recenzii negative (1-3 stele)
      if (rating <= 3) {
        await fetch('/api/send-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewData }),
        });
      }

      // Setează cooldown pentru 1 oră pe acest dispozitiv
      localStorage.setItem(`qrate_cooldown_${slug}`, String(Date.now()));

      // ✅ Dacă rating 4-5 și există URL Google → afișează prompt Google
      if (rating >= 4 && googleReviewUrl) {
        setShowGooglePrompt(true);
      } else {
        setSubmitted(true);
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ECRAN GOOGLE PROMPT — apare după submit cu 4-5 stele
  if (showGooglePrompt && googleReviewUrl) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 max-w-sm w-full">
          {/* Checkmark verde */}
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white ring-8 ring-emerald-50">
            <CheckCircle2 size={40} strokeWidth={1.5} />
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-950 uppercase">{t.success_title}</h1>
            <p className="text-slate-500 font-medium mt-2">{t.success_text}</p>
          </div>

          {/* Card Google */}
          <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-lg space-y-4">
            {/* Logo Google */}
            <div className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-black text-slate-800 text-lg">Google Reviews</span>
            </div>

            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              {t.google_subtitle}
            </p>

            <div className="flex gap-1 justify-center">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={20} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            <button
              onClick={handleGoogleRedirect}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <ExternalLink size={16} />
              {t.google_btn}
            </button>

            <button
              onClick={() => { setShowGooglePrompt(false); setSubmitted(true); window.scrollTo(0,0); }}
              className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              {t.google_skip}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {/* Honeypot — ascuns pentru useri, vizibil pentru boti */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {employees.length > 0 && !employeeId && !searchParams.get('employee') && (
            <section className="space-y-4">
              <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">{t.label_employee}</label>
              <div className="grid grid-cols-2 gap-3">
                {employees.map((emp) => {
                  const isSelected = selectedEmployee?.id === emp.id;
                  return (
                    <button key={emp.id} type="button" onClick={() => handleSelectEmployee(emp)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                      {emp.photo_url ? (
                        <img src={emp.photo_url} alt={emp.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><User size={22} className="text-slate-400" /></div>
                      )}
                      <div className="min-w-0">
                        <p className={`text-xs font-black uppercase truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{emp.name}</p>
                        {emp.position && <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{emp.position}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedEmployee && (
                <p className="text-[11px] text-blue-600 font-bold text-center">
                  {locale === 'ro' ? `✓ Recenzie pentru ${selectedEmployee.name}` : `✓ Отзыв для ${selectedEmployee.name}`}
                </p>
              )}
            </section>
          )}

          <section className="space-y-4">
            <label className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] ml-1">{t.label_step1}</label>
            <div className="flex justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              {[1,2,3,4,5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="p-1 focus:outline-none">
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
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-3 bg-white border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 transition-all p-8 rounded-2xl group">
                <div className="bg-slate-50 group-hover:bg-blue-50 p-4 rounded-xl text-slate-400 group-hover:text-blue-500 transition-colors"><Camera size={24} /></div>
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
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-black uppercase tracking-wider rounded-lg transition-colors">{t.btn_change_img}</button>
                  <button type="button" onClick={removeImage} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" title={t.btn_del_img}><X size={16} /></button>
                </div>
              </div>
            )}
          </section>

          <button type="submit" disabled={loading} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-slate-950 transition-all flex items-center justify-center gap-2">
            {loading ? (<><Loader2 className="animate-spin" size={20} />{t.sending}</>) : (t.btn_submit)}
          </button>
        </form>
      </div>
    </div>
  );
}