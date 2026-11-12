import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import BlogDetailClient, { type BlogDetail } from '@/components/blog/BlogDetailClient';
import { absoluteUrl } from '@/lib/seo';
import { publicBlogTimeFilter } from '@/lib/blog-publishing';

type PublicBlog = BlogDetail & { featured_image: string | null };

export const dynamic = 'force-dynamic';

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Blog database configuration is missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .or(publicBlogTimeFilter())
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  const blog: PublicBlog = {
    id: data.id, title: data.title, content: data.content, excerpt: data.excerpt,
    author_name: data.author_name, author_id: data.author_id,
    editor_name: data.editor_name, content_type: data.content_type,
    published_at: data.published_at, created_at: data.created_at, updated_at: data.updated_at,
    featured_image: data.featured_image,
    cta_label: data.cta_label || 'Book now', cta_url: data.cta_url || '/book-session',
  };
  const articleUrl = absoluteUrl(`/blogs/${encodeURIComponent(slug)}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt || undefined,
    mainEntityOfPage: articleUrl,
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at || blog.created_at,
    author: { '@type': 'Organization', name: 'Mannosaar' },
    publisher: { '@type': 'Organization', name: 'Mannosaar', url: absoluteUrl('/') },
    image: blog.featured_image || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <BlogDetailClient slug={slug} initialBlog={blog} />
    </>
  );
}
