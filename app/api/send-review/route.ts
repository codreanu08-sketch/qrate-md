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

/** Merge company + location IDs, deduplicate, return as comma-separated string */
function mergeIds(companyIds: string | null, locationIds: string | null): string {
  const parse = (raw: string | null) =>
    (raw || '').split(',').map(id => id.trim()).filter(Boolean);

  const merged = Array.from(new Set([...parse(companyIds), ...parse(locationIds)]));
  return merged.join(',');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const review = body.reviewData || body;

    let companyTelegramId: string | null = null;
    let locationTelegramIds: string | null = null;
    let companyName = 'Compania';

    // 1. Fetch company telegram ID + name
    if (review.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id, name')
        .eq('id', review.company_id)
        .maybeSingle();

      if (company) {
        companyTelegramId = company.telegram_chat_id || null;
        companyName = company.name || 'Compania';
      }
    }

    // 2. Fetch location telegram IDs (if review has location_id)
    if (review.location_id) {
      const { data: location } = await supabase
        .from('locations')
        .select('telegram_chat_ids')
        .eq('id', review.location_id)
        .maybeSingle();

      if (location?.telegram_chat_ids) {
        locationTelegramIds = location.telegram_chat_ids;
      }
    }

    // 3. Merged ID string — used for everything below
    const CHAT_ID = mergeIds(companyTelegramId, locationTelegramIds);

    const rating = Number(review.rating) || 5;
    const stars = '*'.repeat(rating);
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // 4. Mesaj principal — prin queue (comportament existent păstrat)
    let message = `<b>REVIEW NOU - QRate.md</b>\n==========================\n`;
    message += `<b>Companie:</b> ${esc(companyName)}\n`;
    message += `<b>Rating:</b> ${stars} (${rating}/5)\n`;
    message += `<b>Client:</b> ${esc(review.full_name || 'Client Anonim')}\n`;
    if (review.phone) message += `<b>Telefon:</b> ${esc(String(review.phone))}\n`;
    if (review.comment) message += `<b>Comentariu:</b> "${esc(String(review.comment))}"\n`;
    message += `==========================`;

    await supabase.from('telegram_messages_queue').insert({
      chat_id: CHAT_ID || null,
      message_text: message,
      photo_url: review.photo_url || null,
      status: 'pending'
    });

    // 5. CRISIS MODE — 3+ recenzii negative în 30 minute
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

    // 6. RECOVERY WIN — același telefon: ≤2★ în trecut → ≥4★ acum
    if (rating >= 4 && review.phone && review.company_id && CHAT_ID) {
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
          if (review.id) {
            await supabase
              .from('reviews')
              .update({
                is_recovery_win: true,
                recovery_from_review_id: oldReview.id
              })
              .eq('id', review.id);
          }

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

    return NextResponse.json({ success: true, chat_id: CHAT_ID });

  } catch (error: any) {
    console.error("Eroare send-review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}