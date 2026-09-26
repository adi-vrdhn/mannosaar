import { check, db } from './whatsapp/server';
import { REQUIRED_CONSENT_TYPES } from './compliance';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { rpc } from './whatsapp/server';

type LocalRateLimitBucket = {
  count: number;
  expiresAt: number;
};

const localRateLimits = new Map<string, LocalRateLimitBucket>();
const SIGNED_CONSENT_PREFIX = 'cs1';
const SIGNED_CONSENT_LIFETIME_MS = 24 * 60 * 60 * 1_000;

function consentSigningSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('MISSING_CONFIG_NEXTAUTH_SECRET');
  return secret;
}

function signConsentPayload(payload: string) {
  return createHmac('sha256', consentSigningSecret()).update(payload).digest('base64url');
}

export function createSignedConsentReceipt(userId: string, acceptedAt = new Date()) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    acceptedAt: acceptedAt.toISOString(),
    expiresAt: acceptedAt.getTime() + SIGNED_CONSENT_LIFETIME_MS,
    consentVersion: '1.0',
  })).toString('base64url');

  return `${SIGNED_CONSENT_PREFIX}.${payload}.${signConsentPayload(payload)}`;
}

function validateSignedConsentReceipt(receiptId: string, userId: string) {
  const [prefix, payload, signature] = receiptId.split('.');
  if (prefix !== SIGNED_CONSENT_PREFIX || !payload || !signature) return false;

  try {
    const expected = Buffer.from(signConsentPayload(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;

    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId?: string;
      acceptedAt?: string;
      expiresAt?: number;
    };

    return value.userId === userId
      && Boolean(value.acceptedAt)
      && Number(value.expiresAt) > Date.now();
  } catch {
    return false;
  }
}

function allowLocalRequest(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const existing = localRateLimits.get(key);

  if (!existing || existing.expiresAt <= now) {
    localRateLimits.set(key, { count: 1, expiresAt: now + windowSeconds * 1_000 });
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export async function allowRequest(scope: string, identity: string, limit: number, windowSeconds: number) {
  const keyHash = createHash('sha256').update(`${scope}:${identity}`).digest('hex');

  try {
    return await rpc<boolean>('compliance_rate_limit', {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
  } catch (error) {
    // Supabase can temporarily omit a newly-created RPC from its PostgREST
    // schema cache (PGRST202). Keep the endpoint protected without blocking
    // bookings while that cache refreshes.
    if (error instanceof Error && error.message.includes('DB_PGRST202_compliance_rate_limit')) {
      console.warn('Using local compliance rate limiter while database RPC is unavailable.');
      return allowLocalRequest(keyHash, limit, windowSeconds);
    }

    throw error;
  }
}

export async function validateConsentReceipt(receiptId: string, userId: string) {
  if (receiptId.startsWith(`${SIGNED_CONSENT_PREFIX}.`)) {
    return validateSignedConsentReceipt(receiptId, userId);
  }

  if (!/^[0-9a-f-]{36}$/i.test(receiptId)) return false;
  const result = await db()
    .from('consents')
    .select('consent_type,accepted,accepted_at')
    .eq('receipt_id', receiptId)
    .eq('user_id', userId)
    .in('consent_type', [...REQUIRED_CONSENT_TYPES]);
  check(result.error);
  const accepted = new Set((result.data || []).filter(row => row.accepted).map(row => row.consent_type));
  return REQUIRED_CONSENT_TYPES.every(type => accepted.has(type));
}

export async function linkConsentReceipt(receiptId: string, userId: string, bookingId: string) {
  if (!(await validateConsentReceipt(receiptId, userId))) throw new Error('CONSENT_REQUIRED');

  if (receiptId.startsWith(`${SIGNED_CONSENT_PREFIX}.`)) {
    try {
      await writeAudit({ userId, action: 'SIGNED_CONSENT_LINKED', resourceType: 'booking', resourceId: bookingId });
    } catch (error) {
      console.warn('Unable to audit signed consent link:', error);
    }
    return;
  }

  const linked = await db().from('consents').update({ booking_id: bookingId }).eq('receipt_id', receiptId).eq('user_id', userId).is('booking_id', null);
  check(linked.error);
  await writeAudit({ userId, action: 'CONSENT_LINKED', resourceType: 'booking', resourceId: bookingId });
}

export async function writeAudit(input: {
  userId?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const result = await db().from('audit_logs').insert({
    actor_user_id: input.userId || null,
    actor_role: input.actorRole || null,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId || null,
    ip_address: input.ipAddress || null,
    metadata: input.metadata || {},
  });
  if (result.error?.code === 'PGRST205' || result.error?.code === '42P01') {
    console.warn('Audit table is unavailable; continuing without the auxiliary audit row.');
    return;
  }
  check(result.error);
}
