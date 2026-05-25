import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const review = body.reviewData || body;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN lipsește!" }, { status: 500 });
    }

    // Determinăm Chat ID-ul
    let CHAT_ID = review.telegram_chat_id || '890236835';

    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);

    const message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n⭐ Rating: ${stars}\n👤 Client: ${review.full_name || 'Anonim'}`;

    // Trimitem direct către Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    const result = await telegramResponse.json();

    if (!result.ok) {
      console.error("Eroare Telegram:", result);
      return NextResponse.json({ 
        success: false, 
        telegram_error: result.description 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Trimis direct către Telegram" });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}