import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Zap, Mail } from 'lucide-react';
import { RefundRo } from './refund-ro';
import { RefundRu } from './refund-ru';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const isRu = locale === 'ru';
  
  const title = isRu 
    ? 'Политика возврата и аннулирования платежей | QRate.md' 
    : 'Politica de Retur și Rambursare | Dreptul de Retragere | QRate.MD';
    
  const description = isRu
    ? 'Официальные правила возврата средств для цифровых услуг QRate.md в соответствии с Законом № 105/2003 о защите прав потребителей в Молдове.'
    : 'Reguli oficiale de rambursare și retur pentru serviciile digitale QRate.md, în conformitate cu Legea nr. 105/2003 privind protecția consumatorilor în RM.';

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://qrate.md/${locale}/refund`,
      languages: {
        'ro': 'https://qrate.md/ro/refund',
        'ru': 'https://qrate.md/ru/refund',
      },
    },
  };
}

export default async function RefundPage({ params }: Props) {
  const { locale } = await params;

  if (locale !== 'ro' && locale !== 'ru') {
    notFound();
  }

  const isRu = locale === 'ru';

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* HEADER LEGAL */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter italic">
              QRate<span className="text-blue-600">.MD</span>
            </span>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            {isRu ? 'v2026.1 (Соответствие Maib и Закону 105/2003)' : 'v2026.1 (Conformitate Maib & Legea 105/2003)'}
          </span>
        </div>
      </nav>

      {/* CONTINUT INDEXABIL */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        
        {isRu ? <RefundRu /> : <RefundRo />}

        {/* FOOTER DETALII */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {isRu ? 'Департамент Финансов' : 'Departament Financiar'}
            </p>
            <div className="flex gap-4 text-slate-900 items-center">
              <Mail size={16}/> <span className="text-xs font-bold uppercase tracking-widest text-blue-600">hello@qrate.md</span>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em] self-center">
            QRate Moldova • QR SOLUTIONS GROUP
          </p>
        </div>
      </main>
    </div>
  );
}