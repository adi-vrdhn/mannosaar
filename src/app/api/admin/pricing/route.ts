import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Fetching pricing settings...');

    const { data: pricing, error } = await supabase
      .from('pricing_settings')
      .select('*')
      .eq('is_active', true)
      .order('session_type');

    if (error) {
      console.error('Error fetching pricing:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing settings' },
        { status: 500 }
      );
    }

    // Convert to object format: { personal: 1200, couple: 1500 }
    const priceMap: { [key: string]: number } = {};
    pricing?.forEach((item) => {
      priceMap[item.session_type] = parseFloat(item.price);
    });

    console.log('Pricing settings fetched:', priceMap);

    return NextResponse.json({
      success: true,
      prices: priceMap,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in pricing endpoint:', err);
    return NextResponse.json(
      { error: 'Failed to fetch pricing settings' },
      { status: 500 }
    );
  }
}
