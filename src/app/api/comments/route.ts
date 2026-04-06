import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);

// POST: Create a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, contentType, name, email, comment } = body;

    if (!contentId || !contentType || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert comment into database (pending approval by default)
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          content_id: contentId,
          content_type: contentType,
          author_name: name || 'Anonymous',
          author_email: email,
          comment_text: comment,
          is_approved: false, // Admin must approve
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Comment insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Comment submitted. Awaiting approval.',
      comment: data[0],
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// GET: Fetch approved comments for content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Missing contentId or contentType' },
        { status: 400 }
      );
    }

    // Fetch only approved comments
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Comment fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: data || [] });
  } catch (error) {
    console.error('Comment fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// DELETE: Admin only - delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Missing commentId' },
        { status: 400 }
      );
    }

    // TODO: Add admin authentication check

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Comment delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Comment delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

// PATCH: Admin only - approve a comment
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, isApproved } = body;

    if (!commentId || isApproved === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Add admin authentication check

    const { data, error } = await supabase
      .from('comments')
      .update({ is_approved: isApproved })
      .eq('id', commentId)
      .select();

    if (error) {
      console.error('Comment update error:', error);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Comment updated',
      comment: data[0],
    });
  } catch (error) {
    console.error('Comment update error:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}
