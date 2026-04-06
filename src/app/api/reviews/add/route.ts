import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
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
        { error: 'Only admins can add reviews' },
        { status: 403 }
      );
    }

    const { rating, comment } = await request.json();

    // Validate input
    if (!rating || !comment) {
      return NextResponse.json(
        { error: 'Rating and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 }
      );
    }

    console.log('Adding review:', { rating, comment });

    // Insert review
    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert([
        {
          rating,
          comment: comment.trim(),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return NextResponse.json(
        { error: 'Failed to add review' },
        { status: 500 }
      );
    }

    console.log('✅ Review added:', newReview.id);

    return NextResponse.json({
      success: true,
      message: 'Review added successfully',
      review: newReview,
    });
  } catch (err) {
    console.error('Error in reviews POST endpoint:', err);
    return NextResponse.json(
      { error: 'Failed to add review' },
      { status: 500 }
    );
  }
}
