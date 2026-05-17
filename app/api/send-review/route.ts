import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inițializăm Supabase cu Service Role Key (pentru a putea face UPDATE securizat pe tabelă)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Recomandat Service Role pentru operațiuni de tip Worker/Cron
);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Funcție ajutătoare pentru a crea o mică pauză (rate-limiting)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  // Opțional: Poți adăuga un sistem de securitate (un Token Secret în Header) 
  // ca să fii sigur că doar sistemul tău de Cron poate apela acest API.
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('secret');
  
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Extragem mesajele blocate în starea 'pending' sau 'failed' (pentru reîncercare)
    // Limităm la un lot rezonabil (ex: 50 de mesaje per rulare) ca să nu depășim timpul maxim de execuție al funcției serverless
    const { data: queueItems, error: fetchError } = await supabase
      .from('telegram_messages_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ message: 'Coada este goală. Nu sunt mesaje de trimis.' });
    }

    let succesCount = 0;
    let errorCount = 0;

    // 2. Procesăm fiecare mesaj în parte din lot
    for (const item of queueItems) {
      try {
        // Trimitem cererea către API-ul oficial de Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: item.chat_id,
            text: item.message_text,
            parse_mode: 'Markdown', // Permite formatarea cu *bold* sau _italic_ trimisă din formular
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Telegram API Error: ${errData.description || response.statusText}`);
        }

        // Dacă a fost trimis cu succes, actualizăm statusul în bază
        await supabase
          .from('telegram_messages_queue')
          .update({ status: 'sent', processed_at: new Date().toISOString() })
          .eq('id', item.id);

        succesCount++;

        // 3. Introducem o pauză inteligentă de 150ms între mesaje
        // Asta garantează că dacă avem 200 de mesaje, trimitem cam 6-7 pe secundă, fiind mult sub limita critică Telegram (30/sec)
        await delay(150);

      } catch (msgError: any) {
        console.error(`Eroare la trimiterea mesajului ID ${item.id}:`, msgError);
        
        // Dacă a eșuat, incrementăm încercările și punem status 'failed'
        await supabase
          .from('telegram_messages_queue')
          .update({ 
            status: 'failed', 
            attempts: (item.attempts || 0) + 1,
            error_message: msgError.message 
          })
          .eq('id', item.id);

        errorCount++;
      }
    }

    return NextResponse.json({
      message: 'Procesare finalizată.',
      statistici: { total: queueItems.length, trimise: succesCount, esuate: errorCount }
    });

  } catch (globalError: any) {
    console.error('Global Worker Error:', globalError);
    return NextResponse.json({ error: globalError.message }, { status: 500 });
  }
}