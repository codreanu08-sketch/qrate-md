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

    // === CĂUTARE 1: Direct din recenzie ===
    if (review.telegram_chat_id) CHAT_ID = review.telegram_chat_id;

    // === CĂUTARE 2: Prin company_id ===
    if (!CHAT_ID && review.company_id) {
      const { data } = await supabase
        .from('companies')
        .select('telegram_chat_id')
        .eq('id', review.company_id)
        .maybeSingle();
      if (data?.telegram_chat_id) CHAT_ID = data.telegram_chat_id;
    }

    // === CĂUTARE 3: Prin location_id → company ===
    if (!CHAT_ID && review.location_id) {
      const { data: loc } = await supabase
        .from('locations')
        .select('company_id')
        .eq('id', review.location_id)
        .maybeSingle();

      if (loc?.company_id) {
        const { data: comp } = await supabase
          .from('companies')
          .select('telegram_chat_id')
          .eq('id', loc.company_id)
          .maybeSingle();
        if (comp?.telegram_chat_id) CHAT_ID = comp.telegram_chat_id;
      }
    }

    // === FALLBACK (doar pentru test) ===
    if (!CHAT_ID) {
      CHAT_ID = '890236835';
      console.log("⚠️ Folosim fallback ID");
    }

    // === Mesaj + salvare în coadă (la fel ca înainte) ===
    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);
    const company = (review.company_slug || 'QRATE').toUpperCase();

    const message = `
⚠️ <b>REVIEW NOU - QRate.md</b>
==========================
🏢 <b>Afacere:</b> ${company}
${review.location_id ? `📍 <b>Locație:</b> ${review.location_id}` : ''}
${review.employee_id ? `👤 <b>Angajat:</b> ${review.employee_id}` : ''}
⭐ <b>Rating:</b> ${stars} (${rating}/5)
👤 <b>Client:</b> ${review.full_name || 'Anonim'}
${review.phone ? `📞 <b>Tel:</b> ${review.phone}` : ''}
💬 <b>Comentariu:</b> "${review.comment || 'Fără comentariu'}"
==========================
    `.trim();

    await supabase.from('telegram_messages_queue').insert({
      chat_id: CHAT_ID,
      message_text: message,
      photo_url: review.photo_url || null,
      status: 'pending'
    });

    return NextResponse.json({ success: true, chat_id_used: CHAT_ID });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}