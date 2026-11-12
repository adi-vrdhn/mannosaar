import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('first-session offer has the requested prices and one active claim per service', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role service_role; create role anon; create role authenticated;
      create table public.users(id uuid primary key);
      create table public.bookings(user_id uuid, session_type text, payment_status text);
      create table public.pricing_config(
        session_type text, bundle_size integer, price numeric, currency text,
        updated_at timestamp default now(), unique(session_type, bundle_size)
      );
    `);
    await db.exec(readFileSync('scripts/migrations/20261111_first_session_offer.sql', 'utf8'));
    const prices = await db.query('select session_type, price, intro_offer_price, intro_offer_enabled from public.pricing_config order by session_type');
    assert.deepEqual(prices.rows, [
      { session_type: 'couple', price: '1500', intro_offer_price: '999.00', intro_offer_enabled: false },
      { session_type: 'personal', price: '999', intro_offer_price: '700.00', intro_offer_enabled: false },
    ]);

    const userId = '00000000-0000-0000-0000-000000000001';
    await db.query('insert into public.users(id) values ($1)', [userId]);
    await db.query("update public.pricing_config set intro_offer_enabled = true where session_type = 'personal' and bundle_size = 1");
    const claim = async (txnid) => (await db.query(
      'select public.claim_first_session_offer($1, $2, $3, $4) as claimed',
      [userId, 'personal', txnid, 700],
    )).rows[0].claimed;
    const wrongAmount = await db.query('select public.claim_first_session_offer($1, $2, $3, $4) as claimed', [userId, 'personal', 'test-txn-wrong', 699]);
    assert.equal(wrongAmount.rows[0].claimed, false);
    assert.equal(await claim('test-txn-first'), true);
    assert.equal(await claim('test-txn-second'), false);

    await db.query("update public.first_session_offer_claims set claimed_at = now() - interval '2 hours'");
    await db.query("update public.pricing_config set intro_offer_enabled = false where session_type = 'personal' and bundle_size = 1");
    assert.equal(await claim('test-txn-second'), false);
    await db.query("update public.pricing_config set intro_offer_enabled = true where session_type = 'personal' and bundle_size = 1");
    assert.equal(await claim('test-txn-second'), true);
    await db.query('insert into public.bookings(user_id, session_type, payment_status) values ($1, $2, $3)', [userId, 'personal', 'completed']);
    assert.equal(await claim('test-txn-third'), false);
  } finally {
    await db.close();
  }
});
