import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const load = require('../whatsapp/load-ts.cjs');

test('sitemap reflects published, edited, unpublished and deleted blogs on each request', async () => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  let blogs = [];
  const createClient = () => ({
    from: () => {
      let publishedOnly = false;
      let cutoff = '';
      const query = {
        select() { return query; },
        eq(key, value) { if (key === 'is_published') publishedOnly = value; return query; },
        or(filter) { cutoff = filter.split('published_at.lte.')[1]; return query; },
        order() { return query; },
        async range(start, end) {
          const visible = blogs.filter(blog => (!publishedOnly || blog.is_published) && (!blog.published_at || blog.published_at <= cutoff));
          return { data: visible.slice(start, end + 1), error: null };
        },
      };
      return query;
    },
  });
  try {
    const { default: sitemap } = load('src/app/sitemap.ts', {
      '@supabase/supabase-js': { createClient },
      '@/lib/blog-publishing': { publicBlogTimeFilter: () => `published_at.is.null,published_at.lte.${new Date().toISOString()}` },
      '@/lib/seo': { absoluteUrl: path => new URL(path, 'https://www.mannosaar.com').toString() },
    });
    const basePages = await sitemap();
    assert.ok(basePages.some(page => page.url === 'https://www.mannosaar.com/blogs'));
    blogs = [{ slug: 'example', is_published: false, published_at: null, created_at: '2026-01-01T00:00:00Z', updated_at: null }];
    assert.equal((await sitemap()).some(page => page.url.endsWith('/blogs/example')), false);
    blogs[0].is_published = true;
    let entry = (await sitemap()).find(page => page.url.endsWith('/blogs/example'));
    assert.equal(entry?.lastModified, '2026-01-01T00:00:00.000Z');
    blogs[0].updated_at = '2026-02-01T12:30:00Z';
    entry = (await sitemap()).find(page => page.url.endsWith('/blogs/example'));
    assert.equal(entry?.lastModified, '2026-02-01T12:30:00.000Z');
    blogs[0].is_published = false;
    assert.equal((await sitemap()).some(page => page.url.endsWith('/blogs/example')), false);
    blogs[0].is_published = true;
    blogs = [];
    assert.equal((await sitemap()).some(page => page.url.endsWith('/blogs/example')), false);
  } finally {
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});
