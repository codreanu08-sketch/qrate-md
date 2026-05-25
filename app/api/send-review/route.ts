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
    let source = "fallback";

    // === Căutare în companies ===
    if (review.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id, name')
        .eq('id', review.company_id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
        source = "companies_table";
      }
    }

    // === Fallback ===
    if (!CHAT_ID) {
      CHAT_ID = '890236835';
      source = "hardcoded_fallback";
    }

    // === Mesaj ===
    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);

    const message = `⚠️ <b>REVIEW NOU</b>\n⭐ Rating: ${stars}\n👤 Client: ${review.full_name || 'Anonim'}`;

    // Salvăm în coadă
    await supabase.from('telegram_messages_queue').insert({
      chat_id: CHAT_ID,
      message_text: message,
      photo_url: review.photo_url || null,
      status: 'pending'
    });

    // === Răspuns de debug ===
    return NextResponse.json({ 
      success: true, 
      chat_id_used: CHAT_ID,
      source: source,
      company_id_received: review.company_id || null
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}