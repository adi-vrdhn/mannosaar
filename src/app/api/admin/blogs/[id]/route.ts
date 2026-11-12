import { NextRequest, NextResponse } from 'next/server';
import { authenticatedAdmin } from '@/lib/admin-authorization';
import { blogInput } from '@/lib/blog-publishing';
import { isSameOrigin } from '@/lib/compliance';
import { db } from '@/lib/whatsapp/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticatedAdmin();
  if (!session) return new Response('Forbidden', { status: 403 });
  const { id } = await params;
  const { data, error } = await db().from('blogs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load blog' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  return NextResponse.json({ blog: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticatedAdmin();
  if (!session) return new Response('Forbidden', { status: 403 });
  if (!isSameOrigin(request)) return new Response('Forbidden', { status: 403 });
  const { id } = await params;
  let input;
  let body;
  try { body = await request.json(); input = blogInput(body); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid article' }, { status: 400 }); }
  const existing = await db().from('blogs').select('is_published,published_at').eq('id', id).maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (!existing.data) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  if (body.status === 'published' && existing.data.is_published && (!existing.data.published_at || new Date(existing.data.published_at).getTime() <= Date.now())) {
    input.published_at = existing.data.published_at;
  }
  const { data, error } = await db().from('blogs').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Slug is already in use' : /cta_label|cta_url/i.test(error.message) ? 'Blog button setup is incomplete. Run scripts/migrations/20261112_blog_cta.sql in Supabase SQL Editor.' : /column|schema cache/i.test(error.message) ? 'Blog database update required: run scripts/migrations/20261105_blog_publishing.sql in Supabase SQL Editor' : error.message }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json({ blog: data });
}
