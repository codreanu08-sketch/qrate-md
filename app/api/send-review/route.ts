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

    // === Găsește Chat ID-ul corect al companiei ===
    let CHAT_ID = null;

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

    // Fallback (doar pentru test)
    if (!CHAT_ID) CHAT_ID = '890236835';

    // === Construiește mesajul complet ===
    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);

    let message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n`;
    message += `==========================\n`;
    message += `⭐ <b>Rating:</b> ${stars} (${rating}/5)\n`;
    message += `👤 <b>Client:</b> ${review.full_name || 'Client Anonim'}\n`;
    
    if (review.phone) message += `📞 <b>Telefon:</b> ${review.phone}\n`;
    if (review.comment) message += `💬 <b>Comentariu:</b> "${review.comment}"\n`;
    message += `==========================`;

    // === Salvează în coadă (pentru procesare sigură) ===
    await supabase.from('telegram_messages_queue').insert({
      chat_id: CHAT_ID,
      message_text: message,
      photo_url: review.photo_url || null,
      status: 'pending'
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}