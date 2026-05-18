import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Forțăm Next.js să trateze această rută exclusiv ca dinamică la build
export const dynamic = 'force-dynamic';

// 2. Inițializare securizată cu fallback pentru a preveni eroarea "supabaseKey is required" la npm run build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Funcție ajutătoare pentru a crea o mică pauză (rate-limiting)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  // Sistem de securitate (un Token Secret în Header / Query)
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('secret');
  
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificare de siguranță la runtime pentru token-ul Telegram
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not configured' }, { status: 500 });
  }

  try {
    // 1. Extragem mesajele blocate în starea 'pending' sau 'failed'
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
            parse_mode: 'Markdown', // Permite formatarea cu *bold* sau _italic_
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
        await delay(150);

      } catch (msgError: any) {
        console.error(`❌ Eroare la trimiterea mesajului ID ${item.id}:`, msgError);
        
        // Dacă a eșuat, incrementăm încercările și punem status 'failed'
        await supabase
          .from('telegram_messages_queue')
          .update({ 
            status: 'failed', 
            attempts: (item.attempts || 0) + 1,
            error_message: msgError?.message || String(msgError)
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
    console.error('💥 Global Worker Error:', globalError);
    return NextResponse.json(
      { error: 'Internal Server Error', message: globalError?.message || String(globalError) }, 
      { status: 500 }
    );
  }
}