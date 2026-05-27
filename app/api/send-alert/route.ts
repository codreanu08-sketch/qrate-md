import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviewData = body.reviewData || body;
    
    // === LUĂM CHAT_ID DIN COMPANIE ===
    let CHAT_ID = '890236835'; // fallback temporar

    if (reviewData.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id')
        .eq('id', reviewData.company_id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
      }
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8169972917:AAGgxHB7vi26JTjCFQx2s0ulxPbbAJO2GCA';

    const ratingValue = Number(reviewData.rating) || 5;
    const stars = '⭐️'.repeat(ratingValue);
    const hasPhoto = !!reviewData.photo_url;
    const companyName = (reviewData.company_slug || 'QRATE').toUpperCase();

    const messageContent = `
⚠️ <b>REVIEW NOU - QRate.md</b>
==========================
🏢 <b>Afacere:</b> ${companyName}
⭐ <b>Rating:</b> ${stars} (${ratingValue}/5)
👤 <b>Client:</b> ${reviewData.full_name || 'Client Anonim'}
${reviewData.phone ? `📞 <b>Tel:</b> ${reviewData.phone}` : ''}
💬 <b>Comentariu:</b> "${reviewData.comment || 'Fără comentariu'}"
==========================
${hasPhoto ? '🖼️ <i>Imagine atașată mai jos</i>' : ''}
    `.trim();

    const telegramMethod = hasPhoto ? 'sendPhoto' : 'sendMessage';
    
    const telegramBody: any = {
      chat_id: CHAT_ID,
      parse_mode: 'HTML',
    };

    if (hasPhoto) {
      telegramBody.photo = reviewData.photo_url;
      telegramBody.caption = messageContent;
    } else {
      telegramBody.text = messageContent;
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${telegramMethod}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramBody),
    });

    const telegramRes = await res.json();

    if (!telegramRes.ok) {
      console.error("❌ Eroare Telegram API:", telegramRes);
      return NextResponse.json({ error: telegramRes.description }, { status: 400 });
    }

    return NextResponse.json({ success: true, chat_id_used: CHAT_ID });

  } catch (error: any) {
    console.error("💥 Eroare Server:", error);
    return NextResponse.json({ error: 'Eroare la server', details: error?.message }, { status: 500 });
  }
}