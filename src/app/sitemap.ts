import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { publicBlogTimeFilter } from '@/lib/blog-publishing';
import { absoluteUrl, isSearchableBlog } from '@/lib/seo';

export const revalidate = 60;

const publicPages: MetadataRoute.Sitemap = [
  { url: absoluteUrl('/') },
  { url: absoluteUrl('/services') },
  { url: absoluteUrl('/about') },
  { url: absoluteUrl('/counselling/individual') },
  { url: absoluteUrl('/counselling/couples') },
  { url: absoluteUrl('/support/overthinking') },
  { url: absoluteUrl('/support/stress') },
  { url: absoluteUrl('/how-it-works') },
  { url: absoluteUrl('/faq') },
  // Listing pages change whenever CMS content is published. Omit lastmod
  // unless the database can provide a verifiably accurate value.
  { url: absoluteUrl('/blogs') },
  { url: absoluteUrl('/images') },
  { url: absoluteUrl('/videos') },
  { url: absoluteUrl('/social'), images: [absoluteUrl('/images/social/community-hero.png')] },
  { url: absoluteUrl('/privacy') },
  { url: absoluteUrl('/terms') },
  { url: absoluteUrl('/refund-policy') },
  { url: absoluteUrl('/online-therapy-consent') },
  { url: absoluteUrl('/emergency') },
  { url: absoluteUrl('/data-rights') },
  { url: absoluteUrl('/compliance') },
];

interface PublishedBlog {
  slug: string;
  title: string | null;
  updated_at: string | null;
  created_at: string | null;
}

function validLastModified(blog: PublishedBlog): string | undefined {
  const value = blog.updated_at || blog.created_at;
  return value && !Number.isNaN(Date.parse(value)) ? value.slice(0, 10) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return publicPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const blogPages: MetadataRoute.Sitemap = [];
    const seen = new Set<string>();
    const pageSize = 1000;
    const maxBlogs = 50000 - publicPages.length;

    for (let offset = 0; offset < maxBlogs; offset += pageSize) {
      const batchSize = Math.min(pageSize, maxBlogs - offset);
      const { data: blogs, error } = await supabase
        .from('blogs')
        .select('slug, title, updated_at, created_at')
        .eq('is_published', true)
        .or(publicBlogTimeFilter())
        .order('created_at', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (error || !blogs) {
        console.error('Unable to read published blogs for sitemap:', error);
        return publicPages;
      }

      for (const blog of blogs as PublishedBlog[]) {
        if (!blog.slug || !isSearchableBlog(blog.slug, blog.title) || seen.has(blog.slug)) continue;
        seen.add(blog.slug);
        blogPages.push({
          url: absoluteUrl(`/blogs/${encodeURIComponent(blog.slug)}`),
          lastModified: validLastModified(blog),
        });
      }

      if (blogs.length < batchSize) break;
    }

    return [...publicPages, ...blogPages];
  } catch (error) {
    console.error('Unable to build the blog sitemap:', error);
    return publicPages;
  }
}
