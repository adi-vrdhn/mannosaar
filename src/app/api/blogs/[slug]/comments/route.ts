import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { allowRequest } from '@/lib/compliance-server';
import { isSameOrigin } from '@/lib/compliance';
import { publicBlogTimeFilter } from '@/lib/blog-publishing';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    if (!isSameOrigin(request)) return new Response('Forbidden', { status: 403 });
    if (!(await allowRequest('blog-comment', session.user.id, 5, 3600))) return new Response('Too many comments', { status: 429 });
    const { content } = await request.json();

    if (typeof content !== 'string' || content.trim().length < 2 || content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
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
      .eq('is_published', true)
      .or(publicBlogTimeFilter())
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
      .select('id,user_name,content,created_at')
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
      .eq('is_published', true)
      .or(publicBlogTimeFilter())
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
      .select('id,user_name,content,created_at')
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
