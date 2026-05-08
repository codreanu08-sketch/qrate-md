'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

// Definirea tipurilor pentru a evita eroarea "any"
interface Review {
  id: string;
  rating: number;
  comment: string;
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

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
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

    if (review?.image_url) {
      await supabase.storage.from('reviews').remove([review.image_url]);
    }
    if (review?.video_url) {
      await supabase.storage.from('reviews').remove([review.video_url]);
    }

    await supabase.from('reviews').delete().eq('id', reviewId);
    fetchReviews();
  };

  // Calcularea mediei cu tipare explicită pentru a evita eroarea de build
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc: number, r: Review) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) return <div className="p-12 text-center flex-1 ml-72">Se încarcă locația...</div>;
  if (!location) return <div className="p-12 text-center flex-1 ml-72">Locația nu a fost găsită.</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <button
          onClick={() => router.push(`/${locale}/locations`)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Înapoi la locații
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="border-b pb-8">
            <h1 className="text-4xl font-bold mb-2">{location.name}</h1>
            {location.address && <p className="text-gray-500 text-lg">{location.address}</p>}
          </div>

          {/* Statistici rapide */}
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

          {/* Lista recenzii */}
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
                  <div key={review.id} className="border border-gray-100 rounded-3xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            className={`${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                        title="Șterge recenzia"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <p className="mt-4 text-gray-700 text-lg leading-relaxed">{review.comment}</p>

                    {review.phone && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 w-fit px-3 py-1 rounded-full">
                        <span>📱 {review.phone}</span>
                      </div>
                    )}

                    {/* Media content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {review.image_url && signedUrls[review.image_url] && (
                        <div className="relative group">
                          <img
                            src={signedUrls[review.image_url]}
                            alt="Review photo"
                            className="rounded-2xl w-full h-64 object-cover border"
                          />
                        </div>
                      )}

                      {review.video_url && signedUrls[review.video_url] && (
                        <div className="relative">
                          <video
                            src={signedUrls[review.video_url]}
                            controls
                            className="rounded-2xl w-full h-64 object-cover border bg-black"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                      <p className="text-xs text-gray-400 font-mono">
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