'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Zap, Star, CheckCircle2, Loader2, Camera, X, User, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import ru from '@/messages/ru.json';
import ro from '@/messages/ro.json';

interface FeedbackFormProps {
  slug: string; // Acesta trebuie să fie ID-ul companiei
  locale: 'ro' | 'ru';
  employeeId?: string;
}

export default function FeedbackForm({ slug, locale, employeeId }: FeedbackFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [companyData, setCompanyData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: '', phone: '', comment: '' });

  const messages = useMemo(() => (locale === 'ro' ? ro : ru), [locale]);
  const t = (messages as any)?.PublicFeedback;

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name, telegram_chat_id')
        .eq('id', slug)
        .maybeSingle();
      if (data) setCompanyData(data);
      setFetching(false);
    };
    init();
  }, [slug]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert(t.alert_stars);
    setLoading(true);

    try {
      let finalPhotoUrl = null;
      if (imageFile) {
        const fileName = `${slug}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('review-photos').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        finalPhotoUrl = supabase.storage.from('review-photos').getPublicUrl(fileName).data.publicUrl;
      }

      const reviewData = {
        company_id: companyData?.id,
        rating: rating,
        full_name: formData.fullName,
        phone: formData.phone,
        comment: formData.comment || "Fără comentariu",
        photo_url: finalPhotoUrl,
        employee_id: employeeId || null,
        telegram_chat_id: companyData?.telegram_chat_id || null
      };

      const { error: dbError } = await supabase.from('reviews').insert([reviewData]);
      if (dbError) throw dbError;

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      alert("Eroare: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="space-y-4">
        <CheckCircle2 className="mx-auto text-emerald-500" size={64} />
        <h1 className="text-2xl font-bold">{t.success_title}</h1>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-black mb-6">{companyData?.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={40} className={`cursor-pointer ${(hover || rating) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} />
            ))}
          </div>
          <input className="w-full p-4 border rounded-xl" placeholder={t.placeholder_name} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
          <input className="w-full p-4 border rounded-xl" placeholder={t.placeholder_phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          <textarea className="w-full p-4 border rounded-xl" placeholder={t.placeholder_comment} rows={4} onChange={(e) => setFormData({...formData, comment: e.target.value})} />
          
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} accept="image/*" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-slate-100 rounded-xl font-bold text-sm">
            {imageFile ? imageFile.name : t.btn_add_img}
          </button>
          
          <button disabled={loading} className="w-full py-4 bg-slate-950 text-white rounded-xl font-black uppercase">
            {loading ? t.sending : t.btn_submit}
          </button>
        </form>
      </div>
    </div>
  );
}