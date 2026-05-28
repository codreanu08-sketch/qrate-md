import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('company_id', companyId);

    const total = reviews?.length || 0;
    const avg = total > 0
      ? (reviews!.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / total).toFixed(1)
      : '0.0';

    return NextResponse.json({
      company_name: company.name,
      avg_rating: avg,
      total_reviews: total,
      verified: true,
      badge_url: `https://www.qrate.md/api/badge/${companyId}`,
      widget_url: `https://www.qrate.md/badge/${companyId}`,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600',
      }
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}