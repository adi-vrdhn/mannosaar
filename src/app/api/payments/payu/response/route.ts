import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createGoogleCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmationEmail } from '@/lib/email';
import {
  PayUBookingContext,
  PayUSessionDate,
  buildPayUResponseHash,
  decodePayUContext,
  getPayUConfig,
  normalizePayUAmount,
  verifyPayUPayment,
} from '@/lib/payu';

type ErrorField = 'code' | 'message' | 'details';

interface SlotData {
  id?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  therapist_id?: string | null;
}

function getRedirectUrl(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = new URL(pathname, request.url);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return url;
}

function getSafeRedirectTarget(value: string | null | undefined, baseUrl: string, fallback = '/appointment/payment') {
  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value, baseUrl);
    decodeURIComponent(url.search);
    return value;
  } catch {
    return fallback;
  }
}

function toStringMap(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === 'string' ? value : ''])
  ) as Record<string, string>;
}

function toSearchParamMap(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries()) as Record<string, string>;
}

function arePayUAmountsEqual(receivedAmount: string, expectedAmount: string) {
  return Number(receivedAmount).toFixed(2) === Number(expectedAmount).toFixed(2);
}

function getErrorField(error: unknown, field: ErrorField) {
  if (error && typeof error === 'object' && field in error) {
    return String((error as Record<string, unknown>)[field] || '');
  }

  return '';
}

function isMissingPayUContextTableError(error: unknown) {
  const code = getErrorField(error, 'code');
  const message = getErrorField(error, 'message');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes("Could not find the table 'public.payu_payment_contexts'") ||
    message.includes('schema cache')
  );
}

function parseSessionDatesParam(value?: string | null): PayUSessionDate[] {
  if (!value) {
    return [];
  }

  let attempt = value;

  for (let depth = 0; depth < 4; depth += 1) {
    const normalizedAttempt = attempt.replace(/\+/g, ' ');

    try {
      const parsed = JSON.parse(normalizedAttempt);

      if (Array.isArray(parsed)) {
        return normalizeSessionDates(parsed);
      }

      if (typeof parsed === 'string') {
        attempt = parsed;
        continue;
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        break;
      }
    }

    try {
      const decoded = decodeURIComponent(normalizedAttempt);
      if (decoded === attempt) {
        break;
      }

      attempt = decoded;
    } catch {
      break;
    }
  }

  return [];
}

function getContextFromReturnUrl(returnUrl: string, baseUrl: string): Partial<PayUBookingContext> {
  if (!returnUrl) {
    return {};
  }

  try {
    const url = new URL(returnUrl, baseUrl);
    const bundleValue = url.searchParams.get('bundle');
    const bundle = bundleValue ? Number.parseInt(bundleValue, 10) : null;

    return {
      returnUrl: url.toString(),
      sessionType: url.searchParams.get('type') || undefined,
      slotId: url.searchParams.get('slotId'),
      date: url.searchParams.get('date'),
      startTime: url.searchParams.get('startTime'),
      endTime: url.searchParams.get('endTime'),
      bundle: Number.isFinite(bundle) ? bundle : null,
      sessionDates: parseSessionDatesParam(url.searchParams.get('sessionDates')),
    };
  } catch (error) {
    console.warn('Unable to parse PayU return URL context:', error instanceof Error ? error.message : error);
    return {};
  }
}

function addMinutesToTime(time: string, minutes: number) {
  const [hour = '0', minute = '0', second = '0'] = time.split(':');
  const date = new Date(Date.UTC(2000, 0, 1, Number(hour), Number(minute), Number(second)));
  date.setUTCMinutes(date.getUTCMinutes() + minutes);

  return [
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
  ].join(':');
}

function normalizeSessionDates(value?: unknown[] | null): PayUSessionDate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((session) => {
      const sessionValue = session && typeof session === 'object' ? session as Record<string, unknown> : {};
      const date = String(sessionValue.date || '');
      const slotId = String(sessionValue.slotId || sessionValue.slot_id || '');
      const startTime = String(sessionValue.startTime || sessionValue.start_time || '');
      const endTime = String(
        sessionValue.endTime || sessionValue.end_time || (startTime ? addMinutesToTime(startTime, 60) : '')
      );

      return { date, slotId, startTime, endTime };
    })
    .filter((session) => session.date && session.slotId && session.startTime && session.endTime);
}

