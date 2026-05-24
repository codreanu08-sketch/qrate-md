import { notFound } from 'next/navigation';
import Script from 'next/script';
import FeedbackForm from './FeedbackForm';

// Forțăm Next.js să citească searchParams (parametrul ?employee=...) live la fiecare scanare de QR
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ employee?: string }>;
}

// 1. GENERATOR DINAMIC DE METADATE SEO (Executat pe Server)
export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const isRo = locale === 'ro';

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
  // Așteptăm rezolvarea promisiunilor Next.js
  const { slug, locale } = await params;
  const { employee: employeeId } = await searchParams;

  // Validare limbă acceptată
  if (locale !== 'ro' && locale !== 'ru') {
    notFound();
  }

  const companyName = slug.replace(/-/g, ' ').toUpperCase();

  // Date structurate Google LocalBusiness Schema
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
      {/* Injectare JSON-LD pentru Google */}
      <Script
        id="schema-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Pasăm datele curate către componenta Client */}
      <FeedbackForm 
        slug={slug} 
        locale={locale as 'ro' | 'ru'} 
        employeeId={employeeId || undefined} 
      />
    </>
  );
}