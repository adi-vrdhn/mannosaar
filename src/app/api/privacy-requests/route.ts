import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { allowRequest, writeAudit } from '@/lib/compliance-server';
import { check, db } from '@/lib/whatsapp/server';
import { sendPrivacyRequestAcknowledgementEmail } from '@/lib/email';

const requestTypes = new Set(['ACCESS','CORRECTION','DELETION','CONSENT_WITHDRAWAL','DATA_EXPORT','PRIVACY_COMPLAINT']);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await db().from('privacy_requests').select('id,request_type,status,details,resolution_note,created_at,updated_at,completed_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50);
  check(result.error);
  return NextResponse.json({ requests: result.data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!(await allowRequest('privacy-request', session.user.id, 5, 3600))) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  const body = await request.json().catch(() => null);
  const requestType = String(body?.requestType || '').toUpperCase();
  const details = String(body?.details || '').trim();
  if (!requestTypes.has(requestType)) return NextResponse.json({ error: 'Invalid privacy request type' }, { status: 400 });
  if (details.length > 2000) return NextResponse.json({ error: 'Details must be 2,000 characters or fewer.' }, { status: 400 });

  const open = await db().from('privacy_requests').select('id').eq('user_id', session.user.id).eq('request_type', requestType).in('status', ['SUBMITTED','UNDER_REVIEW','APPROVED']).limit(1);
  check(open.error);
  if (open.data?.length) return NextResponse.json({ error: 'An open request of this type already exists.' }, { status: 409 });

  const created = await db().from('privacy_requests').insert({ user_id: session.user.id, request_type: requestType, details: details || null }).select('id,status,created_at').single();
  check(created.error);
  await writeAudit({ userId: session.user.id, actorRole: session.user.role || 'user', action: 'PRIVACY_REQUEST_SUBMITTED', resourceType: 'privacy_request', resourceId: created.data!.id, ipAddress: requestIp(request.headers), metadata: { requestType } });
  if (session.user.email) {
    await sendPrivacyRequestAcknowledgementEmail({
      clientEmail: session.user.email,
      clientName: session.user.name || 'Client',
      requestType,
      requestId: created.data!.id,
    });
  }
  return NextResponse.json({ request: created.data }, { status: 201 });
}
