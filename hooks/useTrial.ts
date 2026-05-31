// hooks/useTrial.ts
// ✅ Fix: verifică is_admin, subscription_tier, trial_ends_at corect

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useTrial() {
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('subscription_tier, trial_ends_at, created_at, is_admin, subscription_status, is_subscribed')
          .eq('id', user.id)
          .single();

        if (!data) return;

        // ✅ Admin = mereu PRO
        const admin = data.is_admin === true;
        setIsAdmin(admin);

        // ✅ Pro dacă: tier=pro SAU is_subscribed=true SAU admin
        const pro = admin
          || data.subscription_tier === 'pro'
          || data.is_subscribed === true
          || data.subscription_status === 'ACTIVE';
        setIsPro(pro);

        if (pro) {
          setTrialDays(null); // nu arată trial countdown dacă e pro
          return;
        }

        // ✅ Calculează zilele rămase din trial
        const trialEnd = data.trial_ends_at
          ? new Date(data.trial_ends_at)
          : new Date(new Date(data.created_at || Date.now()).getTime() + 7 * 86400000);

        const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / 86400000);
        setTrialDays(daysLeft > 0 ? daysLeft : 0);
      } catch (e) {
        console.error('useTrial error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { trialDays, isPro, isAdmin, loading };
}