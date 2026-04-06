import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single();

    if (error || !blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Increment views count
    await supabase
      .from('blogs')
      .update({ views_count: (blog.views_count || 0) + 1 })
      .eq('id', blog.id);

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { title, content, excerpt } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .select('author_id')
      .eq('slug', params.slug)
      .single();

    if (blogError || !blog) {
      console.error('Blog not found error:', blogError);
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if user is the author or admin
    // ONLY check the database role - this is the source of truth
    const isAdmin = session.user?.role === 'admin';
    const isAuthor = blog.author_id === session.user.id;
    
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only edit your own blogs' },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from('blogs')
      .update({
        title: title.trim(),
        content,
        excerpt: excerpt?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', params.slug);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update blog: ' + updateError.message },
        { status: 500 }
      );
    }

    // Fetch the updated blog to return it
    const { data: updatedBlog, error: fetchError } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (fetchError || !updatedBlog) {
      console.error('Fetch after update error:', fetchError);
      return NextResponse.json(
        { error: 'Blog updated but failed to retrieve it' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blog: updatedBlog });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    console.log('🗑️ Delete - Session:', { userId: session?.user?.id, userRole: session?.user?.role, email: session?.user?.email });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role for checking blog existence
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: blog, error: blogError } = await supabaseAdmin
      .from('blogs')
      .select('author_id, title')
      .eq('slug', params.slug)
      .single();

    console.log('🗑️ Delete - Blog found:', { blog, error: blogError });

    if (blogError || !blog) {
      console.error('Blog not found error:', blogError);
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    // Check if user is the author or admin
    // ONLY check the database role - this is the source of truth
    const isAdmin = session.user?.role === 'admin';
    const isAuthor = blog.author_id === session.user.id;
    
    console.log('🗑️ Delete - Auth check:', { isAdmin, isAuthor, blogAuthorId: blog.author_id, userId: session.user.id });
    
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own blogs' },
        { status: 403 }
      );
    }

    // Delete using service role to bypass RLS
    const { error: deleteError } = await supabaseAdmin
      .from('blogs')
      .delete()
      .eq('slug', params.slug);

    console.log('🗑️ Delete - Result:', { deleteError, slug: params.slug });

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete blog: ' + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
