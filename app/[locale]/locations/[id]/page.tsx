'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, Download, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function LocationDetail() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();

  const [location, setLocation] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchLocation();
      fetchReviews();
    }
  }, [id]);

  async function fetchLocation() {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    setLocation(data);
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('location_id', id)
      .order('created_at', { ascending: false });

    setReviews(data || []);
    generateSignedUrls(data || []);
  }

  // Generează Signed URLs pentru poze și video-uri (doar tu poți vedea)
  async function generateSignedUrls(reviewsList: any[]) {
    const urls: Record<string, string> = {};

    for (const review of reviewsList) {
      if (review.image_url) {
        const { data } = await supabase.storage
          .from('reviews')
          .createSignedUrl(review.image_url, 3600); // 1 oră valabilitate

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

    // Șterge fișierele din storage
    if (review?.image_url) {
      await supabase.storage.from('reviews').remove([review.image_url]);
    }
    if (review?.video_url) {
      await supabase.storage.from('reviews').remove([review.video_url]);
    }

    // Șterge recenzia
    await supabase.from('reviews').delete().eq('id', reviewId);

    fetchReviews(); // refresh
  };

  if (loading && !location) return <div className="p-12 text-center">Se încarcă locația...</div>;
  if (!location) return <div className="p-12 text-center">Locația nu a fost găsită.</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <button
          onClick={() => router.push(`/${locale}/locations`)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft size={20} /> Înapoi la locații
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h1 className="text-4xl font-bold mb-2">{location.name}</h1>
          {location.address && <p className="text-gray-600 text-lg">{location.address}</p>}

          {/* Statistici */}
          <div className="mt-8 grid grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold">{reviews.length}</p>
              <p className="text-gray-500">Recenzii</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
                  : '0.0'}
              </p>
              <p className="text-gray-500">Notă medie</p>
            </div>
          </div>

          {/* Lista recenzii */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Recenzii ({reviews.length})</h2>

            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Nu există recenzii încă.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border border-gray-100 rounded-2xl p-8 mb-8 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <p className="mt-4 text-gray-700 leading-relaxed">{review.comment}</p>

                  {review.phone && (
                    <p className="text-sm text-gray-500 mt-3">📱 {review.phone}</p>
                  )}

                  {/* Poză */}
                  {review.image_url && signedUrls[review.image_url] && (
                    <div className="mt-6">
                      <img
                        src={signedUrls[review.image_url]}
                        alt="Review photo"
                        className="rounded-2xl max-h-96 w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Video */}
                  {review.video_url && signedUrls[review.video_url] && (
                    <div className="mt-6">
                      <video
                        src={signedUrls[review.video_url]}
                        controls
                        className="rounded-2xl w-full max-h-[500px]"
                      />
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-6">
                    {new Date(review.created_at).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}