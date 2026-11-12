import { NextRequest, NextResponse } from 'next/server';
import { authenticatedAdmin } from '@/lib/admin-authorization';
import { db } from '@/lib/whatsapp/server';

export async function GET(request: NextRequest) {
  const session = await authenticatedAdmin();
  if (!session) return new Response('Forbidden', { status: 403 });
  const params = request.nextUrl.searchParams;
  const rawPage = params.get('page') || '1';
  const page = /^\d+$/.test(rawPage) ? Math.max(1, Math.min(1000, Number(rawPage))) : 1;
  const status = params.get('status') || 'all';
  if (!['all', 'draft', 'scheduled', 'published'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  const now = new Date().toISOString();
  let query = db().from('blogs')
    .select('*', { count: 'exact' });
  if (status === 'draft') query = query.eq('is_published', false);
  if (status === 'scheduled') query = query.eq('is_published', true).gt('published_at', now);
  if (status === 'published') query = query.eq('is_published', true).or(`published_at.is.null,published_at.lte.${now}`);
  const { data, error, count, status: queryStatus } = await query
    .order('created_at', { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  if (queryStatus === 416) return NextResponse.json({ blogs: [], total: count || 0, page });
  if (error) return NextResponse.json({ error: /column|schema cache/i.test(error.message) ? 'Blog database update required: run scripts/migrations/20261105_blog_publishing.sql in Supabase SQL Editor' : error.message }, { status: 500 });
  return NextResponse.json({ blogs: data, total: count || 0, page });
}
