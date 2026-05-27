import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const review = body.reviewData || body;

    let CHAT_ID = null;

    // === LUĂM telegram_chat_id DIRECT DIN COMPANIE ===
    if (review.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id')
        .eq('id', review.company_id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
      }
    }

    // Fallback doar dacă nu avem nimic (temporar)
    if (!CHAT_ID) {
      console.warn("⚠️ Nu s-a găsit telegram_chat_id pentru company:", review.company_id);
      CHAT_ID = '890236835';
    }

    // === Restul codului (mesaj + coadă) ===
    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);

    let message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n==========================\n`;
    message += `⭐ <b>Rating:</b> ${stars} (${rating}/5)\n`;
    message += `👤 <b>Client:</b> ${review.full_name || 'Client Anonim'}\n`;
    if (review.phone) message += `📞 <b>Telefon:</b> ${review.phone}\n`;
    if (review.comment) message += `💬 <b>Comentariu:</b> "${review.comment}"\n`;
    message += `==========================`;

    await supabase.from('telegram_messages_queue').insert({
      chat_id: CHAT_ID,
      message_text: message,
      photo_url: review.photo_url || null,
      status: 'pending'
    });

    return NextResponse.json({ 
      success: true, 
      chat_id_used: CHAT_ID 
    });

  } catch (error: any) {
    console.error("Eroare send-review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}