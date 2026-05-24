import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Dezactivăm cache-ul Next.js pentru ca acest API să verifice baza de date LIVE la fiecare accesare
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const BOT_TOKEN = '8169972917:AAGgxHB7vi26JTjCFQx2s0ulxPbbAJO2GCA';

    // 1. Extragem mesajele care sunt în starea 'pending'
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('telegram_messages_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({ success: true, message: "Nu sunt mesaje de trimis în coadă." });
    }

    console.log(`🤖 Am găsit ${pendingMessages.length} mesaje în coadă. Începe trimiterea...`);
    let trimiseCuSucces = 0;

    // 2. Trimitem fiecare mesaj în parte către Telegram
    for (const msg of pendingMessages) {
      try {
        const hasPhoto = !!msg.photo_url;
        const telegramMethod = hasPhoto ? 'sendPhoto' : 'sendMessage';

        const telegramBody: any = {
          chat_id: msg.chat_id,
          parse_mode: 'HTML',
        };

        if (hasPhoto) {
          telegramBody.photo = msg.photo_url;
          telegramBody.caption = msg.message_text;
        } else {
          telegramBody.text = msg.message_text;
        }

        const telResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${telegramMethod}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramBody),
        });

        const resData = await telResponse.json();

        if (resData.ok) {
          // 3. Dacă a ajuns pe Telegram, îi schimbăm statusul în 'sent' ca să nu-l mai trimitem a doua oară
          await supabase
            .from('telegram_messages_queue')
            .update({ status: 'sent' })
            .eq('id', msg.id);
          
          trimiseCuSucces++;
        } else {
          console.error(`❌ Telegram a respins mesajul ID ${msg.id}:`, resData.description);
          
          // Opțional: dacă chat_id e greșit sau blocat, marcăm cu 'failed' ca să nu blocheze coada la infinit
          await supabase
            .from('telegram_messages_queue')
            .update({ status: 'failed' })
            .eq('id', msg.id);
        }
      } catch (msgErr) {
        console.error(`💥 Eroare la procesarea mesajului ID ${msg.id}:`, msgErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Procesare finalizată. Mesaje trimise: ${trimiseCuSucces}/${pendingMessages.length}` 
    });

  } catch (error: any) {
    console.error("💥 Eroare critică în Cron Worker:", error);
    return NextResponse.json({ error: 'Eroare la server', details: error?.message }, { status: 500 });
  }
}