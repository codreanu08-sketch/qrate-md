// app/api/admin/broadcast/route.ts
// Trimite mesaj Telegram la toate companiile conectate

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const { message, onlyActive } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Mesaj gol' }, { status: 400 });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // Verifică că userul e admin
    // (în producție adaugă verificare auth)

    let query = supabase.from('companies').select('id, name, telegram_chat_id').not('telegram_chat_id', 'is', null);
    if (onlyActive) query = query.eq('is_active', true);
    const { data: companies, error } = await query;
    if (error) throw error;

    const token = process.env.TELEGRAM_BOT_TOKEN!;
    let sent = 0, failed = 0;
    const errors: string[] = [];

    for (const company of companies || []) {
      const chatIds = (company.telegram_chat_id || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      for (const chatId of chatIds) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML',
            }),
          });
          const data = await res.json();
          if (data.ok) sent++;
          else { failed++; errors.push(`${company.name} (${chatId}): ${data.description}`); }
        } catch (e: any) {
          failed++;
          errors.push(`${company.name}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ sent, failed, total: (companies?.length || 0), errors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}