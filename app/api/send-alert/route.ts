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

    // Rate limiting per companie — max 30 alerte/oră
    if (reviewData.company_id) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', reviewData.company_id)
        .gte('created_at', oneHourAgo);

      if (count !== null && count >= 30) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }

    // === LUĂM CHAT_ID DIN COMPANIE ===
    let CHAT_ID: string | null = null;

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

    if (!CHAT_ID) {
      return NextResponse.json({ error: 'Telegram chat ID not configured for this company' }, { status: 400 });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const ratingValue = Number(reviewData.rating) || 5;
    const stars = '*'.repeat(ratingValue);
    const hasPhoto = !!reviewData.photo_url;
    const companyName = (reviewData.company_slug || 'QRATE').toUpperCase();
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const messageContent = [
      `<b>REVIEW NOU - QRate.md</b>`,
      `==========================`,
      `<b>Afacere:</b> ${esc(companyName)}`,
      `<b>Rating:</b> ${stars} (${ratingValue}/5)`,
      `<b>Client:</b> ${esc(reviewData.full_name || 'Client Anonim')}`,
      reviewData.phone ? `<b>Tel:</b> ${esc(String(reviewData.phone))}` : '',
      `<b>Comentariu:</b> "${esc(String(reviewData.comment || 'Fara comentariu'))}"`,
      `==========================`,
      hasPhoto ? '<i>Imagine atasata mai jos</i>' : '',
    ].filter(Boolean).join('\n');

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