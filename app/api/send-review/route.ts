import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Valori fallback de siguranță pentru a preveni eroarea la build pe Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build'; 

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviewData = body.reviewData || body;
    
    const CHAT_ID = reviewData.telegram_chat_id || reviewData.admin_chat_id || '890236835'; 

    const ratingValue = Number(reviewData.rating) || 5;
    const stars = '⭐️'.repeat(ratingValue);
    const hasPhoto = !!reviewData.photo_url;
    const companyName = (reviewData.company_slug || 'QRATE').toUpperCase();

    // Inițializăm variabilele pentru textul final
    let employeeName = null;
    let locationName = null;
    let targetLocationId = reviewData.location_id;

    // 1. REZOLVARE ANGAJAT: Dacă avem employee_id, îi aflăm numele și location_id-ul asociat
    if (reviewData.employee_id) {
      const { data: empData } = await supabase
        .from('employees')
        .select('name, location_id')
        .eq('id', reviewData.employee_id)
        .maybeSingle();

      if (empData) {
        employeeName = empData.name;
        // Dacă recenzia n-a trimis direct un location_id, îl împrumutăm pe cel de la angajat
        if (!targetLocationId && empData.location_id) {
          targetLocationId = empData.location_id;
        }
      } else if (typeof reviewData.employee_id === 'string' && reviewData.employee_id.length > 5 && !/^\d+$/.test(reviewData.employee_id)) {
        employeeName = reviewData.employee_id; // Fallback text direct
      }
    }

    // 2. REZOLVARE LOCAȚIE: Dacă avem un location_id (venit din formular sau de la angajat), îi aflăm numele real
    if (targetLocationId) {
      const { data: locData } = await supabase
        .from('locations')
        .select('name')
        .eq('id', targetLocationId)
        .maybeSingle();

      if (locData) {
        locationName = locData.name;
      } else if (typeof targetLocationId === 'string' && targetLocationId.length > 5 && !/^\d+$/.test(targetLocationId)) {
        locationName = targetLocationId; // Fallback text direct
      }
    }

    // 3. CONSTRUIRE REZUMAT TOP (Afacere, Locație, Angajat)
    let infoTarget = `🏢 <b>Afacere:</b> ${companyName}`;
    if (locationName) {
      infoTarget += `\n📍 <b>Locație:</b> ${locationName}`;
    }
    if (employeeName) {
      infoTarget += `\n👤 <b>Angajat:</b> ${employeeName}`;
    }

    // Mesajul formatat profesional în HTML fără cifre sau ID-uri ciudate
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

    // Salvăm recenzia formatată curat în coada din Supabase cu statusul 'pending'
    const { error: queueError } = await supabase
      .from('telegram_messages_queue')
      .insert({
        chat_id: CHAT_ID,
        message_text: messageContent,
        photo_url: reviewData.photo_url || null,
        status: 'pending'
      });

    if (queueError) throw queueError;

    return NextResponse.json({ success: true, message: "Review-ul a fost procesat și adăugat cu text curat în coadă." });
  } catch (error: any) {
    console.error("💥 Eroare în send-review API:", error);
    return NextResponse.json({ error: 'Eroare la server', details: error?.message }, { status: 500 });
  }
}