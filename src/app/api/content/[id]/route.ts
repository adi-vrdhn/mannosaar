import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Content not found' }, { status: 404 });
    }

    // Update view count
    await supabase
      .from('content')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', id);

    return Response.json({ content: data });
  } catch (error) {
    console.error('❌ Error in GET /api/content/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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
      return Response.json({ error: 'Only admins can delete content' }, { status: 403 });
    }

    const { id } = params;

    // Soft delete
    const { error } = await supabase
      .from('content')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting content:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Content deleted:', id);
    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Error in DELETE /api/content/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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
      return Response.json({ error: 'Only admins can edit content' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { description, title } = body;

    if (!description && !title) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updateData: any = {};
    if (description) updateData.description = description;
    if (title) updateData.title = title;

    const { data, error } = await supabase
      .from('content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating content:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Content updated:', id);
    return Response.json({ content: data });
  } catch (error) {
    console.error('❌ Error in PATCH /api/content/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
