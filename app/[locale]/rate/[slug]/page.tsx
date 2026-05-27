import { notFound } from 'next/navigation';
import Script from 'next/script';
import FeedbackForm from './FeedbackForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ employee?: string; location?: string }>; // ✅ adăugat location
}

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

export default async function PublicFeedbackPage({ params, searchParams }: PageProps) {
  const { slug, locale } = await params;
  const { employee: employeeId, location: locationId } = await searchParams; // ✅ citește și location

  if (locale !== 'ro' && locale !== 'ru') {
    notFound();
  }

  const companyName = slug.replace(/-/g, ' ').toUpperCase();

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
      <Script
        id="schema-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <FeedbackForm 
        slug={slug} 
        locale={locale as 'ro' | 'ru'} 
        employeeId={employeeId || undefined}
        locationId={locationId || undefined} // ✅ pasează location ca prop
      />
    </>
  );
}