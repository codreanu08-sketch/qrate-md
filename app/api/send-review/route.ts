import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviewData = body.reviewData || body;

    // === 1. GĂSEȘTE CHAT ID-UL CORECT AL ADMINISTRATORULUI ===
    let CHAT_ID = reviewData.telegram_chat_id || reviewData.admin_chat_id;

    // Dacă nu avem Chat ID în recenzie, îl luăm din tabelul companies
    if (!CHAT_ID && reviewData.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id')
        .eq('id', reviewData.company_id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
      }
    }

    // Fallback de siguranță (doar pentru testare)
    if (!CHAT_ID) {
      CHAT_ID = '890236835'; // ← Poți șterge asta în producție
    }

    // === 2. RESTUL CODULUI (PĂSTRAT APROAPE IDENTIC) ===
    const ratingValue = Number(reviewData.rating) || 5;
    const stars = '⭐️'.repeat(ratingValue);
    const hasPhoto = !!reviewData.photo_url;
    const companyName = (reviewData.company_slug || 'QRATE').toUpperCase();

    let employeeName = null;
    let locationName = null;
    let targetLocationId = reviewData.location_id;

    // Rezolvăm numele angajatului
    if (reviewData.employee_id) {
      const { data: empData } = await supabase
        .from('employees')
        .select('name, location_id')
        .eq('id', reviewData.employee_id)
        .maybeSingle();

      if (empData) {
        employeeName = empData.name;
        if (!targetLocationId && empData.location_id) {
          targetLocationId = empData.location_id;
        }
      } else if (typeof reviewData.employee_id === 'string' && reviewData.employee_id.length > 5) {
        employeeName = reviewData.employee_id;
      }
    }

    // Rezolvăm numele locației
    if (targetLocationId) {
      const { data: locData } = await supabase
        .from('locations')
        .select('name')
        .eq('id', targetLocationId)
        .maybeSingle();

      if (locData) locationName = locData.name;
    }

    // Construim mesajul
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
    const { error: queueError } = await supabase
      .from('telegram_messages_queue')
      .insert({
        chat_id: CHAT_ID,
        message_text: messageContent,
        photo_url: reviewData.photo_url || null,
        status: 'pending'
      });

    if (queueError) throw queueError;

    return NextResponse.json({ 
      success: true, 
      message: "Review trimis corect către administratorul companiei." 
    });

  } catch (error: any) {
    console.error("💥 Eroare în send-review API:", error);
    return NextResponse.json({ 
      error: 'Eroare la server', 
      details: error?.message 
    }, { status: 500 });
  }
}