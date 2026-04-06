import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const featured = searchParams.get('featured') === 'true';

    let query = supabase
      .from('content')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (featured) {
      query = query.eq('featured', true);
    }

    const from = (page - 1) * limit;
    const { data, count, error } = await query.range(from, from + limit - 1);

    if (error) {
      console.error('❌ Error fetching content:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      content: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (data?.length || 0) === limit,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/content:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user?.email || !session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || user?.role !== 'admin') {
      return Response.json({ error: 'Only admins can upload content' }, { status: 403 });
    }

    const body = await req.json();
    const {
      type,
      title,
      description,
      excerpt,
      articleContent,
      mediaUrl,
      thumbnailUrl,
      mediaDuration,
      imageAltText,
      imageCaption,
      featured = false,
    } = body;

    // Validation
    if (!type || !['article', 'video', 'image'].includes(type)) {
      return Response.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    if (type === 'article' && !articleContent) {
      return Response.json({ error: 'Article content is required' }, { status: 400 });
    }

    if ((type === 'video' || type === 'image') && !mediaUrl) {
      return Response.json({ error: 'Media URL is required' }, { status: 400 });
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Use service role for insert to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert content
    const { data, error } = await supabaseAdmin
      .from('content')
      .insert({
        type,
        title,
        description,
        excerpt: type === 'image' && imageCaption ? imageCaption : excerpt,
        article_content: type === 'article' ? articleContent : null,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        media_duration: mediaDuration,
        image_alt_text: imageAltText,
        author_id: session.user.id,
        slug,
        featured,
        published: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating content:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Content created successfully:', data.id);
    return Response.json({ content: data }, { status: 201 });
  } catch (error) {
    console.error('❌ Error in POST /api/content:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
