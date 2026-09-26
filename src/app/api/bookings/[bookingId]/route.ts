'use server';

import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { therapistSlotIds } from '@/lib/bookings/access';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';
import { combineBookingNotes, splitBookingNotes } from '@/lib/booking-notes';
import { sendTherapistNoteNotificationEmail } from '@/lib/email';

function isMissingTherapistNoteColumn(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === 'PGRST204' || candidate.message?.includes('therapist_note_for_client');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await auth();

    if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is admin or owner of the booking
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Fetch detailed booking information
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(*),
        slot:therapy_slots(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check authorization: admin can access all, users can only access their own
    const isAdmin = userData?.role === 'admin';
    const isOwner = booking.user_id === userData.id;
    const isAssignedTherapist = userData.role === 'therapist' && (await therapistSlotIds(userData.id)).includes(booking.slot_id);
    const isSupport = userData?.role === 'support';
    const isFinance = userData?.role === 'finance';
    if (!isAdmin && !isOwner && !isAssignedTherapist && !isSupport && !isFinance) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const maySeeCareContext = isAdmin || isOwner || isAssignedTherapist;
    const maySeeMeeting = isAdmin || isOwner || isAssignedTherapist || isSupport;

    const separatedNotes = splitBookingNotes(booking.notes);

    const firstSession = Array.isArray(booking.session_dates) ? booking.session_dates[0] : null;
    const firstSessionWasRescheduled = Boolean(
      firstSession?.rescheduled_at || Number(firstSession?.reschedule_count || 0) > 0
    );

    // Format the response
    const formattedBooking = {
      id: booking.id,
      user: {
        name: booking.user?.name || booking.user_name || 'Client',
        email: booking.user?.email || booking.user_email || '',
        phone_number: booking.user?.phone_number || booking.user_phone || '',
      },
      slot: {
        date: firstSessionWasRescheduled
          ? firstSession?.date || booking.slot_date || booking.slot?.date || ''
          : booking.slot?.date || booking.slot_date || firstSession?.date || '',
        start_time: firstSessionWasRescheduled
          ? firstSession?.start_time || firstSession?.startTime || booking.slot_start_time || booking.slot?.start_time || ''
          : booking.slot?.start_time || booking.slot_start_time || firstSession?.start_time || firstSession?.startTime || '',
        end_time: firstSessionWasRescheduled
          ? firstSession?.end_time || firstSession?.endTime || booking.slot_end_time || booking.slot?.end_time || ''
          : booking.slot?.end_time || booking.slot_end_time || firstSession?.end_time || firstSession?.endTime || '',
        duration_minutes: booking.slot?.duration_minutes || 40,
      },
      session_type: booking.session_type,
      status: booking.status,
      notes: maySeeCareContext ? separatedNotes.clientNote : null,
      therapist_note_for_client: maySeeCareContext
        ? booking.therapist_note_for_client || separatedNotes.therapistNoteForClient
        : null,
      sessions_taken_before: booking.sessions_taken_before,
      payment_status: booking.payment_status,
      meeting_link: maySeeMeeting ? booking.meeting_link : null,
      meeting_links: maySeeMeeting ? booking.meeting_links : null,
      meeting_password: maySeeMeeting ? booking.meeting_password : null,
      created_at: booking.created_at,
      cancelled_at: booking.cancelled_at,
      number_of_sessions: booking.number_of_sessions,
      session_dates: booking.session_dates,
    };

    if (!isOwner) {
      try {
        await writeAudit({ userId: userData.id, actorRole: userData.role, action: maySeeCareContext ? 'BOOKING_SENSITIVE_DATA_VIEWED' : 'BOOKING_VIEWED', resourceType: 'booking', resourceId: booking.id, ipAddress: requestIp(request.headers), metadata: { careContextIncluded: maySeeCareContext } });
      } catch (auditError) {
        // A logging outage must not prevent an authorised user from opening a booking.
        console.error('Unable to write booking view audit log:', auditError);
      }
    }

    return NextResponse.json(formattedBooking);
  } catch (error) {
    console.error('❌ Get booking details error:', error);
    return NextResponse.json(
      { error: 'Failed to get booking details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const { bookingId } = await params;
  const body = await request.json().catch(() => null);
  const note = String(body?.therapistNoteForClient || '').trim();
  if (note.length > 2000) return NextResponse.json({ error: 'The note must be 2,000 characters or fewer.' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const [{ data: actor }, { data: booking }] = await Promise.all([
    supabase.from('users').select('id,role').eq('email', session.user.email).single(),
    supabase.from('bookings').select('id,slot_id,user_id,notes').eq('id', bookingId).single(),
  ]);
  if (!actor) return NextResponse.json({ error: 'User account not found' }, { status: 404 });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const isAdmin = actor?.role === 'admin';
  const isAssignedTherapist = actor.role === 'therapist' && (await therapistSlotIds(actor.id)).includes(booking.slot_id);
  if (!isAdmin && !isAssignedTherapist) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let { data, error } = await supabase
    .from('bookings')
    .update({ therapist_note_for_client: note || null })
    .eq('id', bookingId)
    .select('id,therapist_note_for_client')
    .single();

  // Older deployments may not have the dedicated therapist-note column yet.
  // Preserve both notes in bookings.notes until the migration is applied.
  if (error && isMissingTherapistNoteColumn(error)) {
    const separatedNotes = splitBookingNotes(booking.notes);
    const fallback = await supabase
      .from('bookings')
      .update({ notes: combineBookingNotes(separatedNotes.clientNote, note) })
      .eq('id', bookingId)
      .select('id')
      .single();
    data = fallback.data ? { ...fallback.data, therapist_note_for_client: note || null } : null;
    error = fallback.error;
  }
  if (error) return NextResponse.json({ error: 'Unable to save the note.' }, { status: 500 });

  try {
    await writeAudit({
      userId: actor.id,
      actorRole: actor.role,
      action: 'BOOKING_UPDATED',
      resourceType: 'booking',
      resourceId: bookingId,
      ipAddress: requestIp(request.headers),
      metadata: { change: 'THERAPIST_NOTE_FOR_CLIENT', cleared: !note },
    });
  } catch (auditError) {
    console.error('Unable to write booking update audit log:', auditError);
  }

  if (note) {
    try {
      const { data: client } = await supabase.from('users').select('email,name').eq('id', booking.user_id).single();
      if (client?.email) {
        await sendTherapistNoteNotificationEmail({
          clientEmail: client.email,
          clientName: client.name || 'Client',
          therapistName: session.user.name || 'Your therapist',
          profileUrl: new URL('/profile', request.url).toString(),
        });
      }
    } catch (emailError) {
      console.warn('Therapist note saved, but notification email failed:', emailError);
    }
  }
  return NextResponse.json({ booking: data });
}
