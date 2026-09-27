import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/lib/seo';

type BlogMetadata = {
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  updated_at: string | null;
  created_at: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { title: 'Resource', robots: { index: false, follow: false } };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from('blogs')
    .select('title, excerpt, featured_image, updated_at, created_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  const blog = data as BlogMetadata | null;
  if (!blog) {
    return { title: 'Resource not found', robots: { index: false, follow: false } };
  }

  const canonical = `/blogs/${encodeURIComponent(slug)}`;
  const description = blog.excerpt || `Read ${blog.title} from Mannosaar resources.`;
  const image = blog.featured_image || '/images/social/community-hero.png';

  return {
    title: blog.title,
    description,
    alternates: { canonical },
    authors: [{ name: 'Neetu Rathore', url: `${SITE_URL}/about` }],
    openGraph: {
      type: 'article',
      title: blog.title,
      description,
      url: canonical,
      publishedTime: blog.created_at || undefined,
      modifiedTime: blog.updated_at || blog.created_at || undefined,
      authors: [`${SITE_URL}/about`],
      images: [{ url: image, alt: blog.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description,
      images: [image],
    },
  };
}

export default function BlogSlugLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
