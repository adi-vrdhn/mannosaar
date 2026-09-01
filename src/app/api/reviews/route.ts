import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Reviews endpoint misconfigured: missing public Supabase environment variables');
      return NextResponse.json(
        { error: 'Reviews are temporarily unavailable' },
        { status: 500 }
      );
    }

    const supabase = await createClient();

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
