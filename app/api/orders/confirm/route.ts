import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const plan = formData.get('plan') || 'START';
    const locations = formData.get('locationsCount') || '1'; 
    const totalAmount = formData.get('totalAmountPaidNow') || '0';
    const futureMonthlyAmount = formData.get('futureMonthlyAmount') || '0';
    const notes = (formData.get('notes') as string) || 'Fără specificații.';
    const qrCodeImage = formData.get('qrCodeImage') as File | null;

    const activeLocationIdsStr = formData.get('activeLocationIds') || '[]';
    const activeEmployeeIdsStr = formData.get('activeEmployeeIds') || '[]';
    
    const activeLocationsCount = JSON.parse(activeLocationIdsStr as string).length;
    const activeEmployeesCount = JSON.parse(activeEmployeeIdsStr as string).length;

    // === OBȚINEM USER-UL LOGAT ȘI CHAT_ID-UL DIN COMPANIE ===
    const { data: { user } } = await supabase.auth.getUser();
    
    let CHAT_ID = "890236835"; // fallback temporar

    if (user) {
      const { data: company } = await supabase
        .from('companies')
        .select('telegram_chat_id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (company?.telegram_chat_id) {
        CHAT_ID = company.telegram_chat_id;
      }
    }

    // === MESAJ TELEGRAM ===
    const message = `
<b>🔔 COMANDĂ NOUĂ / MODIFICARE LICENȚĂ QRATE.MD</b>
----------------------------------
📦 <b>Plan ales:</b> ${plan}
🏢 <b>Locații Contractate:</b> ${locations} sloturi
📍 <b>Locații Active:</b> ${activeLocationsCount}
👥 <b>Angajați Activi:</b> ${activeEmployeesCount}
----------------------------------
📝 <b>Note:</b> ${notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
----------------------------------
💰 <b>DE PLATĂ ACUM:</b> ${totalAmount} MDL
💳 <b>Tarif Lunar:</b> ${futureMonthlyAmount} MDL
`;

    let telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN || "8494478065:AAHAS1icJCUe5q-Te5KsWraC2-o4BcYbrbw"}/sendMessage`;
    let telegramBody: any = '';
    let headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (qrCodeImage && qrCodeImage.size > 0) {
      telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN || "8494478065:AAHAS1icJCUe5q-Te5KsWraC2-o4BcYbrbw"}/sendPhoto`;
      
      const telegramForm = new FormData();
      telegramForm.append('chat_id', CHAT_ID);
      telegramForm.append('caption', message);
      telegramForm.append('parse_mode', 'HTML');
      
      const arrayBuffer = await qrCodeImage.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: qrCodeImage.type });
      telegramForm.append('photo', blob, qrCodeImage.name);
      
      telegramBody = telegramForm;
      delete headers['Content-Type']; // FormData gestionează singur boundary-ul
    } else {
      telegramBody = JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      });
    }

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: headers,
      body: telegramBody,
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Telegram Error:', data);
      return NextResponse.json({ error: 'Telegram API error', details: data }, { status: 502 });
    }

    return NextResponse.json({ success: true, chat_id_used: CHAT_ID });

  } catch (error: any) {
    console.error('Eroare confirm order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}