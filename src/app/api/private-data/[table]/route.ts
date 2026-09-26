import { therapistSlotIds } from '@/lib/bookings/access';
import { auth } from '@/lib/auth';
import { check, db } from '@/lib/whatsapp/server';
import { NextResponse } from 'next/server';
import { requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';
// Compatibility bridge for legacy browser Supabase reads. Projection is fixed on the server.
export async function GET(request: Request, context: { params: Promise<{ table: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { table } = await context.params;
  if (!['users','bookings'].includes(table)) return new Response('Not found', { status: 404 });
  const actor = await db().from('users').select('id,role').eq('email', session.user.email).single(); check(actor.error);
  if (!actor.data) return NextResponse.json({ message: 'User account not found' }, { status: 404 });
  const admin = actor.data?.role === 'admin';
  const params = new URL(request.url).searchParams;
  let query = db().from(table).select(table === 'users' ? 'id,name,email,role,phone_number' : '*,user:users(name,email,phone_number),slot:therapy_slots(*),therapy_slots(*)');
  if (!admin) {
    if (table === 'bookings' && actor.data?.role === 'therapist') query = query.in('slot_id', await therapistSlotIds(actor.data.id));
    else query = query.eq(table === 'users' ? 'id' : 'user_id', actor.data.id);
  }
  for (const key of ['id','user_id','email','status','slot_id','slot_date']) {
    const value = params.get(key);
    if (!value) continue;
    // user_id=email was a legacy component bug; authenticated scope above is authoritative.
    if (key === 'user_id' && value.includes('@')) continue;
    const dot = value.indexOf('.'); const operator = value.slice(0, dot); const operand = value.slice(dot + 1);
    if (operator === 'eq') query = query.eq(key, operand);
    else if (operator === 'gte') query = query.gte(key, operand);
    else if (operator === 'lte') query = query.lte(key, operand);
  }
  const order = params.get('order')?.split('.') || [];
  if (['created_at','slot_date'].includes(order[0])) query = query.order(order[0], { ascending: order[1] !== 'desc' });
  const result = await query.limit(1000); check(result.error);
  if (table === 'bookings' && ['admin','therapist'].includes(actor.data?.role)) {
    try {
      await writeAudit({ userId: actor.data.id, actorRole: actor.data?.role, action: 'BOOKING_LIST_VIEWED', resourceType: 'booking_collection', ipAddress: requestIp(request.headers), metadata: { recordCount: result.data?.length || 0, scope: admin ? 'ADMIN' : 'ASSIGNED_THERAPIST' } });
    } catch (auditError) {
      // Audit infrastructure is additive; an unavailable audit table must not
      // break authorised operational screens such as slot management.
      console.error('Unable to write booking list audit log:', auditError);
    }
  }
  const object = request.headers.get('accept')?.includes('application/vnd.pgrst.object+json');
  if (object && result.data?.length !== 1) return NextResponse.json({ code: 'PGRST116', message: 'Record not found' }, { status: 406 });
  return NextResponse.json(object ? result.data![0] : result.data, { headers: { 'Cache-Control': 'no-store' } });
}
