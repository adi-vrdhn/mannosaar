import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Fetching bundle pricing settings...');

    // Fetch from new pricing_config table with bundle support
    const { data: pricingData, error } = await supabase
      .from('pricing_config')
      .select('session_type, bundle_size, price')
      .order('session_type')
      .order('bundle_size');

    if (error) {
      console.error('Error fetching pricing:', error);
      // Return default pricing if table doesn't exist or is empty
      return NextResponse.json({
        success: true,
        pricing: {
          personal_1: 2500,
          personal_2: 4500,
          personal_3: 6000,
          couple_1: 3500,
          couple_2: 6500,
          couple_3: 9000,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Format pricing object from database
    const pricing: Record<string, number> = {
      personal_1: 2500,
      personal_2: 4500,
      personal_3: 6000,
      couple_1: 3500,
      couple_2: 6500,
      couple_3: 9000,
    };

    if (pricingData && pricingData.length > 0) {
      pricingData.forEach((item: any) => {
        const key = `${item.session_type}_${item.bundle_size}`;
        pricing[key] = parseFloat(item.price);
      });
    }

    console.log('Pricing settings fetched:', pricing);

    return NextResponse.json({
      success: true,
      pricing,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in pricing endpoint:', err);
    // Return default pricing on error
    return NextResponse.json({
      success: true,
      pricing: {
        personal_1: 2500,
        personal_2: 4500,
        personal_3: 6000,
        couple_1: 3500,
        couple_2: 6500,
        couple_3: 9000,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
