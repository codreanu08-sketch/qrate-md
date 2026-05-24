import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviewData = body.reviewData || body;

    let CHAT_ID = null;

    // === 1. Căutăm în companies folosind company_id ===
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

    // === 2. Dacă nu avem company_id, încercăm prin location_id ===
    if (!CHAT_ID && reviewData.location_id) {
      const { data: location } = await supabase
        .from('locations')
        .select('company_id')
        .eq('id', reviewData.location_id)
        .maybeSingle();

      if (location?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('telegram_chat_id')
          .eq('id', location.company_id)
          .maybeSingle();

        if (company?.telegram_chat_id) {
          CHAT_ID = company.telegram_chat_id;
        }
      }
    }

    // === 3. Fallback (doar pentru testare) ===
    if (!CHAT_ID) {
      CHAT_ID = '890236835';
      console.log("⚠️ Folosim Chat ID de fallback");
    }

    // === Construim mesajul ===
    const ratingValue = Number(reviewData.rating) || 5;
    const stars = '⭐️'.repeat(ratingValue);
    const hasPhoto = !!reviewData.photo_url;
    const companyName = (reviewData.company_slug || 'QRATE').toUpperCase();

    let employeeName = null;
    let locationName = null;

    if (reviewData.employee_id) {
      const { data: emp } = await supabase
        .from('employees')
        .select('name')
        .eq('id', reviewData.employee_id)
        .maybeSingle();
      if (emp) employeeName = emp.name;
    }

    if (reviewData.location_id) {
      const { data: loc } = await supabase
        .from('locations')
        .select('name')
        .eq('id', reviewData.location_id)
        .maybeSingle();
      if (loc) locationName = loc.name;
    }

    let infoTarget = `🏢 <b>Afacere:</b> ${companyName}`;
    if (locationName) infoTarget += `\n📍 <b>Locație:</b> ${locationName}`;
    if (employeeName) infoTarget += `\n👤 <b>Angajat:</b> ${employeeName}`;

    const messageContent = `
⚠️ <b>REVIEW NOU - QRate.md</b>
==========================
${infoTarget}
⭐ <b>Rating:</b> ${stars} (${ratingValue}/5)
👤 <b>Client:</b> ${reviewData.full_name || 'Client Anonim'}
${reviewData.phone ? `📞 <b>Tel:</b> ${reviewData.phone}` : ''}
💬 <b>Comentariu:</b> "${reviewData.comment || 'Fără comentariu'}"
==========================
${hasPhoto ? '🖼️ <i>Imagine atașată mai jos</i>' : ''}
    `.trim();

    // Salvăm în coada Telegram
    await supabase.from('telegram_messages_queue').insert({
      chat_id: CHAT_ID,
      message_text: messageContent,
      photo_url: reviewData.photo_url || null,
      status: 'pending'
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Eroare API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}