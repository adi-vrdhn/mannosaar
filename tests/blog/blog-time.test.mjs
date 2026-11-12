import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const load = require('../whatsapp/load-ts.cjs');
const { toIstDateTimeInput, istDateTimeInputToIso, formatArticleTimeIst } = load('src/lib/blog-time.ts');

test('article schedule input uses IST regardless of browser timezone', () => {
  assert.equal(toIstDateTimeInput('2026-11-12T04:30:00.000Z'), '2026-11-12T10:00');
  assert.equal(istDateTimeInputToIso('2026-11-12T10:00'), '2026-11-12T04:30:00.000Z');
  assert.equal(toIstDateTimeInput('2026-11-11T19:00:00.000Z'), '2026-11-12T00:30');
  assert.throws(() => istDateTimeInputToIso('2026-02-30T10:00'), /valid IST publishing time/);
});

test('article timestamps identify IST for readers', () => {
  assert.match(formatArticleTimeIst('2026-11-12T04:30:00.000Z'), /10:00\s*am IST \(GMT\+5:30\)/i);
});
