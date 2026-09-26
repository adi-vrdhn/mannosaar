import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';
import { check, db } from '@/lib/whatsapp/server';

const categories = new Set(['ACCOUNT','BOOKING','PAYMENT','CONSENT','CLINICAL','SUPPORT','AUDIT']);

async function admin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const actor = await db().from('users').select('role').eq('id', session.user.id).single();
  check(actor.error);
  return actor.data?.role === 'admin' ? session : null;
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await db().from('retention_settings').select('category,retention_days,updated_at,updated_by').order('category');
  check(result.error);
  return NextResponse.json({ settings: result.data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const category = String(body?.category || '').toUpperCase();
  const retentionDays = Number(body?.retentionDays);
  if (!categories.has(category) || !Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 36500) return NextResponse.json({ error: 'Invalid retention setting' }, { status: 400 });
  const result = await db().from('retention_settings').upsert({ category, retention_days: retentionDays, updated_at: new Date().toISOString(), updated_by: session.user.id }, { onConflict: 'category' }).select('category,retention_days,updated_at').single();
  check(result.error);
  await writeAudit({ userId: session.user.id, actorRole: 'admin', action: 'RETENTION_SETTING_UPDATED', resourceType: 'retention_setting', resourceId: category, ipAddress: requestIp(request.headers), metadata: { retentionDays } });
  return NextResponse.json({ setting: result.data });
}
