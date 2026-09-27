import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { absoluteUrl, SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

const contentUpdated = new Date('2026-09-26T00:00:00.000Z');
const legalUpdated = new Date('2026-09-25T00:00:00.000Z');

const publicPages: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: contentUpdated },
  { url: absoluteUrl('/services'), lastModified: contentUpdated },
  { url: absoluteUrl('/about'), lastModified: contentUpdated },
  { url: absoluteUrl('/counselling/individual'), lastModified: contentUpdated },
  { url: absoluteUrl('/counselling/couples'), lastModified: contentUpdated },
  { url: absoluteUrl('/support/overthinking'), lastModified: contentUpdated },
  { url: absoluteUrl('/support/stress'), lastModified: contentUpdated },
  { url: absoluteUrl('/how-it-works'), lastModified: contentUpdated },
  { url: absoluteUrl('/faq'), lastModified: contentUpdated },
  // Listing pages change whenever CMS content is published. Omit lastmod
  // unless the database can provide a verifiably accurate value.
  { url: absoluteUrl('/blogs') },
  { url: absoluteUrl('/images') },
  { url: absoluteUrl('/videos') },
  { url: absoluteUrl('/social'), lastModified: contentUpdated, images: [absoluteUrl('/images/social/community-hero.png')] },
  { url: absoluteUrl('/privacy'), lastModified: legalUpdated },
  { url: absoluteUrl('/terms'), lastModified: legalUpdated },
  { url: absoluteUrl('/refund-policy'), lastModified: legalUpdated },
  { url: absoluteUrl('/online-therapy-consent'), lastModified: legalUpdated },
  { url: absoluteUrl('/emergency'), lastModified: legalUpdated },
  { url: absoluteUrl('/data-rights'), lastModified: legalUpdated },
  { url: absoluteUrl('/compliance'), lastModified: legalUpdated },
];

interface PublishedBlog {
  slug: string;
  title: string | null;
  featured_image: string | null;
  updated_at: string | null;
  created_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return publicPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('slug, title, featured_image, updated_at, created_at')
      .eq('is_published', true);

    if (error || !blogs) {
      return publicPages;
    }

    const blogPages = (blogs as PublishedBlog[])
      .filter((blog) => blog.slug && !/\btest\b/i.test(`${blog.slug} ${blog.title || ''}`))
      .map((blog) => ({
        url: absoluteUrl(`/blogs/${encodeURIComponent(blog.slug)}`),
        lastModified: new Date(blog.updated_at || blog.created_at || contentUpdated),
        images: blog.featured_image ? [absoluteUrl(blog.featured_image)] : undefined,
      }));

    return [...publicPages, ...blogPages];
  } catch (error) {
    console.error('Unable to build the blog sitemap:', error);
    return publicPages;
  }
}
