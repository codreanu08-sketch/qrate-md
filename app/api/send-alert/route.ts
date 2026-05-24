import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Suportă ambele variante de trimitere: direct payload-ul sau învelit în reviewData
    const reviewData = body.reviewData || body;
    
    const BOT_TOKEN = '8169972917:AAGgxHB7vi26JTjCFQx2s0ulxPbbAJO2GCA';
    const CHAT_ID = '890236835'; 

    const ratingValue = Number(reviewData.rating) || 5;
    const stars = '⭐️'.repeat(ratingValue);
    const hasPhoto = !!reviewData.photo_url;
    const company = (reviewData.company_slug || 'QRATE').toUpperCase();

    // Mesajul principal formatat curat în HTML (elimină orice erori de parsare)
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

    const telegramMethod = hasPhoto ? 'sendPhoto' : 'sendMessage';
    
    // Trecem pe HTML ca să nu mai crape de la linii și cratime
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("💥 Eroare Server:", error);
    return NextResponse.json({ error: 'Eroare la server', details: error?.message }, { status: 500 });
  }
}