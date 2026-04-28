import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', session.user.email)
      .single();

    // Get blog by slug
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (blogError || !blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('blog_comments')
      .insert({
        blog_id: blog.id,
        user_id: userData?.id,
        user_name: userData?.name || session.user.email || 'Anonymous',
        user_email: userData?.email || session.user.email,
        content: content.trim(),
        is_approved: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get blog by slug
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (blogError || !blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Get all approved comments for this blog
    const { data: comments, error: commentsError } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('blog_id', blog.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (commentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
