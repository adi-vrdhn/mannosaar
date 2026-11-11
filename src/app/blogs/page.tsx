import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import BlogCard from '@/components/blog/BlogCard';
import { publicBlogTimeFilter } from '@/lib/blog-publishing';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;
const categories = [
  { value: 'all', label: 'All' },
  { value: 'article', label: 'Mental Health' },
  { value: 'guide', label: 'Guides' },
  { value: 'story', label: 'Stories' },
  { value: 'news', label: 'Updates' },
] as const;
type Category = (typeof categories)[number]['value'];

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  created_at: string;
  published_at?: string | null;
  content_type?: string | null;
  content?: string;
};

type PageProps = { searchParams: Promise<{ page?: string; type?: string }> };

function pageNumber(value?: string) {
  return value && /^\d+$/.test(value) ? Math.max(1, Math.min(1000, Number(value))) : 1;
}
function category(value?: string): Category {
  return categories.find(item => item.value === value)?.value || 'all';
}
function pageHref(page: number, type: Category) {
  const params = new URLSearchParams();
  if (type !== 'all') params.set('type', type);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/blogs?${query}` : '/blogs';
}
function readingMinutes(content?: string) {
  const words = (content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { page: rawPage, type: rawType } = await searchParams;
  const page = pageNumber(rawPage);
  const type = category(rawType);
  if (type !== 'all') return { ...createPageMetadata({ title: `${categories.find(item => item.value === type)?.label} Articles`, description: 'Browse Mannosaar mental health articles and guides.', path: '/blogs' }), robots: { index: false, follow: true } };
  if (page === 1) return {};
  return createPageMetadata({ title: `Mental Health Articles – Page ${page}`, description: `Browse page ${page} of Mannosaar's mental health articles.`, path: pageHref(page, type) });
}

async function getBlogs(page: number, type: Category): Promise<{ blogs: Blog[]; total: number; error: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { blogs: [], total: 0, error: true };
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let query = supabase.from('blogs')
    .select('id,title,slug,excerpt,featured_image,created_at,published_at,content_type,content', { count: 'exact' })
    .eq('is_published', true)
    .or(publicBlogTimeFilter())
    .not('slug', 'ilike', 'this-is-a-test-article%');
  if (type !== 'all') query = query.eq('content_type', type);
  const current = await query.order('created_at', { ascending: false }).range(from, to);
  if (!current.error) return { blogs: current.data || [], total: current.count || 0, error: false };
  if (current.status === 416) return { blogs: [], total: current.count || 0, error: false };

  // Keep the main index available if the optional blog fields have not been migrated yet.
  if (/published_at|content_type|schema cache/i.test(current.error.message)) {
    if (type !== 'all' && type !== 'article') return { blogs: [], total: 0, error: false };
    const legacy = await supabase.from('blogs')
      .select('id,title,slug,excerpt,featured_image,created_at,content', { count: 'exact' })
      .eq('is_published', true)
      .not('slug', 'ilike', 'this-is-a-test-article%')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (!legacy.error) return { blogs: legacy.data || [], total: legacy.count || 0, error: false };
    if (legacy.status === 416) return { blogs: [], total: legacy.count || 0, error: false };
    console.error('Unable to load blogs:', legacy.error);
  } else console.error('Unable to load blogs:', current.error);
  return { blogs: [], total: 0, error: true };
}

export default async function BlogsPage({ searchParams }: PageProps) {
  const { page: rawPage, type: rawType } = await searchParams;
  const page = pageNumber(rawPage);
  const type = category(rawType);
  const [{ blogs, total, error }, session] = await Promise.all([getBlogs(page, type), auth()]);
  if (!error && page > 1 && blogs.length === 0) notFound();
  const hasPrevious = page > 1;
  const hasNext = page * PAGE_SIZE < total;

  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#34213f]">
      <header className="bg-[#d7c4e1] px-4 pb-14 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#59316d]">Mannosaar knowledge centre</p>
              <h1 className="max-w-3xl font-playfair text-4xl font-bold leading-tight text-[#34213f] sm:text-5xl">Mental health articles and guides</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#493b52] sm:text-lg">Practical reading on emotional wellbeing, relationships, stress and starting counselling in India.</p>
            </div>
            {session?.user?.role === 'admin' && <Link href="/admin/blogs" className="shrink-0 rounded-full border border-[#6e4b82]/40 px-4 py-2 text-xs font-semibold text-[#4d2860] hover:bg-white/40">Manage blogs</Link>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Filter articles by category" className="mb-10 flex flex-wrap gap-2">
          {categories.map(item => {
            const active = item.value === type;
            return <Link key={item.value} href={pageHref(1, item.value)} aria-current={active ? 'page' : undefined} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-[#765187] bg-[#eadfec] text-[#34213f]' : 'border-[#ded2e3] bg-white text-[#6a5c70] hover:border-[#765187] hover:text-[#5b267a]'}`}>{item.label}</Link>;
          })}
        </nav>

        {error ? (
          <section aria-label="Articles" className="py-16 text-center"><h2 className="font-playfair text-2xl font-bold">Articles are temporarily unavailable</h2><p className="mt-3 text-[#675b6b]">Please try again in a little while.</p></section>
        ) : blogs.length === 0 ? (
          <section aria-label="Articles" className="py-16 text-center"><h2 className="font-playfair text-2xl font-bold">No articles here yet</h2><p className="mt-3 text-[#675b6b]">Explore another category or check back later.</p></section>
        ) : (
          <>
            <section aria-label={type === 'all' ? 'All articles' : `${categories.find(item => item.value === type)?.label} articles`} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map(blog => <BlogCard key={blog.id} id={blog.id} title={blog.title} slug={blog.slug} excerpt={blog.excerpt || ''} created_at={blog.created_at} published_at={blog.published_at} featured_image={blog.featured_image} content_type={blog.content_type || 'article'} reading_minutes={readingMinutes(blog.content)} />)}
            </section>
            {(hasPrevious || hasNext) && <nav aria-label="Article pages" className="mt-12 flex items-center justify-between border-t border-[#e5dbe9] pt-6 text-sm font-semibold"><div>{hasPrevious && <Link href={pageHref(page - 1, type)} className="text-[#5b267a] hover:underline">← Newer articles</Link>}</div><span className="text-[#675b6b]">Page {page}</span><div>{hasNext && <Link href={pageHref(page + 1, type)} className="text-[#5b267a] hover:underline">Older articles →</Link>}</div></nav>}
          </>
        )}
      </div>
    </main>
  );
}
