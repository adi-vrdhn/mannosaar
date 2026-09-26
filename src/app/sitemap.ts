import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mannosaar.com').replace(/\/$/, '');
const siteUpdated = new Date('2026-09-26');

const publicPages: MetadataRoute.Sitemap = [
  { url: siteUrl, lastModified: siteUpdated, changeFrequency: 'weekly', priority: 1 },
  { url: `${siteUrl}/services`, lastModified: siteUpdated, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${siteUrl}/about`, lastModified: siteUpdated, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${siteUrl}/counselling/individual`, lastModified: siteUpdated, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${siteUrl}/counselling/couples`, lastModified: siteUpdated, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${siteUrl}/support/overthinking`, lastModified: siteUpdated, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${siteUrl}/support/stress`, lastModified: siteUpdated, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${siteUrl}/how-it-works`, lastModified: siteUpdated, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${siteUrl}/faq`, lastModified: siteUpdated, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${siteUrl}/blogs`, lastModified: siteUpdated, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${siteUrl}/social`, lastModified: siteUpdated, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${siteUrl}/privacy`, lastModified: siteUpdated, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${siteUrl}/terms`, lastModified: siteUpdated, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${siteUrl}/refund-policy`, lastModified: siteUpdated, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${siteUrl}/online-therapy-consent`, lastModified: siteUpdated, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${siteUrl}/emergency`, lastModified: siteUpdated, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${siteUrl}/data-rights`, lastModified: siteUpdated, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${siteUrl}/compliance`, lastModified: siteUpdated, changeFrequency: 'yearly', priority: 0.3 },
];

interface PublishedBlog {
  slug: string;
  title: string | null;
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
      .select('slug, title, updated_at, created_at')
      .eq('is_published', true);

    if (error || !blogs) {
      return publicPages;
    }

    const blogPages = (blogs as PublishedBlog[])
      .filter((blog) => blog.slug && !/\btest\b/i.test(`${blog.slug} ${blog.title || ''}`))
      .map((blog) => ({
        url: `${siteUrl}/blogs/${encodeURIComponent(blog.slug)}`,
        lastModified: new Date(blog.updated_at || blog.created_at || siteUpdated),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

    return [...publicPages, ...blogPages];
  } catch (error) {
    console.error('Unable to build the blog sitemap:', error);
    return publicPages;
  }
}
