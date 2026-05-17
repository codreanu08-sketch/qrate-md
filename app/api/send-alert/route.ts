import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { reviewData } = await request.json();
    
    const BOT_TOKEN = '8169972917:AAGgxHB7vi26JTjCFQx2s0ulxPbbAJO2GCA';
    const CHAT_ID = '890236835'; 

    const stars = '⭐️'.repeat(reviewData.rating);
    const hasPhoto = !!reviewData.photo_url;

    // Mesajul principal
    const messageContent = `
⚠️ *REVIEW NOU - QRate.md*
--------------------------
🏢 *Afacere:* ${reviewData.company_slug.toUpperCase()}
⭐ *Rating:* ${stars} (${reviewData.rating}/5)
👤 *Client:* ${reviewData.full_name}
${reviewData.phone ? `📞 *Tel:* ${reviewData.phone}` : ''}
💬 *Comentariu:* "${reviewData.comment || 'Fără comentariu'}"
--------------------------
${hasPhoto ? '🖼️ _Imagine atașată mai jos_' : ''}
    `;

    // Alegem metoda și corpul cererii în funcție de prezența pozei
    const telegramMethod = hasPhoto ? 'sendPhoto' : 'sendMessage';
    
    const telegramBody: any = {
      chat_id: CHAT_ID,
      parse_mode: 'Markdown',
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
      console.error("Eroare Telegram API:", telegramRes);
      return NextResponse.json({ error: telegramRes.description }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Eroare Server:", error);
    return NextResponse.json({ error: 'Eroare la server' }, { status: 500 });
  }
}