import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
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
        { error: 'Only admins can delete reviews' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID required' },
        { status: 400 }
      );
    }

    console.log('Deleting review:', reviewId);

    // Soft delete - set is_active to false
    const { error: deleteError } = await supabase
      .from('reviews')
      .update({ is_active: false })
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    console.log('✅ Review deleted:', reviewId);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (err) {
    console.error('Error in reviews DELETE endpoint:', err);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
