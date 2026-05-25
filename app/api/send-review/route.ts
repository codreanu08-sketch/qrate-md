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
        .select('telegram_chat_id, owner_id') // Extragem și owner_id pentru a verifica abonamentul
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

    // === 2. VERIFICARE ABONAMENT PRO / TRIAL ACTIVE ===
    if (ownerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, created_at')
        .eq('id', ownerId)
        .maybeSingle();

      if (profile) {
        const isPro = profile.subscription_tier === 'pro';
        const isTrial = (new Date().getTime() - new Date(profile.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000);

        // Dacă utilizatorul nu este PRO și i-a expirat și perioada de trial de 7 zile
        if (!isPro && !isTrial) {
          console.log(`[Telegram Blocked] Compania ${review.company_id} are abonamentul expirat. Notificarea nu a fost salvată în coadă.`);
          
          // Returnăm succes true ca aplicația client/formularul să nu crape, dar ignorăm trimiterea mesajului
          return NextResponse.json({ success: true, message: 'Notification skipped due to inactive subscription' });
        }
      }
    }

    // === 3. Construiește mesajul complet (Rulează doar dacă are acces) ===
    const rating = Number(review.rating) || 5;
    const stars = '⭐️'.repeat(rating);

    let message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n`;
    message += `==========================\n`;
    message += `⭐ <b>Rating:</b> ${stars} (${rating}/5)\n`;
    message += `👤 <b>Client:</b> ${review.full_name || 'Client Anonim'}\n`;
    
    if (review.phone) message += `📞 <b>Telefon:</b> ${review.phone}\n`;
    if (review.comment) message += `💬 <b>Comentariu:</b> "${review.comment}"\n`;
    message += `==========================`;

    // === 4. Salvează în coadă (Doar pentru clienții PRO sau în Trial) ===
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