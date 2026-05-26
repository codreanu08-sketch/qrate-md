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

    // === 1. Găsește CHAT_IDS, proprietarul și EMAIL-UL ===
    let CHAT_IDS: string[] = [];
    let ownerId = null;
    let ownerEmail = null;

    if (review.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select(`
          telegram_chat_id, 
          owner_id,
          profiles (email)
        `)
        .eq('id', review.company_id)
        .maybeSingle();

      // Extragem ID-urile (dacă sunt mai multe, le separăm prin virgulă)
      if (company?.telegram_chat_id) {
        CHAT_IDS = company.telegram_chat_id.split(',').map((id: string) => id.trim());
      }
      
      if (company?.owner_id) ownerId = company.owner_id;
      
      if (company?.profiles && Array.isArray(company.profiles)) {
          ownerEmail = company.profiles[0]?.email;
      } else if (company?.profiles) {
          ownerEmail = (company.profiles as any).email;
      }
    }

    // Fallback dacă nu există niciun ID setat pentru companie
    if (CHAT_IDS.length === 0) CHAT_IDS = ['890236835'];

    // === 2. VERIFICARE ABONAMENT ===
    if (ownerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_started_at')
        .eq('id', ownerId)
        .maybeSingle();

      if (profile) {
        const isPro = profile.subscription_tier === 'pro';
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const isTrial = profile.trial_started_at && 
                        (Date.now() - new Date(profile.trial_started_at).getTime()) < sevenDaysInMs;

        if (!isPro && !isTrial) {
          return NextResponse.json({ success: true, message: 'Subscription inactive' });
        }
      }
    }

    // === 3. NOTIFICARE EMAIL (Resend) - Doar pentru rating slab <= 3 ===
    const rating = Number(review.rating) || 5;
    if (rating <= 3 && ownerEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "QRate Alerte <alerta@qrate.md>",
            to: [ownerEmail],
            subject: `⚠️ Alertă Recenzie Negativă: ${rating} stele`,
            html: `<h1>Notificare QRate</h1>
                   <p>Ați primit o recenzie de <strong>${rating} stele</strong>.</p>
                   <p>Comentariu: <em>"${review.comment || 'Niciun comentariu'}"</em></p>
                   <br><a href="https://qrate.md/dashboard">Vezi detalii în Dashboard</a>`
          }),
        });
      } catch (err) {
        console.error("Eroare Resend:", err);
      }
    }

    // === 4. NOTIFICARE TELEGRAM (Coada - iterăm prin lista de CHAT_IDS) ===
    const stars = '⭐️'.repeat(rating);
    let message = `⚠️ <b>REVIEW NOU - QRate.md</b>\n`;
    message += `==========================\n`;
    message += `⭐ <b>Rating:</b> ${stars} (${rating}/5)\n`;
    message += `👤 <b>Client:</b> ${review.full_name || 'Client Anonim'}\n`;
    if (review.phone) message += `📞 <b>Telefon:</b> ${review.phone}\n`;
    if (review.comment) message += `💬 <b>Comentariu:</b> "${review.comment}"\n`;
    message += `==========================`;

    // Inserăm în coadă pentru fiecare ID găsit
    const queuePromises = CHAT_IDS.map(chatId => 
      supabase.from('telegram_messages_queue').insert({
        chat_id: chatId,
        message_text: message,
        photo_url: review.photo_url || null,
        status: 'pending'
      })
    );

    await Promise.all(queuePromises);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Eroare API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}