import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Inițializăm un client rapid de supabase pentru sitemap (folosește variabilele tale de mediu)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://qrate.md';

  // 1. Pagini Statice
  const staticPages = [
    '',
    '/ro',
    '/ru',
    '/ro/pricing',
    '/ru/pricing',
    '/ro/about',
    '/ru/about',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Pagini Dinamice (Profilurile Publice ale Companiilor pentru indexare)
  try {
    const { data: companies } = await supabase.from('companies').select('id, updated_at');
    
    const companyPages = (companies || []).map((company) => ({
      url: `${baseUrl}/p/${company.id}`,
      lastModified: company.updated_at ? new Date(company.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...companyPages];
  } catch (error) {
    console.error('Eroare la generarea sitemap-ului dinamic:', error);
    return staticPages;
  }
}