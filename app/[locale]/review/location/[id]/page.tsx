'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Star, Camera, Video, Send, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReviewPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();

  const [location, setLocation] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Hover rating
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchLocation();
  }, [id]);

  async function fetchLocation() {
    const { data } = await supabase
      .from('locations')
      .select('id, name, address')
      .eq('id', id)
      .single();

    setLocation(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) {
      alert('Te rugăm să pui minim o stea și un comentariu.');
      return;
    }

    setSubmitting(true);

    let imageUrl = null;
    let videoUrl = null;

    // Upload imagine
    if (image) {
      const imageName = `${Date.now()}-${image.name}`;
      const { data: imgData } = await supabase.storage
        .from('reviews')
        .upload(`images/${imageName}`, image);
      if (imgData) imageUrl = imgData.path;
    }

    // Upload video (max 1 minut)
    if (video) {
      const videoName = `${Date.now()}-${video.name}`;
      const { data: vidData } = await supabase.storage
        .from('reviews')
        .upload(`videos/${videoName}`, video);
      if (vidData) videoUrl = vidData.path;
    }

    const { error } = await supabase.from('reviews').insert({
      location_id: id,
      rating,
      comment,
      phone: phone || null,
      image_url: imageUrl,
      video_url: videoUrl,
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/thank-you`);
      }, 2000);
    } else {
      alert('A apărut o eroare. Te rugăm încearcă din nou.');
    }

    setSubmitting(false);
  };

  if (!location) return <div className="min-h-screen flex items-center justify-center">Se încarcă...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">Mulțumim!</h1>
          <p className="text-xl">Recenzia ta a fost trimisă cu succes.</p>
          <p className="mt-8 text-gray-600">Ai o zi frumoasă! 🌟</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 mb-8 hover:text-black"
        >
          <ArrowLeft /> Înapoi
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h1 className="text-3xl font-bold text-center mb-2">{location.name}</h1>
          {location.address && <p className="text-center text-gray-500 mb-10">{location.address}</p>}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Rating cu stele */}
            <div>
              <p className="text-center text-lg mb-4 font-medium">Cât de mulțumit ai fost?</p>
              <div className="flex justify-center gap-3 text-5xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {rating > 0 ? `${rating} stele` : 'Alege o notă'}
              </p>
            </div>

            {/* Telefon (opțional) */}
            <div>
              <label className="block text-sm font-medium mb-2">Număr de telefon (opțional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xx xxx xxx"
                className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Comentariu */}
            <div>
              <label className="block text-sm font-medium mb-2">Comentariul tău</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ce ți-a plăcut? Ce am putea îmbunătăți?"
                rows={5}
                className="w-full px-5 py-4 border rounded-3xl focus:outline-none focus:border-blue-500 resize-none"
                required
              />
            </div>

            {/* Upload Poză */}
            <div>
              <label className="block text-sm font-medium mb-3">Adaugă poză (opțional)</label>
              <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-blue-400 transition">
                <Camera className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click pentru a alege o poză</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {image && <p className="mt-3 text-sm text-green-600">✓ {image.name}</p>}
              </label>
            </div>

            {/* Upload Video (max 60 secunde) */}
            <div>
              <label className="block text-sm font-medium mb-3">Adaugă video (max 1 minut)</label>
              <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-blue-400 transition">
                <Video className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click pentru a alege un video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideo(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {video && (
                  <p className="mt-3 text-sm text-green-600">
                    ✓ {video.name} ({Math.round(video.size / 1024 / 1024)} MB)
                  </p>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black hover:bg-gray-800 text-white py-5 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-70 transition"
            >
              {submitting ? 'Se trimite...' : 'Trimite Recenzia'} <Send />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}