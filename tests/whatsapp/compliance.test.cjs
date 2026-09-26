const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const compliance = load('src/lib/compliance.ts');

const accepted = Object.fromEntries(compliance.REQUIRED_CONSENT_TYPES.map(type => [type, true]));

test('all required consent types are mandatory while marketing remains optional', () => {
  assert.equal(compliance.hasRequiredConsents(accepted), true);
  assert.equal(compliance.hasRequiredConsents({ ...accepted, MARKETING: false }), true);
  assert.equal(compliance.hasRequiredConsents({ ...accepted, AGE_18: false }), false);
  assert.equal(compliance.hasRequiredConsents({ ...accepted, PRIVACY_POLICY: undefined }), false);
});

test('country metadata can be recorded without restricting access', () => {
  assert.equal(compliance.requestCountry(new Headers()), '');
  assert.equal(compliance.requestCountry(new Headers({ 'x-vercel-ip-country': 'US' })), 'US');
  assert.equal(compliance.requestCountry(new Headers({ 'cf-ipcountry': 'gb' })), 'GB');
});

test('state-changing browser requests reject cross-origin origins', () => {
  assert.equal(compliance.isSameOrigin(new Request('https://mannosaar.com/api/test', { headers: { origin: 'https://mannosaar.com' } })), true);
  assert.equal(compliance.isSameOrigin(new Request('https://mannosaar.com/api/test', { headers: { origin: 'https://attacker.example' } })), false);
});
