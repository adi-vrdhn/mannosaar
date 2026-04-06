import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify admin role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update pricing' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { personal, couple } = body;

    // Validate prices
    if (
      personal === undefined ||
      couple === undefined ||
      personal < 0 ||
      couple < 0
    ) {
      return NextResponse.json(
        { error: 'Invalid prices. Prices must be non-negative numbers.' },
        { status: 400 }
      );
    }

    console.log('Updating pricing settings:', { personal, couple });

    // Update personal session price
    const { error: personalError } = await supabase
      .from('pricing_settings')
      .update({ price: personal })
      .eq('session_type', 'personal');

    if (personalError) {
      console.error('Error updating personal pricing:', personalError);
      return NextResponse.json(
        { error: 'Failed to update personal session price' },
        { status: 500 }
      );
    }

    // Update couple session price
    const { error: coupleError } = await supabase
      .from('pricing_settings')
      .update({ price: couple })
      .eq('session_type', 'couple');

    if (coupleError) {
      console.error('Error updating couple pricing:', coupleError);
      return NextResponse.json(
        { error: 'Failed to update couple session price' },
        { status: 500 }
      );
    }

    console.log('✅ Pricing settings updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Pricing updated successfully',
      prices: { personal, couple },
    });
  } catch (err) {
    console.error('Error in pricing update endpoint:', err);
    return NextResponse.json(
      { error: 'Failed to update pricing settings' },
      { status: 500 }
    );
  }
}
