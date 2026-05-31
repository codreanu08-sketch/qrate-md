// app/api/admin/notify-expiry/route.ts
// Trimite notificări Telegram companiilor care expiră în X zile

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const { days = 3 } = await req.json().catch(() => ({}));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, telegram_chat_id, subscription_expires_at, trial_ends_at, is_subscribed')
      .not('telegram_chat_id', 'is', null);
    if (error) throw error;

    const now = new Date();
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    let sent = 0; const notified: string[] = [];

    for (const company of companies || []) {
      const endDate = company.is_subscribed && company.subscription_expires_at
        ? new Date(company.subscription_expires_at)
        : company.trial_ends_at ? new Date(company.trial_ends_at) : null;

      if (!endDate) continue;

      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
      if (daysLeft < 0 || daysLeft > days) continue;

      const isSubscription = company.is_subscribed && company.subscription_expires_at;
      const msg = isSubscription
        ? `⚠️ <b>QRate.md — Abonamentul tău expiră în ${daysLeft} ${daysLeft === 1 ? 'zi' : 'zile'}!</b>\n\nPentru a continua să primești recenzii și notificări, reînnoiește abonamentul.\n\n📞 Contactează-ne: 068 688 484\n✉️ suport@qrate.md`
        : `🕐 <b>QRate.md — Perioada de trial expiră în ${daysLeft} ${daysLeft === 1 ? 'zi' : 'zile'}!</b>\n\nSperăm că ți-a plăcut experiența QRate!\n\nActivează un plan pentru a continua să colectezi recenzii.\n\n📞 068 688 484\n🌐 www.qrate.md`;

      const chatIds = (company.telegram_chat_id || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      for (const chatId of chatIds) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
        });
        sent++;
      }
      notified.push(`${company.name} (${daysLeft}z)`);
    }

    return NextResponse.json({ sent, notified });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}