import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseBlogImport } = require('../whatsapp/load-ts.cjs')('src/lib/blog-import.ts');
const base = {
  schema_version: '1.0',
  title: 'Why am I sad?',
  slug: 'why-am-i-sad',
  content: '<h2>Introduction</h2><p>Some text.</p>',
  excerpt: 'A useful introduction.',
  primary_seo_keyword: 'sadness',
};

test('blog JSON maps to editor fields and supplies defaults', () => {
  assert.deepEqual(parseBlogImport(base), {
    title: base.title,
    slug: base.slug,
    content: base.content,
    excerpt: base.excerpt,
    primary_keyword: base.primary_seo_keyword,
    content_type: 'article',
    editor_name: 'Mannosaar Editorial',
    secondary_keywords: '',
    cta_label: 'Book now →',
    cta_url: '/book-session',
  });
  assert.equal(parseBlogImport({ ...base, type: 'Guide', secondary_seo_keywords: [' one ', 'two'] }).secondary_keywords, 'one, two');
});

test('blog JSON rejects invalid schema, field types and unsafe destinations', () => {
  assert.throws(() => parseBlogImport({ ...base, schema_version: '2.0' }), /schema_version/);
  assert.throws(() => parseBlogImport({ ...base, slug: 'Bad Slug' }), /slug/);
  assert.throws(() => parseBlogImport({ ...base, content: '' }), /content/);
  assert.throws(() => parseBlogImport({ ...base, type: 'video' }), /type/);
  assert.throws(() => parseBlogImport({ ...base, secondary_seo_keywords: 'one' }), /secondary_seo_keywords/);
  assert.throws(() => parseBlogImport({ ...base, button_link: 'javascript:alert(1)' }), /button_link/);
  assert.throws(() => parseBlogImport({ ...base, button_link: '//example.com' }), /button_link/);
});
