import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticatedAdmin } from '@/lib/admin-authorization';
import { isSameOrigin } from '@/lib/compliance';
import { DEFAULT_BUNDLE_PRICING, type BundlePricing } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    if (!isSameOrigin(request) || !(await authenticatedAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { pricing } = body;

    const keys = Object.keys(DEFAULT_BUNDLE_PRICING) as (keyof BundlePricing)[];
    if (!pricing || typeof pricing !== 'object' || keys.some(key => !Number.isFinite(pricing[key]) || pricing[key] <= 0 || pricing[key] > 100000)) {
      return NextResponse.json(
        { error: 'Invalid pricing data' },
        { status: 400 }
      );
    }

    console.log('Updating bundle pricing:', pricing);

    // Upsert prices without clearing the first-session offer settings.
    const insertData = [
      { session_type: 'personal', bundle_size: 1, price: pricing.personal_1 },
      { session_type: 'personal', bundle_size: 2, price: pricing.personal_2 },
      { session_type: 'personal', bundle_size: 3, price: pricing.personal_3 },
      { session_type: 'couple', bundle_size: 1, price: pricing.couple_1 },
      { session_type: 'couple', bundle_size: 2, price: pricing.couple_2 },
      { session_type: 'couple', bundle_size: 3, price: pricing.couple_3 },
    ];

    const { error: insertError } = await supabase
      .from('pricing_config')
      .upsert(insertData, { onConflict: 'session_type,bundle_size' });

    if (insertError) {
      console.error('Error inserting pricing:', insertError);
      return NextResponse.json(
        { error: 'Failed to update pricing' },
        { status: 500 }
      );
    }

    console.log('Bundle pricing updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Bundle pricing updated successfully',
      pricing,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in update bundle pricing endpoint:', err);
    return NextResponse.json(
      { error: 'Failed to update pricing' },
      { status: 500 }
    );
  }
}
