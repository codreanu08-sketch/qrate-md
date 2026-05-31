// hooks/useTrial.ts — versiune simplificată, bypass complet pentru admin
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useTrial() {
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(true); // ← default TRUE până se încarcă
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: p } = await supabase
          .from('profiles')
          .select('*')  // selectăm tot, fără să ghicim coloane
          .eq('id', user.id)
          .single();

        if (!p) { setLoading(false); return; }

        // ✅ ORICE condiție satisfăcută = PRO
        const pro =
          p.is_admin === true ||
          p.subscription_tier === 'pro' ||
          p.is_subscribed === true ||
          p.subscription_status === 'ACTIVE' ||
          (p.trial_ends_at && new Date(p.trial_ends_at) > new Date());

        setIsAdmin(p.is_admin === true);
        setIsPro(!!pro);

        if (pro) {
          setTrialDays(null);
        } else {
          const end = p.trial_ends_at
            ? new Date(p.trial_ends_at)
            : new Date(new Date(p.created_at || Date.now()).getTime() + 7 * 86400000);
          const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
          setTrialDays(days > 0 ? days : 0);
        }
      } catch (e) {
        console.error('useTrial:', e);
        setIsPro(true); // fail-safe: dacă eroare, nu bloca accesul
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { trialDays, isPro, isAdmin, loading };
}