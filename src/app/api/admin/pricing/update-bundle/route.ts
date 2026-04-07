import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.id || session?.user?.role !== 'admin') {
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

    if (!pricing || typeof pricing !== 'object') {
      return NextResponse.json(
        { error: 'Invalid pricing data' },
        { status: 400 }
      );
    }

    console.log('Updating bundle pricing:', pricing);

    // Delete old pricing config if it exists
    await supabase.from('pricing_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new pricing config
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
      .insert(insertData);

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
