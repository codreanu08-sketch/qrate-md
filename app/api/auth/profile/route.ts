import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ hasAccess: false });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_tier, trial_ends_at, created_at, is_admin, is_subscribed, subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ hasAccess: false });

  const isPro =
    profile.is_admin === true ||
    profile.subscription_tier === 'pro' ||
    profile.is_subscribed === true ||
    profile.subscription_status === 'ACTIVE';

  if (isPro) return NextResponse.json({ hasAccess: true });

  const endDate = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : profile.created_at
      ? new Date(new Date(profile.created_at).getTime() + 7 * 86400000)
      : new Date(0);

  return NextResponse.json({ hasAccess: endDate.getTime() > Date.now() });
}
