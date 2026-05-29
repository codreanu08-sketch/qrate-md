'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useTrial() {
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchTrial() {
      // Nu reseta loading la fiecare navigare — evită flickering
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, trial_ends_at, created_at')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const pro = profile.subscription_tier === 'pro';
          setIsPro(pro);

          if (!pro) {
            let endDate: Date;

            if (profile.trial_ends_at) {
              endDate = new Date(profile.trial_ends_at);
            } else if (profile.created_at) {
              endDate = new Date(new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
            } else {
              endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            }

            const remaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24)));
            setTrialDays(remaining);
          } else {
            setTrialDays(null);
          }
        }
      } catch (error) {
        console.error('Error fetching trial:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrial();
  }, [pathname]); // ← re-fetch la fiecare schimbare de pagină

  return { trialDays, isPro, loading };
}