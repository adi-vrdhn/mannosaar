import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSessionReminderEmail } from '@/lib/email';
import { getTherapistNotificationRecipients } from '@/lib/therapist-email';

type SessionReminderState = {
  client?: string;
  therapist?: string;
};

type ReminderStateBySession = Record<string, SessionReminderState>;

type Relation<T> = T | T[] | null | undefined;

type BookingRecord = {
  id: string;
  session_type: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  meeting_link?: string | null;
  meeting_links?: string[] | null;
  slot_id?: string | null;
  slot_date?: string | null;
  slot_start_time?: string | null;
  slot_end_time?: string | null;
  session_dates?: Array<{
    date: string;
    start_time?: string;
    startTime?: string;
    end_time?: string;
    endTime?: string;
    slot_id?: string;
    slotId?: string;
  }> | null;
  session_reminders_sent?: ReminderStateBySession | null;
  user?: Relation<{
    id: string;
    email: string | null;
    name: string | null;
  }>;
  slot?: Relation<{
    id: string;
    therapist_id: string | null;
  }>;
};

type TherapistRecord = {
  id: string;
  email: string | null;
  name: string | null;
};

const REMINDER_WINDOW_MINUTES = 60;
const REMINDER_TOLERANCE_MINUTES = 10;

function getServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function normalizeReminderState(value: unknown): ReminderStateBySession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ReminderStateBySession;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function getSessionEntries(booking: BookingRecord) {
  if (Array.isArray(booking.session_dates) && booking.session_dates.length > 0) {
    return booking.session_dates
      .map((session, index) => {
        const date = session.date;
        const startTime = session.start_time || session.startTime;
        const endTime = session.end_time || session.endTime;
        const sessionKey = session.slot_id || session.slotId || `${date}|${startTime}`;

        if (!date || !startTime || !endTime) {
          return null;
        }

        return {
          index,
          sessionKey,
          date,
          startTime,
          endTime,
        };
      })
      .filter(Boolean) as Array<{
      index: number;
      sessionKey: string;
      date: string;
      startTime: string;
      endTime: string;
    }>;
  }

  if (!booking.slot_date || !booking.slot_start_time || !booking.slot_end_time) {
    return [];
  }

  return [
    {
      index: 0,
      sessionKey: booking.slot_id || `${booking.slot_date}|${booking.slot_start_time}`,
      date: booking.slot_date,
      startTime: booking.slot_start_time,
      endTime: booking.slot_end_time,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabaseClient();
    const now = new Date();

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        session_type,
        user_id,
        user_name,
        user_email,
        meeting_link,
        meeting_links,
        slot_id,
        slot_date,
        slot_start_time,
        slot_end_time,
        session_dates,
        session_reminders_sent,
        user:users(id, email, name),
        slot:therapy_slots(id, therapist_id)
      `
      )
      .eq('status', 'confirmed');

    if (error) {
      console.error('Error fetching bookings for reminder:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings to remind',
        remindersSent: 0,
      });
    }

    const therapistCache = new Map<string, TherapistRecord>();
    const results: Array<{
      bookingId: string;
      sessionKey: string;
      clientSent: boolean;
      therapistSent: boolean;
      minutesUntil: number;
    }> = [];

    for (const booking of bookings as BookingRecord[]) {
      try {
        const bookingUser = firstRelation(booking.user);
        const bookingSlot = firstRelation(booking.slot);
        const clientName = booking.user_name || bookingUser?.name || 'Client';
        const clientEmail = booking.user_email || bookingUser?.email || '';
        const therapistId = bookingSlot?.therapist_id;

        if (!clientEmail) {
          console.log(`⚠️ Booking ${booking.id} has no client email`);
          continue;
        }

        let therapist: TherapistRecord | null = null;
        if (therapistId) {
          if (therapistCache.has(therapistId)) {
            therapist = therapistCache.get(therapistId) || null;
          } else {
            const { data: therapistData, error: therapistError } = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', therapistId)
              .single();

            if (therapistError) {
              console.warn(`⚠️ Could not load therapist ${therapistId}:`, therapistError.message);
            } else if (therapistData) {
              therapist = therapistData as TherapistRecord;
              therapistCache.set(therapistId, therapist);
            }
          }
        }

        const therapistEmail = getTherapistNotificationRecipients(
          therapist?.email
        );
        const therapistName = therapist?.name || 'Therapist';
        const sessionStates = normalizeReminderState(booking.session_reminders_sent);
        const sessions = getSessionEntries(booking);

        if (sessions.length === 0) {
          console.log(`⚠️ Booking ${booking.id} has no session entries to remind`);
          continue;
        }

        for (const session of sessions) {
          const sessionStart = new Date(`${session.date}T${session.startTime}`);
          if (Number.isNaN(sessionStart.getTime())) {
            console.warn(`⚠️ Invalid session date/time for booking ${booking.id}:`, session);
            continue;
          }

          const minutesUntil = Math.round((sessionStart.getTime() - now.getTime()) / (1000 * 60));
          if (minutesUntil < (REMINDER_WINDOW_MINUTES - REMINDER_TOLERANCE_MINUTES) || minutesUntil > (REMINDER_WINDOW_MINUTES + REMINDER_TOLERANCE_MINUTES)) {
            continue;
          }

          const currentState = sessionStates[session.sessionKey] || {};
          let clientSent = !!currentState.client;
          let therapistSent = !!currentState.therapist;

          const meetingLink =
            Array.isArray(booking.meeting_links) && booking.meeting_links.length > session.index
              ? booking.meeting_links[session.index]
              : booking.meeting_link || undefined;

          if (!clientSent) {
            clientSent = await sendSessionReminderEmail({
              recipientType: 'client',
              recipientEmail: clientEmail,
              clientName,
              therapistName,
              sessionType: booking.session_type || 'Therapy Session',
              date: session.date,
              startTime: formatTime(session.startTime),
              endTime: formatTime(session.endTime),
              meetingLink,
              sessionNumber: sessions.length > 1 ? session.index + 1 : undefined,
              totalSessions: sessions.length > 1 ? sessions.length : undefined,
            });
          }

          if (!therapistSent && therapistEmail.length > 0) {
            therapistSent = await sendSessionReminderEmail({
              recipientType: 'therapist',
              recipientEmail: therapistEmail,
              clientName,
              therapistName,
              sessionType: booking.session_type || 'Therapy Session',
              date: session.date,
              startTime: formatTime(session.startTime),
              endTime: formatTime(session.endTime),
              meetingLink,
              sessionNumber: sessions.length > 1 ? session.index + 1 : undefined,
              totalSessions: sessions.length > 1 ? sessions.length : undefined,
            });
          }

          const nextState = {
            ...sessionStates,
            [session.sessionKey]: {
              ...(sessionStates[session.sessionKey] || {}),
              ...(clientSent ? { client: new Date().toISOString() } : {}),
              ...(therapistSent ? { therapist: new Date().toISOString() } : {}),
            },
          };

          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              session_reminders_sent: nextState,
              reminder_sent_at: new Date().toISOString(),
            })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`Error updating reminder state for booking ${booking.id}:`, updateError);
          } else {
            sessionStates[session.sessionKey] = nextState[session.sessionKey];
          }

          results.push({
            bookingId: booking.id,
            sessionKey: session.sessionKey,
            clientSent,
            therapistSent,
            minutesUntil,
          });
        }
      } catch (bookingError) {
        console.error(`Error processing booking ${booking.id}:`, bookingError);
      }
    }

    const sessionsProcessed = results.length;
    const clientEmailsSent = results.filter((result) => result.clientSent).length;
    const therapistEmailsSent = results.filter((result) => result.therapistSent).length;

    return NextResponse.json({
      success: true,
      remindersSent: sessionsProcessed,
      clientEmailsSent,
      therapistEmailsSent,
      totalProcessed: sessionsProcessed,
      windowMinutes: REMINDER_WINDOW_MINUTES,
      toleranceMinutes: REMINDER_TOLERANCE_MINUTES,
      results,
    });
  } catch (error) {
    console.error('Error in POST /api/bookings/send-reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
