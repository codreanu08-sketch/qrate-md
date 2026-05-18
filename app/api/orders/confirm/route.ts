// app/api/orders/confirm/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Preluăm datele prin formData() trimise din configuratorul interfeței
    const formData = await request.formData();
    
    const plan = formData.get('plan') || 'START';
    // Preluat corect conform 'locationsCount' trimis din frontend
    const locations = formData.get('locationsCount') || '1'; 
    const totalAmount = formData.get('totalAmountPaidNow') || '0';
    const futureMonthlyAmount = formData.get('futureMonthlyAmount') || '0';
    const notes = (formData.get('notes') as string) || 'Fără specificații.';
    const qrCodeImage = formData.get('qrCodeImage') as File | null;

    // Extragere array-uri din frontend (dacă dorești să le folosești ulterior în baza de date)
    const activeLocationIdsStr = formData.get('activeLocationIds') || '[]';
    const activeEmployeeIdsStr = formData.get('activeEmployeeIds') || '[]';
    
    const activeLocationsCount = JSON.parse(activeLocationIdsStr as string).length;
    const activeEmployeesCount = JSON.parse(activeEmployeeIdsStr as string).length;

    // Datele sigure pentru Telegram Bot
    const botToken = "8494478065:AAHAS1icJCUe5q-Te5KsWraC2-o4BcYbrbw"; 
    const chatId = "890236835";

    // 2. Formatăm mesajul principal folosind HTML stabil
    const message = `
<b>🔔 COMANDĂ NOUĂ / MODIFICARE LICENȚĂ QRATE.MD</b>
----------------------------------
📦 <b>Plan ales:</b> ${plan}
🏢 <b>Locații Contractate:</b> ${locations} sloturi
📍 <b>Locații Active selectate:</b> ${activeLocationsCount}
👥 <b>Angajați Activi selectați:</b> ${activeEmployeesCount}
----------------------------------
📝 <b>Specificații / Note Client:</b>
<i>${notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>
----------------------------------
💰 <b>DE PLATĂ ACUM:</b> ${totalAmount} MDL
💳 <b>Tarif Viitor Abonament:</b> ${futureMonthlyAmount} MDL/lună
`;

    let telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    let telegramBody: FormData | string = '';
    let headers: HeadersInit = {};

    // 3. Logica de expediere: Dacă avem o imagine pentru codul QR personalizat
    if (qrCodeImage && qrCodeImage.size > 0) {
      telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      
      const telegramForm = new FormData();
      telegramForm.append('chat_id', chatId);
      telegramForm.append('caption', message);
      telegramForm.append('parse_mode', 'HTML');
      
      // Convertim fișierul într-un Blob compatibil cu API-ul Telegram
      const arrayBuffer = await qrCodeImage.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: qrCodeImage.type });
      telegramForm.append('photo', blob, qrCodeImage.name);
      
      telegramBody = telegramForm;
      // Nu setăm manual Content-Type pentru FormData, lăsăm browserul/serverul să-și pună boundary-ul perfect
    } else {
      // Dacă nu s-a atașat nicio imagine, trimitem payload JSON standard
      headers = { 'Content-Type': 'application/json' };
      telegramBody = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });
    }

    // 4. Executăm cererea externă către API-ul Telegram
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

    // Returnăm succes și poți adăuga opțional o proprietate `payUrl` dacă vrei să-l trimiți spre MAIB
    return NextResponse.json({ success: true, payUrl: null });

  } catch (error: any) {
    console.error('💥 Eroare critică pe server:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message || String(error) }, 
      { status: 500 }
    );
  }
}