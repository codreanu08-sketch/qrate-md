// components/DashboardLiveWrapper.tsx
// Client component care detectează dacă suntem pe o pagină dashboard
// și afișează LiveActivityFeed doar acolo

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LiveActivityFeed from '@/components/LiveActivityFeed';

interface Props {
  locale: string;
}

export default function DashboardLiveWrapper({ locale }: Props) {
  const pathname = usePathname();
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Afișează doar pe paginile /dashboard
  const isDashboard = pathname?.includes('/dashboard');

  useEffect(() => {
    if (!isDashboard) return;

    const getCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (company?.id) setCompanyId(company.id);
    };

    getCompany();

    // Re-verific dacă sesiunea se schimbă
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session) => {
      if (!session) { setCompanyId(null); return; }
      getCompany();
    });

    return () => subscription.unsubscribe();
  }, [isDashboard]);

  if (!isDashboard || !companyId) return null;

  return <LiveActivityFeed companyId={companyId} locale={locale} />;
}