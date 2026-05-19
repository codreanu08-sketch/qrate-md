import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Zap, Mail } from 'lucide-react';

// Importăm componentele cu acolade pentru că ele folosesc export numit (export function)
import { PrivacyRo } from './privacy-ro';
import { PrivacyRu } from './privacy-ru';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const isRu = locale === 'ru';
  
  const title = isRu 
    ? 'Политика конфиденциальности и защита данных | QRate.md' 
    : 'Politica de Confidențialitate | Protecția Datelor | QRate.MD';
    
  const description = isRu
    ? 'Политика конфиденциальности платформы QRate.md. Узнайте, как мы защищаем ваши данные в соответствии с Законом № 133/2011 в Молдове.'
    : 'Politica de confidențialitate și securitate a datelor pentru platforma QRate.md. Informații despre stocarea în siguranță conform Legii nr. 133/2011 în RM.';

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://qrate.md/${locale}/privacy`,
      languages: {
        'ro': 'https://qrate.md/ro/privacy',
        'ru': 'https://qrate.md/ru/privacy',
      },
    },
  };
}

// EXPORT DEFAULT OBLIGATORIU - Fără asta Next.js dă eroarea "Failed to type check"
export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;

  if (locale !== 'ro' && locale !== 'ru') {
    notFound();
  }

  const isRu = locale === 'ru';

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 group">
            <div className="bg-emerald-600 p-2 rounded-xl">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter italic">
              QRate<span className="text-emerald-600">.MD</span>
            </span>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            {isRu ? 'Конфиденциальность v2026.1' : 'Confidențialitate v2026.1'}
          </span>
        </div>
      </nav>

      {/* CONTINUT DINAMIC */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        
        {isRu ? <PrivacyRu /> : <PrivacyRo />}

        {/* FOOTER */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {isRu ? 'Юридическая информация и поддержка' : 'Juridic & Suport'}
            </p>
            <div className="flex gap-4 text-slate-900 items-center">
              <Mail size={16}/> <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">hello@qrate.md</span>
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