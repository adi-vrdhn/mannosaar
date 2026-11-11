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
  if (!['users','bookings','therapy_slots','block_schedules'].includes(table)) return new Response('Not found', { status: 404 });
  const actor = await db().from('users').select('id,role').eq('email', session.user.email).single(); check(actor.error);
  if (!actor.data) return NextResponse.json({ message: 'User account not found' }, { status: 404 });
  const admin = actor.data?.role === 'admin';
  if (table === 'block_schedules' && !admin) return new Response('Forbidden', { status: 403 });
  const params = new URL(request.url).searchParams;
  const projection = table === 'users' ? 'id,name,email,role,phone_number'
    : table === 'bookings' ? '*,user:users(name,email,phone_number),slot:therapy_slots(*),therapy_slots(*)'
    : table === 'therapy_slots' ? 'id,date,start_time,end_time,duration_minutes,is_available,is_blocked,therapist_id,meeting_link'
    : 'id,start_date,end_date,start_time,end_time,block_type,reason';
  let query = db().from(table).select(projection);
  if (!admin) {
    if (table === 'bookings' && actor.data?.role === 'therapist') query = query.in('slot_id', await therapistSlotIds(actor.data.id));
    else if (table === 'users' || table === 'bookings') query = query.eq(table === 'users' ? 'id' : 'user_id', actor.data.id);
  }
  for (const key of ['id','user_id','email','status','slot_id','slot_date','date','is_blocked']) {
    if (!['users','bookings'].includes(table) && ['user_id','email','status','slot_id','slot_date'].includes(key)) continue;
    if (table !== 'therapy_slots' && ['date','is_blocked'].includes(key)) continue;
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
  if (['created_at','slot_date','date','start_time','start_date'].includes(order[0])) query = query.order(order[0], { ascending: order[1] !== 'desc' });
  const result = await query.limit(1000); check(result.error);
  let visibleData: unknown = result.data || [];
  if (table === 'therapy_slots' && !admin) {
    const own = await db().from('bookings').select('slot_id').eq('user_id', actor.data.id);
    check(own.error);
    const ownSlotIds = new Set((own.data || []).map(row => row.slot_id));
    const slots = (result.data || []) as unknown as Array<{ id: string; is_available: boolean; is_blocked: boolean }>;
    visibleData = slots.filter(slot => (slot.is_available && !slot.is_blocked) || ownSlotIds.has(slot.id));
  }
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
  const rows = visibleData as unknown[];
  if (object && rows.length !== 1) return NextResponse.json({ code: 'PGRST116', message: 'Record not found' }, { status: 406 });
  return NextResponse.json(object ? rows[0] : rows, { headers: { 'Cache-Control': 'no-store' } });
}
