export const publicBlogTimeFilter = () => `published_at.is.null,published_at.lte.${new Date().toISOString()}`;

export function blogSlug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function blogInput(body: Record<string, unknown>) {
  const title = String(body.title || '').trim();
  const slug = blogSlug(String(body.slug || title));
  const content = String(body.content || '').trim();
  const status = String(body.status || 'published');
  const publishAt = body.published_at ? new Date(String(body.published_at)) : null;
  if (!title || !slug || !content) throw new Error('Title, slug and content are required');
  if (/<\s*\/?\s*(script|iframe|object|embed|svg|math|style|link|meta|form|input|button|textarea|template)\b/i.test(content) || /\bon[a-z]+\s*=/i.test(content) || /\b(srcdoc)\s*=/i.test(content) || /(?:javascript|vbscript|data)\s*:/i.test(content) || /(?:expression|url)\s*\(/i.test(content)) throw new Error('Content contains unsupported active HTML');
  if (title.length > 255 || slug.length > 255) throw new Error('Title or slug is too long');
  if (!['draft', 'published', 'scheduled'].includes(status)) throw new Error('Invalid publishing status');
  if (status === 'scheduled' && (!publishAt || Number.isNaN(publishAt.getTime()) || publishAt.getTime() <= Date.now())) throw new Error('Choose a future publishing time');
  const keywords = Array.isArray(body.secondary_keywords) ? body.secondary_keywords : String(body.secondary_keywords || '').split(',');
  return {
    title, slug, content,
    excerpt: String(body.excerpt || '').trim() || content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200),
    featured_image: String(body.featured_image || '').trim() || null,
    content_type: String(body.content_type || 'article').trim().slice(0, 80),
    editor_name: String(body.editor_name || '').trim().slice(0, 255) || null,
    primary_keyword: String(body.primary_keyword || '').trim().slice(0, 255) || null,
    secondary_keywords: keywords.map(value => String(value).trim()).filter(Boolean).slice(0, 30),
    is_published: status !== 'draft',
    published_at: status === 'draft' ? null : status === 'scheduled' ? publishAt!.toISOString() : publishAt && !Number.isNaN(publishAt.getTime()) && publishAt.getTime() <= Date.now() ? publishAt.toISOString() : new Date().toISOString(),
  };
}
