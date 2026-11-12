import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { PGlite } from '@electric-sql/pglite';

const require = createRequire(import.meta.url);
const load = require('../whatsapp/load-ts.cjs');

test('blog CTA defaults to booking and rejects unsafe destinations', () => {
  const { blogInput } = load('src/lib/blog-publishing.ts');
  const base = { title: 'A calmer day', content: '<p>Article</p>', status: 'draft' };
  assert.deepEqual(
    [blogInput(base).cta_label, blogInput(base).cta_url],
    ['Book now', '/book-session'],
  );
  assert.equal(blogInput({ ...base, cta_label: 'Read more', cta_url: 'https://example.com/guide' }).cta_url, 'https://example.com/guide');
  assert.throws(() => blogInput({ ...base, cta_url: 'javascript:alert(1)' }), /valid site path or HTTPS link/);
  assert.throws(() => blogInput({ ...base, cta_url: '//example.com' }), /valid site path or HTTPS link/);
});

test('CTA migration fills existing blogs and can be run again', async () => {
  const db = new PGlite();
  try {
    await db.exec('create table public.blogs(id integer primary key); insert into public.blogs(id) values (1);');
    const sql = readFileSync('scripts/migrations/20261112_blog_cta.sql', 'utf8');
    await db.exec(sql);
    await db.exec(sql);
    const result = await db.query('select cta_label, cta_url from public.blogs where id = 1');
    assert.deepEqual(result.rows[0], { cta_label: 'Book now', cta_url: '/book-session' });
  } finally {
    await db.close();
  }
});
