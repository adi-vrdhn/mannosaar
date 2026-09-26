import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';
import { check, db } from '@/lib/whatsapp/server';

const titles = new Set(['Psychiatrist','Clinical Psychologist','Counselling Psychologist','Counsellor','Therapist']);
const statuses = new Set(['PENDING','VERIFIED','REJECTED','EXPIRED']);

async function admin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const actor = await db().from('users').select('role').eq('id', session.user.id).single(); check(actor.error);
  return actor.data?.role === 'admin' ? session : null;
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await db().from('therapist_profiles').select('user_id,full_name,professional_title,qualification,registration_authority,registration_number,registration_valid_until,verification_status,verification_date,verified_by,updated_at').order('full_name');
  check(result.error);
  return NextResponse.json({ therapists: result.data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const userId = String(body?.userId || '');
  const professionalTitle = String(body?.professionalTitle || '');
  const verificationStatus = String(body?.verificationStatus || 'PENDING').toUpperCase();
  const fullName = String(body?.fullName || '').trim();
  const qualification = String(body?.qualification || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !titles.has(professionalTitle) || !statuses.has(verificationStatus) || !fullName || !qualification) return NextResponse.json({ error: 'Invalid therapist verification record' }, { status: 400 });
  const result = await db().from('therapist_profiles').upsert({
    user_id: userId,
    full_name: fullName.slice(0, 200),
    professional_title: professionalTitle,
    qualification: qualification.slice(0, 500),
    registration_authority: String(body?.registrationAuthority || '').trim().slice(0, 200) || null,
    registration_number: String(body?.registrationNumber || '').trim().slice(0, 200) || null,
    registration_valid_until: body?.registrationValidUntil || null,
    verification_status: verificationStatus,
    verification_date: verificationStatus === 'VERIFIED' ? new Date().toISOString() : null,
    verified_by: verificationStatus === 'VERIFIED' ? session.user.id : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select('*').single();
  check(result.error);
  await writeAudit({ userId: session.user.id, actorRole: 'admin', action: 'THERAPIST_VERIFICATION_UPDATED', resourceType: 'therapist_profile', resourceId: userId, ipAddress: requestIp(request.headers), metadata: { professionalTitle, verificationStatus } });
  return NextResponse.json({ therapist: result.data });
}
