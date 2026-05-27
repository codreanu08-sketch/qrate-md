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
    let ownerId = null;
    let ownerEmail = null;

    // === OBȚINEM CHAT_ID DIN COMPANIE ===
    if (review.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id, owner_id, profiles(email)')
        .eq('id', review.company_id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
      }
      if (company?.owner_id) ownerId = company.owner_id;

      if (company?.profiles) {
        ownerEmail = Array.isArray(company.profiles) 
          ? company.profiles[0]?.email 
          : company.profiles.email;
      }
    }

    // Fallback doar dacă chiar nu avem chat_id
    if (!CHAT_ID) {
      console.warn("⚠️ telegram_chat_id lipsă pentru company:", review.company_id);
      CHAT_ID = '890236835';
    }

    // === VERIFICARE ABONAMENT ===
    if (ownerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_started_at')
        .eq('id', ownerId)
        .maybeSingle();

      if (profile) {
        const isPro = profile.subscription_tier === 'pro';
        const isTrial = profile.trial_started_at && 
          (Date.now() - new Date(profile.trial_started_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

        if (!isPro && !isTrial) {
          return NextResponse.json({ success: true, message: 'Subscription inactive' });
        }
      }
    }

    // === EMAIL + TELEGRAM (restul codului rămâne la fel) ===
    const rating = Number(review.rating) || 5;

    if (rating <= 3 && ownerEmail) {
      // ... codul de email Resend ...
    }

    const stars = '⭐️'.repeat(rating);
    let message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n==========================\n`;
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

    return NextResponse.json({ success: true, used_chat_id: CHAT_ID });

  } catch (error: any) {
    console.error("Eroare API send-review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}