import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticatedAdmin } from '@/lib/admin-authorization';
import { isSameOrigin } from '@/lib/compliance';
import { isServiceId } from '@/lib/services';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!(await authenticatedAdmin())) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const service = body?.service;
  const enabled = body?.enabled;
  const offerPrice = Number(body?.offerPrice);
  if (!isServiceId(service) || typeof enabled !== 'boolean' || !Number.isFinite(offerPrice) || offerPrice <= 0 || offerPrice > 100000) {
    return NextResponse.json({ error: 'Enter a valid service and offer price.' }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: regular, error: readError } = await supabase
    .from('pricing_config')
    .select('price')
    .eq('session_type', service)
    .eq('bundle_size', 1)
    .single();
  if (readError || !regular) return NextResponse.json({ error: 'Regular price is unavailable.' }, { status: 500 });
  if (enabled && offerPrice >= Number(regular.price)) {
    return NextResponse.json({ error: 'The offer price must be below the regular single-session price.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pricing_config')
    .update({ intro_offer_enabled: enabled, intro_offer_price: offerPrice, updated_at: new Date().toISOString() })
    .eq('session_type', service)
    .eq('bundle_size', 1)
    .select('session_type, intro_offer_enabled, intro_offer_price')
    .single();
  if (error || !data) return NextResponse.json({ error: 'Could not save the offer. Check that the offer migration is installed.' }, { status: 500 });
  return NextResponse.json({ success: true, offer: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
