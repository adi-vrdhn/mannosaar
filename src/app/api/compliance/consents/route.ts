import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  CONSENT_POLICY_VERSION,
  CONSENT_VERSION,
  REQUIRED_CONSENT_TYPES,
  hasRequiredConsents,
  isSameOrigin,
  requestCountry,
  requestIp,
} from '@/lib/compliance';
import { allowRequest, createSignedConsentReceipt, writeAudit } from '@/lib/compliance-server';
import { check, db } from '@/lib/whatsapp/server';

export async function POST(request: Request) {
  const fallbackRequest = request.clone();

  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    if (!(await allowRequest('consent', session.user.id, 10, 60))) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });

    const body = await request.json().catch(() => null);
    if (!hasRequiredConsents(body?.selections)) {
      return NextResponse.json({ error: 'Please accept the required booking consent to continue.' }, { status: 400 });
    }

    const recent = await db().from('consents').select('receipt_id,consent_type,accepted_at').eq('user_id', session.user.id).gte('accepted_at', new Date(Date.now() - 5_000).toISOString()).order('accepted_at', { ascending: false }).limit(20);
    check(recent.error);
    if (recent.data?.length) {
      const latestReceipt = recent.data[0].receipt_id;
      const latestTypes = new Set(recent.data.filter(row => row.receipt_id === latestReceipt).map(row => row.consent_type));
      if (REQUIRED_CONSENT_TYPES.every(type => latestTypes.has(type))) {
        return NextResponse.json({ receiptId: latestReceipt, acceptedAt: recent.data[0].accepted_at, reused: true }, { headers: { 'Cache-Control': 'no-store' } });
      }
      return NextResponse.json({ error: 'Please wait a moment before submitting consent again.' }, { status: 429 });
    }

    const receiptId = randomUUID();
    const acceptedAt = new Date().toISOString();
    const ipAddress = requestIp(request.headers);
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500) || null;
    const country = requestCountry(request.headers) || null;
    const types = [...REQUIRED_CONSENT_TYPES, 'MARKETING' as const];
    const inserted = await db().from('consents').insert(types.map(consentType => ({
      receipt_id: receiptId,
      user_id: session.user.id,
      consent_type: consentType,
      consent_version: CONSENT_VERSION,
      policy_version: CONSENT_POLICY_VERSION[consentType],
      accepted: consentType === 'MARKETING' ? body.selections.MARKETING === true : true,
      accepted_at: acceptedAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { channel: 'WEB', country },
    })));
    check(inserted.error);

    try {
      await writeAudit({
        userId: session.user.id,
        actorRole: session.user.role || 'user',
        action: 'CONSENT_ACCEPTED',
        resourceType: 'consent_receipt',
        resourceId: receiptId,
        ipAddress,
        metadata: { consentTypes: [...REQUIRED_CONSENT_TYPES], marketingAccepted: body.selections.MARKETING === true, country },
      });
    } catch (auditError) {
      // Consent is already durably stored. An audit-log outage must not make the
      // client retry the insert or lose the valid receipt.
      console.error('Unable to write consent audit log:', auditError);
    }

    return NextResponse.json({ receiptId, acceptedAt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Consent recording failed:', error);
    const message = error instanceof Error ? error.message : '';
    const setupMissing = message.includes('DB_PGRST202') || message.includes('DB_PGRST205');

    if (setupMissing) {
      const session = await auth();
      if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await fallbackRequest.json().catch(() => null);
      if (!hasRequiredConsents(body?.selections)) {
        return NextResponse.json({ error: 'Please accept the required booking consent to continue.' }, { status: 400 });
      }

      const acceptedAt = new Date();
      return NextResponse.json({
        receiptId: createSignedConsentReceipt(session.user.id, acceptedAt),
        acceptedAt: acceptedAt.toISOString(),
        storage: 'signed',
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json(
      { error: 'Unable to record booking consent right now. Please try again.' },
      { status: 500 },
    );
  }
}
