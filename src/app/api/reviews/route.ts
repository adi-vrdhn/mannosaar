import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Fetching reviews...');

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    console.log(`Found ${reviews?.length || 0} reviews`);

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      count: reviews?.length || 0,
    });
  } catch (err) {
    console.error('Error in reviews endpoint:', err);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
