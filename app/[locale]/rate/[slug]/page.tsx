import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import FeedbackForm from './FeedbackForm';

// Inițializare client server Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ employeeId?: string }>; // <--- Pasul 1: Captăm parametrii opționali din URL (?employeeId=...)
}

// 1. GENERATOR DINAMIC DE METADATE SEO (Executat pe Server)
export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const isRo = locale === 'ro';

  // Extragem numele curat al companiei din slug sau baza ta de date
  const companyName = slug.replace(/-/g, ' ').toUpperCase();

  const title = isRo 
    ? `Lasă o recenzie pentru ${companyName} | QRate` 
    : `Оставить отзыв для ${companyName} | QRate`;
  
  const description = isRo
    ? `Scanează codul QR și oferă feedback direct pentru ${companyName}.`
    : `Оцените качество обслуживания в ${companyName} через QR-код прямо сейчас.`;

  return {
    title,
    description,
    openGraph: {
      title: `${companyName} - Feedback Live`,
      description,
      type: 'website',
    },
  };
}

// 2. PAGINA SERVER COMPONENT
export default async function PublicFeedbackPage({ params, searchParams }: PageProps) {
  // Pasul 2: Așteptăm (await) rezolvarea ambelor promisiuni din Next.js
  const { slug, locale } = await params;
  const { employeeId } = await searchParams;

  // Validare limbă acceptată
  if (locale !== 'ro' && locale !== 'ru') {
    notFound();
  }

  const companyName = slug.replace(/-/g, ' ').toUpperCase();

  // Date structurate Google LocalBusiness Schema pentru steluțe în căutări
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": companyName,
    "description": `Pagina de recenzii și feedback QR securizat pentru ${companyName}`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "24"
    }
  };

  return (
    <>
      {/* Injectare JSON-LD Direct în document pentru SEO perfect */}
      <Script
        id="schema-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Pasul 3: Pasăm employeeId primit din URL direct în componenta client */}
      <FeedbackForm 
        slug={slug} 
        locale={locale as 'ro' | 'ru'} 
        employeeId={employeeId} 
      />
    </>
  );
}