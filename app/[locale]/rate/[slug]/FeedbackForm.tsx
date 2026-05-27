'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
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

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('');
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [fetchingIds, setFetchingIds] = useState<boolean>(true);

  const messages = useMemo(() => (locale === 'ro' ? ro : ru), [locale]);
  
  const t = (messages as any)?.PublicFeedback || { /* ... defaults ... */ };

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
        employee_id: employeeId || null,
        telegram_chat_id: null   // Va fi completat automat de trigger
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

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900">
      {/* restul codului rămâne la fel */}
      {/* ... (header + form) ... */}
    </div>
  );
}