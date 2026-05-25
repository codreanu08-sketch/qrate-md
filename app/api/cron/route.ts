import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
      console.error("❌ TELEGRAM_BOT_TOKEN lipsește!");
      return NextResponse.json({ error: "Token lipsește" }, { status: 500 });
    }

    // Luăm maxim 15 mesaje pending
    const { data: pendingMessages, error } = await supabase
      .from('telegram_messages_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(15);

    if (error) throw error;

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({ success: true, message: "Nimic de trimis" });
    }

    console.log(`🤖 Procesăm ${pendingMessages.length} mesaje...`);
    let trimise = 0;

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

        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const result = await res.json();

        if (result.ok) {
          await supabase
            .from('telegram_messages_queue')
            .update({ status: 'sent' })
            .eq('id', msg.id);
          trimise++;
        } else {
          console.error(`❌ Telegram respins ID ${msg.id}:`, result.description);
          await supabase
            .from('telegram_messages_queue')
            .update({ status: 'failed' })
            .eq('id', msg.id);
        }

        // Delay important pentru a nu bloca botul
        await new Promise(r => setTimeout(r, 700));

      } catch (err) {
        console.error(`Eroare la mesajul ${msg.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Trimise: ${trimise}/${pendingMessages.length}`
    });

  } catch (error: any) {
    console.error("Eroare critică:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}