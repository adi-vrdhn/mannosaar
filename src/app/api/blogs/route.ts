import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { blogInput, publicBlogTimeFilter } from '@/lib/blog-publishing';
import { isSameOrigin } from '@/lib/compliance';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return new Response('Forbidden', { status: 403 });
    const body = await request.json();
    let input;
    try { input = blogInput(body); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid article' }, { status: 400 }); }

    // Get session from NextAuth
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin or therapist
    const { data: userData } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', session.user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create blogs' },
        { status: 403 }
      );
    }

    // Generate slug from title
    const slug = body.slug ? input.slug : `${input.slug}-${nanoid(6)}`;

    // Insert blog
    const { data: blog, error: insertError } = await supabase
      .from('blogs')
      .insert({
        ...input,
        slug,
        author_id: session.user.id,
        author_name: userData?.name || session.user.name || session.user.email,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: insertError.code === '23505' ? 'Slug is already in use' : /column|schema cache/i.test(insertError.message) ? 'Blog database update required: run scripts/migrations/20261105_blog_publishing.sql in Supabase SQL Editor' : 'Failed to create blog' },
        { status: insertError.code === '23505' ? 409 : 500 }
      );
    }

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data: blogs, error } = await supabaseClient
      .from('blogs')
      .select('id,title,slug,excerpt,author_name,created_at,featured_image')
      .eq('is_published', true)
      .or(publicBlogTimeFilter())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch blogs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
