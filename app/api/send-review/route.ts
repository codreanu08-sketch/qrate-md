import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Folosim Service Role Key pentru a avea permisiuni de scriere sigure în baza de date
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviewData = body.reviewData || body;
    
    // Luăm ID-ul trimis din setări. Dacă lipsește, avem ID-ul tău ca fallback pentru teste
    const CHAT_ID = reviewData.telegram_chat_id || reviewData.admin_chat_id || '890236835'; 

    const ratingValue = Number(reviewData.rating) || 5;
    const stars = '⭐️'.repeat(ratingValue);
    const hasPhoto = !!reviewData.photo_url;
    const company = (reviewData.company_slug || 'QRATE').toUpperCase();

    // Mesajul formatat profesional în HTML
    const messageContent = `
⚠️ <b>REVIEW NOU - QRate.md</b>
==========================
🏢 <b>Afacere:</b> ${company}
⭐ <b>Rating:</b> ${stars} (${ratingValue}/5)
👤 <b>Client:</b> ${reviewData.full_name || 'Client Anonim'}
${reviewData.phone ? `📞 <b>Tel:</b> ${reviewData.phone}` : ''}
💬 <b>Comentariu:</b> "${reviewData.comment || 'Fără comentariu'}"
==========================
${hasPhoto ? '🖼️ <i>Imagine atașată mai jos</i>' : ''}
    `.trim();

    // Salvăm recenzia în coada din Supabase cu statusul 'pending'
    const { error: queueError } = await supabase
      .from('telegram_messages_queue')
      .insert({
        chat_id: CHAT_ID,
        message_text: messageContent,
        photo_url: reviewData.photo_url || null,
        status: 'pending'
      });

    if (queueError) throw queueError;

    return NextResponse.json({ success: true, message: "Review-ul a fost adăugat cu succes în coada Telegram." });
  } catch (error: any) {
    console.error("💥 Eroare în send-review API:", error);
    return NextResponse.json({ error: 'Eroare la server', details: error?.message }, { status: 500 });
  }
}