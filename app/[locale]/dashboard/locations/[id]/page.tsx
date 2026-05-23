'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, Trash2, Sparkles, Lock, MessageCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

// Definirea tipurilor
interface Review {
  id: string;
  rating: number;
  comment: string;
  full_name: string | null; // <-- Adăugat numele complet
  phone: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

interface LocationData {
  id: string;
  name: string;
  address: string | null;
}

export default function LocationDetail() {
  const params = useParams();
  const id = params?.id as string;
  const locale = (params?.locale as string) || 'ro';
  const router = useRouter();

  const [location, setLocation] = useState<LocationData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  
  // Stare pentru blocarea accesului (Trial expirat)
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Verificăm sesiunea și trial-ul utilizatorului
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${locale}/auth/login`);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, created_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        const signupDate = new Date(profile.created_at);
        const now = new Date();
        const diffInDays = (now.getTime() - signupDate.getTime()) / (1000 * 3600 * 24);
        
        const isPro = profile.subscription_tier === 'pro';
        const trialExpired = diffInDays > 7;

        // Dacă trial-ul a expirat și nu are PRO, blocăm pagina
        if (!isPro && trialExpired) {
          setIsBlocked(true);
          setLoading(false);
          return; 
        }
      }

      // 2. Dacă accesul este permis, încărcăm datele locației
      await Promise.all([fetchLocation(), fetchReviews()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLocation() {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (data) setLocation(data as LocationData);
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('location_id', id)
      .order('created_at', { ascending: false });

    const reviewsData = (data || []) as Review[];
    setReviews(reviewsData);
    generateSignedUrls(reviewsData);
  }

  async function generateSignedUrls(reviewsList: Review[]) {
    const urls: Record<string, string> = {};
    for (const review of reviewsList) {
      if (review.image_url) {
        const { data } = await supabase.storage
          .from('reviews')
          .createSignedUrl(review.image_url, 3600);
        if (data) urls[review.image_url] = data.signedUrl;
      }
      if (review.video_url) {
        const { data } = await supabase.storage
          .from('reviews')
          .createSignedUrl(review.video_url, 3600);
        if (data) urls[review.video_url] = data.signedUrl;
      }
    }
    setSignedUrls(urls);
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Sigur vrei să ștergi această recenzie?')) return;
    const review = reviews.find(r => r.id === reviewId);
    if (review?.image_url) await supabase.storage.from('reviews').remove([review.image_url]);
    if (review?.video_url) await supabase.storage.from('reviews').remove([review.video_url]);
    await supabase.from('reviews').delete().eq('id', reviewId);
    fetchReviews();
  };

  // Generator Link WhatsApp inteligent bazat pe nota clientului
  const generateWhatsAppUrl = (phone: string, rating: number, clientName: string | null) => {
    const cleanPhone = phone.replace(/\D/g, ''); // Elimină spații, plusuri, paranteze
    let formattedPhone = cleanPhone;

    // Adăugare prefixe automate RO / MD dacă utilizatorul scrie numărul local cu '0'
    if (cleanPhone.startsWith('0')) {
      if (cleanPhone.length === 10) {
        formattedPhone = '40' + cleanPhone.substring(1); // România (ex: 07xx -> 407xx)
      } else if (cleanPhone.length === 9) {
        formattedPhone = '373' + cleanPhone.substring(1); // Moldova (ex: 06xx -> 3736xx)
      }
    }

    const nameToUse = clientName || 'Stimate client';
    
    // Mesaje complet personalizate în funcție de rating (Premium feature)
    const textMessage = rating <= 3
      ? `Bună ziua, ${nameToUse}! Vă contactăm din partea echipei ${location?.name}. Am primit feedback-ul dumneavoastră de ${rating} ⭐ pe platforma QRate și ne pare nespus de rău pentru experiența neplăcută. Ne-ar ajuta foarte mult să aflăm mai multe detalii pentru a remedia situația de urgență.`
      : `Bună ziua, ${nameToUse}! Vă mulțumim din suflet pentru recenzia pozitivă de ${rating} ⭐ oferită echipei ${location?.name} prin QRate. Ne bucurăm enorm că ați fost mulțumit și vă mai așteptăm cu drag!`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMessage)}`;
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc: number, r: Review) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // 1. Ecran de încărcare
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="p-12 text-center flex-1 ml-72 flex items-center justify-center">
          <p className="text-xl font-bold text-blue-600 animate-pulse">Se încarcă datele...</p>
        </div>
      </div>
    );
  }

  // 2. ECRAN DE BLOCARE (TRIAL EXPIRAT)
  if (isBlocked) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-72 flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center border border-blue-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600">
              <Lock size={40} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Trial-ul a expirat</h2>
            <p className="text-gray-500 mb-10 leading-relaxed font-medium">
              Cele 7 zile de testare gratuită s-au încheiat. Abonează-te la planul <span className="text-blue-600 font-bold">PRO</span> pentru a debloca recenziile și analizele acestei locații.
            </p>
            <button
              onClick={() => router.push(`/${locale}/dashboard/subscription`)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles size={20} /> ACTIVEAZĂ PRO ACUM ⚡
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Ecran locație negăsită
  if (!location) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="p-12 text-center flex-1 ml-72">Locația nu a fost găsită.</div>
      </div>
    );
  }

  // 4. ECRANUL PRINCIPAL (ACCES PERMIS)
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <button
          onClick={() => router.push(`/${locale}/dashboard/locations`)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors font-bold"
        >
          <ArrowLeft size={20} /> Înapoi la locații
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="border-b pb-8">
            <h1 className="text-4xl font-bold mb-2">{location.name}</h1>
            {location.address && <p className="text-gray-500 text-lg">{location.address}</p>}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{reviews.length}</p>
              <p className="text-blue-800 font-medium">Total Recenzii</p>
            </div>
            <div className="bg-yellow-50 rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold text-yellow-600">{averageRating}</p>
              <p className="text-yellow-800 font-medium">Notă Medie</p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              Recenzii Recente <span className="text-sm font-normal text-gray-400">({reviews.length})</span>
            </h2>

            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
                <p className="text-gray-400">Nu există recenzii pentru această locație încă.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-100 rounded-3xl p-8 bg-white shadow-sm hover:shadow-md transition-all">
                    
                    {/* Headerul Recenziei: Avatar + Nume + Buton Ștergere */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar premium din inițiala numelui */}
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-2xl flex items-center justify-center font-black uppercase text-base border border-slate-200 shadow-sm">
                          {(review.full_name || 'A')[0]}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-lg leading-tight">
                            {review.full_name || 'Client Anonim'}
                          </h3>
                          {/* Afișarea Stelelor sub nume */}
                          <div className="flex gap-0.5 mt-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={`${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteReview(review.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                        title="Șterge recenzia"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Comentariul */}
                    <p className="text-gray-700 text-lg leading-relaxed mt-2 pl-1">{review.comment}</p>

                    {/* Zona de Contact și Acțiuni (Butonul WhatsApp integrat inteligent) */}
                    {review.phone && (
                      <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/60">
                          📱 {review.phone}
                        </div>
                        
                        <a
                          href={generateWhatsAppUrl(review.phone, review.rating, review.full_name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          <MessageCircle size={16} className="fill-current" />
                          Răspunde pe WhatsApp
                        </a>
                      </div>
                    )}

                    {/* Imagini sau clipuri video atașate de client */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {review.image_url && signedUrls[review.image_url] && (
                        <img
                          src={signedUrls[review.image_url]}
                          alt="Review photo"
                          className="rounded-2xl w-full h-64 object-cover border"
                        />
                      )}
                      {review.video_url && signedUrls[review.video_url] && (
                        <video
                          src={signedUrls[review.video_url]}
                          controls
                          className="rounded-2xl w-full h-64 object-cover border bg-black"
                        />
                      )}
                    </div>

                    {/* Data Recenziei */}
                    <div className="mt-6 flex justify-end">
                      <p className="text-xs text-gray-400 font-mono font-medium">
                        {new Date(review.created_at).toLocaleDateString('ro-RO', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}