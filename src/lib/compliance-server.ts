import { check, db } from './whatsapp/server';
import { REQUIRED_CONSENT_TYPES } from './compliance';
import { createHash } from 'node:crypto';
import { rpc } from './whatsapp/server';

type LocalRateLimitBucket = {
  count: number;
  expiresAt: number;
};

const localRateLimits = new Map<string, LocalRateLimitBucket>();

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
    // A process-local limiter cannot protect a scaled production deployment.
    // Allow it only while developing against an incomplete local schema.
    if (error instanceof Error && error.message.includes('DB_PGRST202_compliance_rate_limit')) {
      if (process.env.NODE_ENV === 'production') throw error;
      console.warn('Using local compliance rate limiter while database RPC is unavailable.');
      return allowLocalRequest(keyHash, limit, windowSeconds);
    }

    throw error;
  }
}

export async function validateConsentReceipt(receiptId: string, userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(receiptId)) return false;
  const result = await db()
    .from('consents')
    .select('consent_type,accepted,accepted_at')
    .eq('receipt_id', receiptId)
    .eq('user_id', userId)
    .in('consent_type', [...REQUIRED_CONSENT_TYPES]);
  check(result.error);
  const accepted = new Set((result.data || []).filter(row => row.accepted).map(row => row.consent_type));
  if (!REQUIRED_CONSENT_TYPES.every(type => accepted.has(type))) return false;
  const acceptedAt = (result.data || []).map(row => row.accepted_at).filter(Boolean).sort().at(-1);
  if (!acceptedAt) return false;
  // A withdrawal invalidates old receipts for future purchases while retaining
  // the original evidence for bookings already completed.
  const withdrawal = await db().from('privacy_requests').select('id').eq('user_id', userId).eq('request_type', 'CONSENT_WITHDRAWAL').gt('created_at', acceptedAt).limit(1);
  check(withdrawal.error);
  return !withdrawal.data?.length;
}

export async function linkConsentReceipt(receiptId: string, userId: string, bookingId: string) {
  if (!(await validateConsentReceipt(receiptId, userId))) throw new Error('CONSENT_REQUIRED');

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
