// app/[[...slug]]/page.tsx
import { redirect } from 'next/navigation';

export default async function RootCatchAllPage({ 
  params 
}: { 
  params: Promise<{ slug?: string[] }> 
}) {
  const resolvedParams = await params;
  
  // Dacă utilizatorul a intrat pe site-ul gol (qrate.md)
  if (!resolvedParams.slug || resolvedParams.slug.length === 0) {
    redirect('/ro');
  }

  // Dacă a intrat pe o rută greșită, îl trimitem tot pe română ca fallback
  const currentPath = resolvedParams.slug.join('/');
  if (!currentPath.startsWith('ro') && !currentPath.startsWith('ru')) {
    redirect(`/ro/${currentPath}`);
  }

  return null;
}