async function handlePayUResponse(request: NextRequest, payload: Record<string, string>) {
  try {
    const status = payload.status || '';
    const txnid = payload.txnid || '';
    const paymentId = payload.mihpayid || payload.txnid || '';
    const receivedHash = payload.hash || '';
    const amount = payload.amount || '';
    const productinfo = payload.productinfo || '';
    const decodedContext = decodePayUContext(payload.udf1);
    const rawInitialReturnUrl = payload.udf2 || '';
    const initialReturnUrl = getSafeRedirectTarget(rawInitialReturnUrl, request.url);

    const { key, salt } = getPayUConfig();
    if (!key || !salt) {
      return NextResponse.redirect(getRedirectUrl(request, initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'payment-not-configured',
      }), 303);
    }

    if (!status || !txnid || !paymentId || !receivedHash) {
      return NextResponse.redirect(getRedirectUrl(request, initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'missing-payment-details',
      }), 303);
    }

    const expectedHash = buildPayUResponseHash({
      key,
      txnid,
      amount,
      productinfo,
      firstname: payload.firstname || '',
      email: payload.email || '',
      status,
      udf1: payload.udf1,
      udf2: payload.udf2,
      udf3: payload.udf3,
      udf4: payload.udf4,
      udf5: payload.udf5,
      salt,
      additionalCharges: payload.additionalCharges,
    });

    if (expectedHash !== receivedHash.toLowerCase()) {
      return NextResponse.redirect(getRedirectUrl(request, initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'invalid-payment-signature',
      }), 303);
    }

    if (status !== 'success') {
      return NextResponse.redirect(getRedirectUrl(request, initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'payment-failed',
      }), 303);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let storedContext: PayUBookingContext | null = null;
    if (supabaseUrl && serviceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { data: contextRow, error: contextError } = await supabase
          .from('payu_payment_contexts')
          .select('context')
          .eq('txnid', txnid)
          .maybeSingle();

        if (contextError) {
          if (!isMissingPayUContextTableError(contextError)) {
            console.warn('Unable to fetch stored PayU context:', contextError);
          }
        } else if (contextRow?.context) {
          storedContext = contextRow.context as PayUBookingContext;
        }
      } catch (error) {
        if (!isMissingPayUContextTableError(error)) {
          console.warn('Unable to fetch stored PayU context:', error instanceof Error ? error.message : error);
        }
      }
    }

    const userContext = decodedContext || storedContext;
    const returnUrlContext = getContextFromReturnUrl(rawInitialReturnUrl || userContext?.returnUrl || '', request.url);
    const contextSessionDates = normalizeSessionDates(userContext?.sessionDates);
    const returnUrlSessionDates = normalizeSessionDates(returnUrlContext.sessionDates);
    const directSessionDate = normalizeSessionDates([
      {
        date: userContext?.date || returnUrlContext.date,
        slotId: userContext?.slotId || returnUrlContext.slotId || payload.udf5,
        startTime: userContext?.startTime || returnUrlContext.startTime,
        endTime: userContext?.endTime || returnUrlContext.endTime,
      },
    ]);
    const sessionDates =
      contextSessionDates.length > 0
        ? contextSessionDates
        : returnUrlSessionDates.length > 0
        ? returnUrlSessionDates
        : /bundle/i.test(productinfo) && directSessionDate.length > 0
        ? directSessionDate
        : [];
    const fallbackSingleSession = directSessionDate[0] || sessionDates[0];
    const returnUrl = getSafeRedirectTarget(
      returnUrlContext.returnUrl || userContext?.returnUrl || rawInitialReturnUrl,
      request.url,
      ''
    );
    const userEmail = payload.email || userContext?.userEmail || '';
    const userName = payload.firstname || userContext?.userName || '';
    const sessionType = userContext?.sessionType || payload.udf3 || returnUrlContext.sessionType || 'personal';
    const userId = userContext?.userId || payload.udf4 || '';
    const slotId = userContext?.slotId || returnUrlContext.slotId || payload.udf5 || fallbackSingleSession?.slotId || '';
    const slotDate = userContext?.date || returnUrlContext.date || fallbackSingleSession?.date || null;
    const slotStartTime = userContext?.startTime || returnUrlContext.startTime || fallbackSingleSession?.startTime || null;
    const slotEndTime = userContext?.endTime || returnUrlContext.endTime || fallbackSingleSession?.endTime || null;
    const userPhone = userContext?.userPhone || payload.phone || '';
    const notes = userContext?.notes || '';
    const expectedAmount = typeof userContext?.amount === 'number' ? normalizePayUAmount(userContext.amount) : '';

    console.log('PayU response received:', {
      status,
      txnid,
      paymentId,
      userId,
      userEmail,
      sessionType,
      slotDate,
      isBundleBooking: sessionDates.length > 0,
      hasStoredContext: !!storedContext,
      hasDecodedContext: !!decodedContext,
    });

    if (!userEmail || !userName || !userId) {
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'missing-payment-context',
      }), 303);
    }

    if (expectedAmount && !arePayUAmountsEqual(amount, expectedAmount)) {
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'amount-mismatch',
      }), 303);
    }

    const verifiedPayment = await verifyPayUPayment(txnid);
    if (!verifiedPayment.isSuccess || !verifiedPayment.transaction) {
      console.error('PayU verify payment failed:', {
        txnid,
        message: verifiedPayment.message,
        raw: verifiedPayment.raw,
      });
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'verification-failed',
      }), 303);
    }

    if (verifiedPayment.transaction.mihpayid && verifiedPayment.transaction.mihpayid !== paymentId) {
      console.error('PayU verify payment ID mismatch:', {
        txnid,
        callbackPaymentId: paymentId,
        verifiedPaymentId: verifiedPayment.transaction.mihpayid,
      });
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'payment-id-mismatch',
      }), 303);
    }

    if (
      verifiedPayment.transaction.amount &&
      expectedAmount &&
      !arePayUAmountsEqual(verifiedPayment.transaction.amount, expectedAmount)
    ) {
      console.error('PayU verify amount mismatch:', {
        txnid,
        callbackAmount: amount,
        expectedAmount,
        verifiedAmount: verifiedPayment.transaction.amount,
      });
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'verified-amount-mismatch',
      }), 303);
    }

    if (sessionType && sessionDates.length === 0 && !slotId && /bundle/i.test(productinfo)) {
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || initialReturnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'missing-bundle-session-data',
      }), 303);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'database-not-configured',
      }), 303);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (existingBooking?.id) {
      return NextResponse.redirect(getRedirectUrl(request, '/appointment/success', { bookingId: existingBooking.id }), 303);
    }

    const isBundleBooking = sessionDates.length > 0;
    let slotDataForCalendar: SlotData | null = null;

    const bookingPayload: Record<string, unknown> = {
      user_id: userId,
      session_type: sessionType,
      status: 'confirmed',
      payment_id: paymentId,
      payment_status: 'completed',
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      notes: notes || null,
    };

    if (isBundleBooking) {
      bookingPayload.number_of_sessions = sessionDates.length;
      bookingPayload.session_dates = sessionDates.map((session) => ({
        date: session.date,
        slot_id: session.slotId,
        start_time: session.startTime,
        end_time: session.endTime,
      }));

      if (sessionDates[0]) {
        bookingPayload.slot_id = sessionDates[0].slotId;
        bookingPayload.slot_date = sessionDates[0].date;
        bookingPayload.slot_start_time = sessionDates[0].startTime;
        bookingPayload.slot_end_time = sessionDates[0].endTime;
      }
    } else {
      let slotData: SlotData | null = null;

      if (slotId) {
        const { data: slotDataById, error: slotErrorById } = await supabase
          .from('therapy_slots')
          .select('*')
          .eq('id', slotId)
          .single();

        if (!slotErrorById && slotDataById) {
          slotData = slotDataById as SlotData;
          console.log('✅ Found PayU slot by ID:', slotId);
        } else {
          console.warn('⚠️ PayU slot lookup failed by ID:', slotId, slotErrorById);
        }
      }

      if (!slotData && slotDate && slotStartTime && slotEndTime) {
        const { data: fallbackSlotData, error: fallbackSlotError } = await supabase
          .from('therapy_slots')
          .select('*')
          .eq('date', slotDate)
          .eq('start_time', slotStartTime)
          .eq('end_time', slotEndTime)
          .single();

        if (!fallbackSlotError && fallbackSlotData) {
          slotData = fallbackSlotData as SlotData;
          console.log('✅ Recovered PayU slot by date/time fallback:', {
            slotDate,
            slotStartTime,
            slotEndTime,
          });
        } else {
          console.warn('⚠️ PayU slot lookup failed by date/time:', {
            slotDate,
            slotStartTime,
            slotEndTime,
            error: fallbackSlotError,
          });
        }
      }

      if (!slotData) {
        if (!slotDate || !slotStartTime || !slotEndTime) {
          console.error('❌ PayU: Missing slot data AND missing context date/time:', {
            slotId,
            slotDate,
            slotStartTime,
            slotEndTime,
          });
          return NextResponse.redirect(getRedirectUrl(request, returnUrl || '/appointment/payment', {
            paymentStatus: 'failed',
            paymentError: 'missing-slot-data',
          }), 303);
        }

        console.warn('⚠️ PayU creating slot fallback from context:', {
          slotId,
          slotDate,
          slotStartTime,
          slotEndTime,
        });
        slotData = {
          id: slotId,
          date: slotDate,
          start_time: slotStartTime,
          end_time: slotEndTime,
          therapist_id: 'default-therapist',
        };
      }

      slotDataForCalendar = slotData;
      bookingPayload.slot_id = slotData.id || slotId;
      bookingPayload.slot_date = slotData.date || slotDate;
      bookingPayload.slot_start_time = slotData.start_time || slotStartTime;
      bookingPayload.slot_end_time = slotData.end_time || slotEndTime;
    }

    const insertBooking = async (initialPayload: Record<string, unknown>) => {
      let payload = { ...initialPayload };

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const { data, error } = await supabase
          .from('bookings')
          .insert([payload])
          .select();

        if (!error) {
          return { data, error };
        }

        const errorCode = getErrorField(error, 'code');
        const errorMessage = getErrorField(error, 'message');
        const errorDetails = getErrorField(error, 'details');
        const missingColumnMatch =
          errorCode === 'PGRST204'
            ? errorMessage.match(/Could not find the '([^']+)' column/i)
            : null;
        const missingColumn = missingColumnMatch?.[1];

        if (missingColumn && missingColumn in payload) {
          console.warn(`⚠️ bookings.${missingColumn} is unavailable during PayU insert, retrying without the field`);
          const nextPayload = { ...payload };
          delete nextPayload[missingColumn];
          payload = nextPayload;
          continue;
        }

        const isSlotReferenceError =
          (errorCode === '23503' || errorMessage.toLowerCase().includes('foreign key')) &&
          'slot_id' in payload &&
          (
            errorMessage.includes('slot_id') ||
            errorDetails.includes('slot_id') ||
            errorMessage.includes('therapy_slots') ||
            errorDetails.includes('therapy_slots')
          );

        if (isSlotReferenceError) {
          console.warn('⚠️ bookings.slot_id reference is unavailable during PayU insert, retrying without slot_id');
          const nextPayload = { ...payload };
          delete nextPayload.slot_id;
          payload = nextPayload;
          continue;
        }

        const isNullableSlotRequired =
          errorCode === '23502' &&
          errorMessage.includes('slot_id') &&
          !payload.slot_id &&
          (bookingPayload.slot_id || sessionDates[0]?.slotId || slotId);

        if (isNullableSlotRequired) {
          payload.slot_id = bookingPayload.slot_id || sessionDates[0]?.slotId || slotId;
          continue;
        }

        if (!missingColumn || !(missingColumn in payload)) {
          return { data, error };
        }
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select();

      return { data, error };
    };

    const { data: bookingData, error: bookingError } = await insertBooking(bookingPayload);
    const booking = bookingData?.[0];

    if (bookingError || !booking) {
      console.error('❌ PayU booking insert failed:', {
        error: bookingError,
        booking,
        payload: bookingPayload,
        isBundleBooking,
        hasSlotData: !!slotDataForCalendar,
      });
      return NextResponse.redirect(getRedirectUrl(request, returnUrl || '/appointment/payment', {
        paymentStatus: 'failed',
        paymentError: 'booking-create-failed',
      }), 303);
    }

    const meetingLinks: string[] = [];
    let googleCalendarEventId = booking.google_calendar_event_id || '';
    const calendarTherapistId = 'default-therapist';
    const notificationSlot =
      !isBundleBooking && slotDataForCalendar?.date && slotDataForCalendar.start_time && slotDataForCalendar.end_time
        ? {
            date: slotDataForCalendar.date,
            startTime: slotDataForCalendar.start_time,
            endTime: slotDataForCalendar.end_time,
          }
        : null;

    try {
      if (isBundleBooking) {
        for (const [index, session] of sessionDates.entries()) {
          try {
            const calendarResult = await createGoogleCalendarEvent(
              calendarTherapistId,
              userEmail,
              userName,
              session.date,
              session.startTime,
              session.endTime,
              sessionType
            );

            if (calendarResult?.meetLink) {
              meetingLinks.push(calendarResult.meetLink);
              googleCalendarEventId = calendarResult.eventId || googleCalendarEventId;
            }
          } catch (sessionError) {
            console.warn('Failed to create calendar event for PayU bundle session:', sessionError);
          }
        }
      } else if (notificationSlot) {
        const calendarResult = await createGoogleCalendarEvent(
          calendarTherapistId,
          userEmail,
          userName,
          notificationSlot.date,
          notificationSlot.startTime,
          notificationSlot.endTime,
          sessionType
        );

        if (calendarResult?.meetLink) {
          meetingLinks.push(calendarResult.meetLink);
          googleCalendarEventId = calendarResult.eventId || googleCalendarEventId;
        }
      }

      if (meetingLinks.length > 0) {
        const updatePayload: Record<string, unknown> = isBundleBooking && meetingLinks.length > 1
          ? { meeting_links: meetingLinks, meeting_link: meetingLinks[0] }
          : { meeting_link: meetingLinks[0] };

        if (googleCalendarEventId) {
          updatePayload.google_calendar_event_id = googleCalendarEventId;
        }

        const { data: updatedBooking } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', booking.id)
          .select()
          .single();

        if (updatedBooking) {
          Object.assign(booking, updatedBooking);
        }
      }

      const therapistId = slotDataForCalendar?.therapist_id || calendarTherapistId;
      const { data: therapistData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', therapistId)
        .single();

      await sendBookingConfirmationEmail({
        clientEmail: userEmail,
        clientName: userName,
        therapistEmail: therapistData?.email || process.env.THERAPIST_EMAIL || process.env.EMAIL_USER || '',
        therapistName: therapistData?.name || 'Therapist',
        sessionType,
        date: isBundleBooking ? `${sessionDates.length} sessions scheduled` : notificationSlot?.date || 'Session scheduled',
        startTime: isBundleBooking ? 'Varies' : notificationSlot?.startTime || 'Varies',
        endTime: isBundleBooking ? 'Varies' : notificationSlot?.endTime || 'Varies',
        sessionSchedule: isBundleBooking
          ? sessionDates.map((session) => ({
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
            }))
          : notificationSlot
          ? [
              {
                date: notificationSlot.date,
                startTime: notificationSlot.startTime,
                endTime: notificationSlot.endTime,
              },
            ]
          : [],
        meetingLink: meetingLinks[0] || '',
      });
    } catch (processingError) {
      console.error('PayU calendar/email processing failed:', processingError);
    }

    if (isBundleBooking) {
      for (const session of sessionDates) {
        await supabase
          .from('therapy_slots')
          .update({ is_available: false })
          .eq('id', session.slotId);
      }
    } else if (slotDataForCalendar?.id || slotId) {
      await supabase
        .from('therapy_slots')
        .update({ is_available: false })
        .eq('id', slotDataForCalendar?.id || slotId);
    }

    return NextResponse.redirect(getRedirectUrl(request, '/appointment/success', { bookingId: booking.id }), 303);
  } catch (error) {
    console.error('PayU response processing error:', error);
    return NextResponse.redirect(getRedirectUrl(request, '/appointment/payment', {
      paymentStatus: 'failed',
      paymentError: 'payment-processing-error',
    }), 303);
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      throw new Error('PayU response expects form data');
    }

    return handlePayUResponse(request, toStringMap(await request.formData()));
  } catch (error) {
    console.error('PayU POST response parsing error:', error);
    return NextResponse.redirect(getRedirectUrl(request, '/appointment/payment', {
      paymentStatus: 'failed',
      paymentError: 'payment-processing-error',
    }), 303);
  }
}

export async function GET(request: NextRequest) {
  return handlePayUResponse(request, toSearchParamMap(new URL(request.url).searchParams));
}
