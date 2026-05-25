import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error("❌ TELEGRAM_BOT_TOKEN lipsește din variabilele de mediu!");
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN lipsește" }, { status: 500 });
    }

    // 1. Luăm mesajele pending
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('telegram_messages_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20); // Limităm la 20 ca să nu blocăm

    if (fetchError) throw fetchError;

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({ success: true, message: "Nu sunt mesaje de trimis." });
    }

    console.log(`🤖 Procesăm ${pendingMessages.length} mesaje...`);
    let trimiseCuSucces = 0;

    for (const msg of pendingMessages) {
      try {
        const hasPhoto = !!msg.photo_url;
        const method = hasPhoto ? 'sendPhoto' : 'sendMessage';

        const body: any = {
          chat_id: msg.chat_id,
          parse_mode: 'HTML',
        };

        if (hasPhoto) {
          body.photo = msg.photo_url;
          body.caption = msg.message_text;
        } else {
          body.text = msg.message_text;
        }

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const result = await response.json();

        if (result.ok) {
          // Succes → marcăm ca 'sent'
          await supabase
            .from('telegram_messages_queue')
            .update({ status: 'sent' })
            .eq('id', msg.id);
          
          trimiseCuSucces++;
        } else {
          console.error(`❌ Telegram a respins ID ${msg.id}:`, result.description);
          
          // Marcăm ca failed
          await supabase
            .from('telegram_messages_queue')
            .update({ status: 'failed' })
            .eq('id', msg.id);
        }

        // === IMPORTANT: Delay de 600ms între mesaje (evită blocarea) ===
        await new Promise(resolve => setTimeout(resolve, 600));

      } catch (err) {
        console.error(`💥 Eroare la mesajul ID ${msg.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesare finalizată. Trimise: ${trimiseCuSucces}/${pendingMessages.length}`
    });

  } catch (error: any) {
    console.error("💥 Eroare critică:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}