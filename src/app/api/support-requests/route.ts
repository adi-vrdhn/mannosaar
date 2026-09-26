import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { allowRequest, writeAudit } from '@/lib/compliance-server';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { db } from '@/lib/whatsapp/server';
import { sendSupportRequestEmails } from '@/lib/email';
import { privacyContacts } from '@/lib/compliance-config';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!(await allowRequest('support-request', session.user.id, 5, 3600))) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const subject = String(body?.subject || '').trim();
  const message = String(body?.message || '').trim();
  if (subject.length < 3 || subject.length > 120) return NextResponse.json({ error: 'Subject must be between 3 and 120 characters.' }, { status: 400 });
  if (message.length < 10 || message.length > 3000) return NextResponse.json({ error: 'Message must be between 10 and 3,000 characters.' }, { status: 400 });

  const created = await db().from('support_requests').insert({ user_id: session.user.id, subject, message }).select('id,status,created_at').single();
  if (created.error || !created.data) {
    console.error('Unable to save support request:', created.error);
    return NextResponse.json({ error: 'Unable to submit your request.' }, { status: 500 });
  }

  await writeAudit({
    userId: session.user.id,
    actorRole: session.user.role || 'user',
    action: 'SUPPORT_REQUEST_SUBMITTED',
    resourceType: 'support_request',
    resourceId: created.data.id,
    ipAddress: requestIp(request.headers),
    metadata: { subject },
  });
  const emailSent = await sendSupportRequestEmails({
    clientEmail: session.user.email,
    clientName: session.user.name || 'Client',
    subject,
    message,
    requestId: created.data.id,
    supportEmail: privacyContacts.support,
  });

  return NextResponse.json({ request: created.data, emailSent }, { status: 201 });
}
