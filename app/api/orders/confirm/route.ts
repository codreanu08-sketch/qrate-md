import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Preluăm datele prin formData() deoarece componenta trimite imagini/text combinate
    const formData = await request.formData();
    
    const plan = formData.get('plan') || 'START';
    const locations = formData.get('locations') || '1';
    const extraEmployees = formData.get('extraEmployees') || '0';
    const stickersOrdered = formData.get('stickersOrdered') === 'true';
    const stickersCount = formData.get('stickersCount') || '0';
    const totalAmount = formData.get('totalAmount') || '0';
    const notes = formData.get('notes') as string || 'Fără specificații.';
    const qrCodeImage = formData.get('qrCodeImage') as File | null;

    // Datele tale sigure pentru Telegram Bot
    const botToken = "8494478065:AAHAS1icJCUe5q-Te5KsWraC2-o4BcYbrbw"; 
    const chatId = "890236835";

    // 2. Formatăm mesajul principal folosind HTML (este mult mai stabil decât Markdown și nu crapă la caractere speciale)
    const message = `
<b>🔔 COMANDĂ NOUĂ QRATE.MD</b>
----------------------------------
📦 <b>Plan:</b> ${plan}
🏢 <b>Locații:</b> ${locations}
👥 <b>Angajați Extra:</b> ${extraEmployees}
🎯 <b>Stickere:</b> ${stickersOrdered ? `DA (${stickersCount} buc.)` : 'NU'}
----------------------------------
📝 <b>Specificații / Text:</b>
<i>${notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>
----------------------------------
💰 <b>TOTAL:</b> ${totalAmount} MDL
`;

    let telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    let telegramBody: FormData | string = '';
    let headers: HeadersInit = {};

    // 3. Logica de expediere: Dacă avem o imagine QR, trimitem prin 'sendPhoto', altfel prin 'sendMessage'
    if (qrCodeImage && qrCodeImage.size > 0) {
      telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      
      const telegramForm = new FormData();
      telegramForm.append('chat_id', chatId);
      telegramForm.append('caption', message);
      telegramForm.append('parse_mode', 'HTML'); // Schimbat în HTML
      
      // Convertim corect fișierul într-un Blob compatibil
      const arrayBuffer = await qrCodeImage.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: qrCodeImage.type });
      telegramForm.append('photo', blob, qrCodeImage.name);
      
      telegramBody = telegramForm;
      // Nu setăm Content-Type manual pentru FormData, lăsăm fetch-ul să se ocupe
    } else {
      // Dacă nu s-a încărcat o imagine, trimitem doar text simplu ca JSON
      headers = { 'Content-Type': 'application/json' };
      telegramBody = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Schimbat în HTML
      });
    }

    // 4. Executăm cererea externă către Telegram
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: headers,
      body: telegramBody,
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('❌ Eroare directă de la API Telegram:', data);
      return NextResponse.json(
        { error: 'Telegram API a respins mesajul.', details: data }, 
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('💥 Eroare critică pe server:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}