import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';
import { check, db } from '@/lib/whatsapp/server';

const statuses = new Set(['SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','COMPLETED']);

async function reviewer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const actor = await db().from('users').select('role').eq('id', session.user.id).single(); check(actor.error);
  return ['admin','support'].includes(actor.data?.role) ? { session, role: actor.data!.role } : null;
}

export async function GET() {
  if (!(await reviewer())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await db().from('privacy_requests').select('id,user_id,request_type,status,details,resolution_note,created_at,updated_at,completed_at').order('created_at', { ascending: false }).limit(200);
  check(result.error);
  return NextResponse.json({ requests: result.data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  const actor = await reviewer();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = String(body?.id || '');
  const status = String(body?.status || '').toUpperCase();
  const resolutionNote = String(body?.resolutionNote || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !statuses.has(status) || resolutionNote.length > 2000) return NextResponse.json({ error: 'Invalid request update' }, { status: 400 });
  const result = await db().from('privacy_requests').update({ status, resolution_note: resolutionNote || null, updated_at: new Date().toISOString(), completed_at: status === 'COMPLETED' ? new Date().toISOString() : null }).eq('id', id).select('id,user_id,request_type,status,resolution_note,updated_at,completed_at').single();
  check(result.error);
  await writeAudit({ userId: actor.session.user.id, actorRole: actor.role, action: 'PRIVACY_REQUEST_UPDATED', resourceType: 'privacy_request', resourceId: id, ipAddress: requestIp(request.headers), metadata: { status } });
  return NextResponse.json({ request: result.data });
}
