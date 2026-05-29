import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Zap, Mail } from 'lucide-react';
import { RefundRo } from './refund-ro';
import { RefundRu } from './refund-ru';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const locale = params.locale;
  const isRu = locale === 'ru';
  return {
    title: isRu
      ? 'Политика возврата и аннулирования платежей | QRate.md'
      : 'Politica de Retur și Rambursare | QRate.md',
    description: isRu
      ? 'Официальные правила возврата QRate.md. QR RATING S.R.L., IDNO 1026023041245.'
      : 'Reguli oficiale de rambursare QRate.md. QR RATING S.R.L., IDNO 1026023041245.',
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://qrate.md/${locale}/refund`,
      languages: {
        'ro': 'https://qrate.md/ro/refund',
        'ru': 'https://qrate.md/ru/refund',
      },
    },
  };
}

export default async function RefundPage(props: PageProps) {
  const params = await props.params;
  const locale = params.locale;
  if (locale !== 'ro' && locale !== 'ru') notFound();
  const isRu = locale === 'ru';

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter italic">
              QRate<span className="text-blue-600">.MD</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/terms`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors hidden sm:block">
              {isRu ? 'Условия' : 'Termeni'}
            </Link>
            <Link href={`/${locale}/privacy`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors hidden sm:block">
              {isRu ? 'Конфиденциальность' : 'Confidențialitate'}
            </Link>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {isRu ? <RefundRu /> : <RefundRo />}

        {/* FOOTER */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {isRu ? 'Контакт' : 'Contact'}
            </p>
            <div className="flex items-center gap-3 text-slate-700">
              <Mail size={14} />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">hello@qrate.md</span>
            </div>
            <p className="text-xs text-slate-400">
              QR RATING S.R.L. · IDNO 1026023041245<br />
              {isRu ? 'мун. Орхей, ул. Сэлчиилор 75' : 'mun. Orhei, str. Sălciilor 75'}
            </p>
          </div>
          <div className="flex flex-col gap-2 self-center">
            <Link href={`/${locale}/terms`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
              {isRu ? '→ Условия использования' : '→ Termeni și Condiții'}
            </Link>
            <Link href={`/${locale}/privacy`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
              {isRu ? '→ Политика конфиденциальности' : '→ Politica de Confidențialitate'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}