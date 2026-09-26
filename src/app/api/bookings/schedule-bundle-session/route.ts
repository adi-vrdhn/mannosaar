import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/whatsapp/server';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { getTherapistNotificationRecipients } from '@/lib/therapist-email';

type BundleSession = {
  date: string;
  slot_id?: string;
  slotId?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  meeting_link?: string;
  google_calendar_event_id?: string;
};

function sessionEnd(session: BundleSession) {
  return new Date(`${session.date}T${session.end_time || session.endTime || '23:59'}+05:30`);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const bookingId = String(body?.bookingId || '');
  const slotId = String(body?.slotId || '');
  const sessionIndex = Number(body?.sessionIndex);
  if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !/^[0-9a-f-]{36}$/i.test(slotId) || !Number.isInteger(sessionIndex) || sessionIndex < 1) {
    return NextResponse.json({ error: 'Invalid bundle session request.' }, { status: 400 });
  }

  const bookingResult = await db().from('bookings').select('id,user_id,user_name,user_email,session_type,status,payment_status,number_of_sessions,session_dates,meeting_links,notes').eq('id', bookingId).single();
  if (bookingResult.error || !bookingResult.data) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  const booking = bookingResult.data;
  if (booking.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (booking.status !== 'confirmed' || !['completed', 'paid'].includes(String(booking.payment_status || '').toLowerCase())) {
    return NextResponse.json({ error: 'This paid bundle is not available for scheduling.' }, { status: 409 });
  }

  const scheduledSessions = (Array.isArray(booking.session_dates) ? booking.session_dates : []) as BundleSession[];
  const totalSessions = Number(booking.number_of_sessions || scheduledSessions.length);
  if (sessionIndex !== scheduledSessions.length || sessionIndex >= totalSessions) {
    return NextResponse.json({ error: 'Only the next unlocked session can be scheduled.' }, { status: 409 });
  }
  const previousSession = scheduledSessions[sessionIndex - 1];
  if (!previousSession || Number.isNaN(sessionEnd(previousSession).getTime()) || sessionEnd(previousSession).getTime() > Date.now()) {
    return NextResponse.json({ error: 'The previous session must be completed before scheduling the next one.' }, { status: 409 });
  }

  const slotResult = await db().from('therapy_slots').select('id,date,start_time,end_time,therapist_id,is_available,is_blocked').eq('id', slotId).single();
  if (slotResult.error || !slotResult.data || !slotResult.data.is_available || slotResult.data.is_blocked) {
    return NextResponse.json({ error: 'That time is no longer available.' }, { status: 409 });
  }
  const slot = slotResult.data;
  const reserved = await db().from('therapy_slots').update({ is_available: false }).eq('id', slotId).eq('is_available', true).eq('is_blocked', false).select('id').maybeSingle();
  if (reserved.error || !reserved.data) return NextResponse.json({ error: 'That time was just booked. Please choose another.' }, { status: 409 });

  let eventId = '';
  try {
    const calendar = await createGoogleCalendarEvent(
      slot.therapist_id || 'default-therapist',
      booking.user_email || session.user.email,
      booking.user_name || session.user.name || 'Client',
      slot.date,
      slot.start_time,
      slot.end_time,
      booking.session_type
    );
    if (!calendar?.meetLink) throw new Error('Meeting link was not created');
    eventId = calendar.eventId || '';

    const nextSession: BundleSession = {
      date: slot.date,
      slot_id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      meeting_link: calendar.meetLink,
      google_calendar_event_id: eventId,
    };
    const meetingLinks = [...(Array.isArray(booking.meeting_links) ? booking.meeting_links : []), calendar.meetLink];
    const updated = await db().from('bookings').update({ session_dates: [...scheduledSessions, nextSession], meeting_links: meetingLinks }).eq('id', bookingId).select('id,session_dates,meeting_links').single();
    if (updated.error || !updated.data) throw new Error('Booking could not be updated');

    const therapist = await db().from('users').select('email,name').eq('id', slot.therapist_id).maybeSingle();
    await sendBookingConfirmationEmail({
      clientEmail: booking.user_email || session.user.email,
      clientName: booking.user_name || session.user.name || 'Client',
      therapistEmail: getTherapistNotificationRecipients(therapist.data?.email),
      therapistName: therapist.data?.name || 'Therapist',
      sessionType: booking.session_type,
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      meetingLink: calendar.meetLink,
      clientNote: booking.notes || null,
    });
    try {
      await writeAudit({ userId: session.user.id, actorRole: session.user.role || 'user', action: 'BUNDLE_SESSION_SCHEDULED', resourceType: 'booking', resourceId: bookingId, ipAddress: requestIp(request.headers), metadata: { sessionNumber: sessionIndex + 1, slotId } });
    } catch (auditError) {
      console.warn('Bundle session scheduled, but audit write failed:', auditError);
    }
    return NextResponse.json({ booking: updated.data, meetingLink: calendar.meetLink });
  } catch (error) {
    await db().from('therapy_slots').update({ is_available: true }).eq('id', slotId);
    if (eventId) {
      try { await deleteGoogleCalendarEvent(slot.therapist_id || 'default-therapist', eventId); } catch { /* best-effort rollback */ }
    }
    console.error('Unable to schedule bundle session:', error);
    return NextResponse.json({ error: 'Unable to schedule this session. Please try again.' }, { status: 500 });
  }
}
