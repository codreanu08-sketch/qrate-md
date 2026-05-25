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

    // === 1. Găsește Chat ID-ul și proprietarul companiei ===
    let CHAT_ID = null;
    let ownerId = null;

    if (review.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id, owner_id')
        .eq('id', review.company_id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
      }
      if (company?.owner_id) {
        ownerId = company.owner_id;
      }
    }

    // Fallback (doar pentru test)
    if (!CHAT_ID) CHAT_ID = '890236835';

    // === 2. VERIFICARE ABONAMENT PRO / TRIAL ACTIVE (trial_started_at) ===
    if (ownerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_started_at') // Actualizat la trial_started_at
        .eq('id', ownerId)
        .maybeSingle();

      if (profile) {
        const isPro = profile.subscription_tier === 'pro';
        
        let isTrial = false;
        if (profile.trial_started_at) {
          const trialDate = new Date(profile.trial_started_at).getTime();
          const currentDate = new Date().getTime();
          if (!isNaN(trialDate)) {
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            isTrial = (currentDate - trialDate) < sevenDaysInMs;
          }
        }

        // Dacă utilizatorul nu este PRO și i-a expirat și perioada de trial
        if (!isPro && !isTrial) {
          console.log(`[Telegram Blocked] Compania ${review.company_id} are abonamentul expirat.`);
          return NextResponse.json({ success: true, message: 'Notification skipped due to inactive subscription' });
        }
      }
    }

    // === 3. Construiește mesajul complet ===
    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);

    let message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n`;
    message += `==========================\n`;
    message += `⭐ <b>Rating:</b> ${stars} (${rating}/5)\n`;
    message += `👤 <b>Client:</b> ${review.full_name || 'Client Anonim'}\n`;
    
    if (review.phone) message += `📞 <b>Telefon:</b> ${review.phone}\n`;
    if (review.comment) message += `💬 <b>Comentariu:</b> "${review.comment}"\n`;
    message += `==========================`;

    // === 4. Salvează în coadă ===
    await supabase.from('telegram_messages_queue').insert({
      chat_id: CHAT_ID,
      message_text: message,
      photo_url: review.photo_url || null,
      status: 'pending'
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}