import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendTelegramMessage(chatId: string, message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN || !chatId) return;

  const chatIds = chatId.split(',').map(id => id.trim()).filter(Boolean);
  
  for (const id of chatIds) {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: id,
          text: message,
          parse_mode: 'HTML'
        })
      });
    } catch (err) {
      console.error(`Telegram send error for ${id}:`, err);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const review = body.reviewData || body;

    let CHAT_ID = null;
    let companyName = 'Compania';

    if (review.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id, name')
        .eq('id', review.company_id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
        companyName = company.name || 'Compania';
      }
    }

    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);

    // ✅ 1. Mesaj normal recenzie negativă (≤3 stele)
    let message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n==========================\n`;
    message += `🏢 <b>Companie:</b> ${companyName}\n`;
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

    if (CHAT_ID) {
      await sendTelegramMessage(CHAT_ID, message);
    }

    // ✅ 2. CRISIS MODE — 3+ recenzii negative în 30 minute
    if (rating <= 2 && review.company_id && CHAT_ID) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: recentNegative } = await supabase
        .from('reviews')
        .select('id')
        .eq('company_id', review.company_id)
        .lte('rating', 2)
        .gte('created_at', thirtyMinAgo);

      if (recentNegative && recentNegative.length >= 3) {
        const crisisMessage = 
          `🚨🚨🚨 <b>ALERTĂ CRIZĂ - ${companyName}</b> 🚨🚨🚨\n\n` +
          `⚠️ <b>${recentNegative.length} recenzii negative</b> în ultimele 30 minute!\n\n` +
          `📋 <b>Răspuns recomandat:</b>\n` +
          `"Bună ziua! Am observat că ați avut o experiență neplăcută la noi. ` +
          `Vă rugăm să ne contactați direct pentru a rezolva situația. ` +
          `Ne cerem scuze și vom face tot posibilul să remediem problema!"\n\n` +
          `🔗 Verificați dashboard-ul pentru detalii complete.`;

        await sendTelegramMessage(CHAT_ID, crisisMessage);
      }
    }

    // ✅ 3. RECOVERY WIN — același telefon: ≤2★ în trecut → ≥4★ acum
    if (rating >= 4 && review.phone && review.company_id) {
      const { data: oldNegative } = await supabase
        .from('reviews')
        .select('id, rating, created_at')
        .eq('company_id', review.company_id)
        .eq('phone', review.phone)
        .lte('rating', 2)
        .order('created_at', { ascending: false })
        .limit(1);

      if (oldNegative && oldNegative.length > 0) {
        const oldReview = oldNegative[0];
        const daysDiff = Math.floor(
          (Date.now() - new Date(oldReview.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff >= 7) {
          // Marchează în DB
          if (review.id) {
            await supabase
              .from('reviews')
              .update({
                is_recovery_win: true,
                recovery_from_review_id: oldReview.id
              })
              .eq('id', review.id);
          }

          // Notificare Telegram
          if (CHAT_ID) {
            const recoveryMessage =
              `🏆 <b>RECOVERY WIN - ${companyName}</b> 🏆\n\n` +
              `✨ Un client nemulțumit s-a întors cu o recenzie pozitivă!\n\n` +
              `👤 <b>Client:</b> ${review.full_name || 'Client Anonim'}\n` +
              (review.phone ? `📞 <b>Telefon:</b> ${review.phone}\n` : '') +
              `📉 <b>Rating vechi:</b> ${'⭐'.repeat(oldReview.rating)} (${oldReview.rating}/5)\n` +
              `📈 <b>Rating nou:</b> ${'⭐'.repeat(rating)} (${rating}/5)\n` +
              `📅 <b>Interval:</b> ${daysDiff} zile\n\n` +
              `💪 Felicitări! Ați transformat un client nemulțumit într-un client fidel!`;

            await sendTelegramMessage(CHAT_ID, recoveryMessage);
          }
        }
      }
    }

    return NextResponse.json({ success: true, chat_id: CHAT_ID });

  } catch (error: any) {
    console.error("Eroare send-review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}