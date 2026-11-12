import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  PayUPaymentMode,
  PayUSessionDate,
  PayUUpiAppName,
  createPayUPaymentHtml,
  createPayUPaymentFields,
} from '@/lib/payu';
import { auth } from '@/lib/auth';
import { isSameOrigin } from '@/lib/compliance';
import { allowRequest, validateConsentReceipt } from '@/lib/compliance-server';
import { sessionEndTime } from '@/lib/services';
import { getPricingSnapshot } from '@/lib/pricing';
import { overlaps, slotEndInstant, slotInstant } from '@/lib/whatsapp/core';

interface CreatePayUOrderBody {
  amount?: number;
  sessionType?: string;
  userEmail?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  slotId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  bundle?: number;
  bundleSchedule?: 'all' | 'progressive';
  sessionDates?: PayUSessionDate[];
  notes?: string;
  returnUrl?: string;
  paymentMode?: PayUPaymentMode;
  upiAppName?: PayUUpiAppName;
  consentReceiptId?: string;
}

interface PayUSmartIntentResponse {
  metaData?: {
    message?: string | null;
    statusCode?: string | null;
    txnId?: string;
    txnStatus?: string;
    unmappedStatus?: string;
  };
  result?: {
    acsTemplate?: string;
    amount?: string;
    intentURIData?: string;
    merchantName?: string;
    merchantVpa?: string;
    otpPostUrl?: string;
    paymentId?: string;
  };
}

function getErrorField(error: unknown, field: 'code' | 'message') {
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

function isSmartIntentMode(paymentMode?: PayUPaymentMode) {
  return paymentMode === 'upi_intent' || paymentMode === 'upi_qr';
}

function parsePayUSmartIntentResponse(responseText: string) {
  try {
    return JSON.parse(responseText) as PayUSmartIntentResponse;
  } catch {
    return null;
  }
}

async function initiateSmartIntentPayment(payment: ReturnType<typeof createPayUPaymentFields>) {
  const response = await fetch(payment.paymentUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(payment.fields).toString(),
  });

  const responseText = await response.text();
  const parsed = parsePayUSmartIntentResponse(responseText);
  const intentUriData = parsed?.result?.intentURIData || '';
  const txnStatus = parsed?.metaData?.txnStatus || '';
  const unmappedStatus = parsed?.metaData?.unmappedStatus || '';
  const providerMessage = parsed?.metaData?.message || parsed?.metaData?.statusCode || '';

  if (!response.ok) {
    throw new Error(providerMessage || `PayU Smart Intent request failed with status ${response.status}`);
  }

  if (!parsed) {
    throw new Error('PayU Smart Intent returned a non-JSON response');
  }

  if (!intentUriData || unmappedStatus.toLowerCase() !== 'pending') {
    throw new Error(providerMessage || txnStatus || 'PayU did not return a valid intent payload');
  }

  return {
    acsTemplate: parsed.result?.acsTemplate || '',
    deepLink: `upi://pay?${intentUriData}`,
    flow: payment.paymentMode,
    intentUriData,
    merchantName: parsed.result?.merchantName || '',
    merchantVpa: parsed.result?.merchantVpa || '',
    otpPostUrl: parsed.result?.otpPostUrl || '',
    paymentId: parsed.result?.paymentId || '',
    txnid: payment.txnid,
  };
}

async function persistPayUContext(
  request: CreatePayUOrderBody & {
    paymentTxnId: string;
    s2sClientIp?: string;
    s2sDeviceInfo?: string;
  }
) {
  const {
    amount,
    bundle,
    bundleSchedule,
    date,
    notes,
    returnUrl,
    paymentMode,
    paymentTxnId,
    sessionDates,
    sessionType,
    slotId,
    startTime,
    endTime,
    s2sClientIp,
    s2sDeviceInfo,
    upiAppName,
    userEmail,
    userId,
    userName,
    userPhone,
    consentReceiptId,
  } = request;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error: contextError } = await supabase
      .from('payu_payment_contexts')
      .upsert(
        {
          txnid: paymentTxnId,
          context: {
            amount,
            bundle: bundle || null,
            bundleSchedule: bundleSchedule || 'all',
            date: date || null,
            startTime: startTime || null,
            endTime: endTime || null,
            notes: notes || null,
            returnUrl: returnUrl || null,
            paymentMode: paymentMode || 'auto',
            s2sClientIp: s2sClientIp || null,
            s2sDeviceInfo: s2sDeviceInfo || null,
            sessionDates: sessionDates || [],
            sessionType,
            slotId: slotId || null,
            upiAppName: upiAppName || null,
            userEmail,
            userId,
            userName,
            userPhone: userPhone || null,
            consentReceiptId: consentReceiptId || null,
          },
        },
        { onConflict: 'txnid' }
      );

    if (contextError && !isMissingPayUContextTableError(contextError)) {
      console.warn('Unable to persist PayU payment context:', contextError.message);
    }
  } catch (error) {
    if (!isMissingPayUContextTableError(error)) {
      console.warn('Unable to persist PayU payment context:', error instanceof Error ? error.message : error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    if (!(await allowRequest('payment-order', session.user.id, 10, 60))) return NextResponse.json({ error: 'Too many payment attempts. Please try again shortly.' }, { status: 429 });
    const requestText = await request.text();

    if (!requestText.trim()) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
    }

    let body: CreatePayUOrderBody;
    try {
      body = JSON.parse(requestText) as CreatePayUOrderBody;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
      amount,
      sessionType,
      userEmail,
      userId,
      userName,
      userPhone,
      slotId,
      date,
      startTime,
      endTime,
      bundle,
      bundleSchedule,
      sessionDates,
      notes,
      returnUrl,
      paymentMode,
      upiAppName,
      consentReceiptId,
    } = body;

    if (!amount || !sessionType || !userEmail || !userId || !userName || !consentReceiptId) {
      console.error('Missing required fields for PayU order');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (userId !== session.user.id || userEmail.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['personal', 'couple'].includes(sessionType) || !(await validateConsentReceipt(consentReceiptId, userId))) {
      return NextResponse.json({ error: 'Valid booking consent is required.' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const bundleSize = Number(bundle || (Array.isArray(sessionDates) ? sessionDates.length : 0) || 1);
    const { data: officialPrice, error: priceError } = await supabase.from('pricing_config').select('price,currency').eq('session_type', sessionType).eq('bundle_size', bundleSize).eq('currency', 'INR').single();
    const snapshot = await getPricingSnapshot(userId);
    const usingFirstSessionOffer = bundleSize === 1
      && (sessionType === 'personal' || sessionType === 'couple')
      && snapshot.offers[sessionType].eligible;
    const expectedPrice = usingFirstSessionOffer && (sessionType === 'personal' || sessionType === 'couple')
      ? snapshot.offers[sessionType].offerPrice
      : Number(officialPrice?.price);
    if (priceError || !officialPrice || Number(expectedPrice).toFixed(2) !== Number(amount).toFixed(2)) {
      return NextResponse.json({ error: 'The booking price changed. Refresh and review the current price.' }, { status: 409 });
    }

    const requestedIds = Array.isArray(sessionDates) && sessionDates.length
      ? sessionDates.map(entry => entry.slotId)
      : slotId ? [slotId] : [];
    if (!requestedIds.length || requestedIds.length > 12 || new Set(requestedIds).size !== requestedIds.length || requestedIds.some(id => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))) {
      return NextResponse.json({ error: 'Select a valid appointment time.' }, { status: 400 });
    }
    const selectedSlots = await supabase.from('therapy_slots').select('id,date,start_time,end_time,is_available,is_blocked,therapist_id').in('id', requestedIds);
    if (selectedSlots.error || selectedSlots.data?.length !== requestedIds.length || selectedSlots.data.some(slot => !slot.is_available || slot.is_blocked || !sessionEndTime(slot.start_time, sessionType))) {
      return NextResponse.json({ error: 'The selected time is no longer available for this session duration.' }, { status: 409 });
    }
    const existingBookings = await supabase.from('bookings').select('slot_id,slot_date,slot_start_time,slot_end_time,session_type,session_dates,slot:therapy_slots(therapist_id)').eq('status', 'confirmed');
    if (existingBookings.error) return NextResponse.json({ error: 'Unable to verify appointment availability.' }, { status: 503 });
    const occupied = (existingBookings.data || []).flatMap(booking => {
      const relation = Array.isArray(booking.slot) ? booking.slot[0] : booking.slot;
      const therapistId = relation?.therapist_id;
      if (!therapistId) return [];
      const dates = Array.isArray(booking.session_dates) && booking.session_dates.length
        ? booking.session_dates as Array<{ date: string; start_time: string; end_time?: string }>
        : [{ date: booking.slot_date, start_time: booking.slot_start_time, end_time: booking.slot_end_time }];
      return dates.flatMap(entry => {
        const end = entry.end_time || sessionEndTime(entry.start_time, booking.session_type);
        return entry.date && entry.start_time && end
          ? [{ therapistId, start: slotInstant(entry.date, entry.start_time), end: slotEndInstant(entry.date, entry.start_time, end) }]
          : [];
      });
    });
    if (selectedSlots.data.some(slot => occupied.some(booking => booking.therapistId === slot.therapist_id && overlaps(
      { start: slotInstant(slot.date, slot.start_time), end: slotEndInstant(slot.date, slot.start_time, sessionEndTime(slot.start_time, sessionType)!) }, booking
    )))) return NextResponse.json({ error: 'The selected time is no longer available.' }, { status: 409 });
    const occupiedChecks = await Promise.all(selectedSlots.data.map(slot => supabase.from('booking_reservations').select('id,hold:booking_holds(status,expires_at)').eq('therapist_id', slot.therapist_id).overlaps('span', `[${slotInstant(slot.date, slot.start_time)},${slotEndInstant(slot.date, slot.start_time, sessionEndTime(slot.start_time, sessionType)!)})`).limit(10)));
    const missingReservations = occupiedChecks.every(check => check.error?.code === 'PGRST205' || check.error?.code === '42P01');
    if (!missingReservations && occupiedChecks.some(check => check.error || (check.data || []).some(reservation => {
      const hold = Array.isArray(reservation.hold) ? reservation.hold[0] : reservation.hold;
      return !hold || (hold.status === 'ACTIVE' && Date.parse(hold.expires_at) > Date.now());
    }))) return NextResponse.json({ error: 'The selected time is no longer available.' }, { status: 409 });
    const byId = new Map(selectedSlots.data.map(slot => [slot.id, slot]));
    const canonicalDates = Array.isArray(sessionDates) && sessionDates.length
      ? sessionDates.map(entry => ({ date: byId.get(entry.slotId)!.date, slotId: entry.slotId, startTime: byId.get(entry.slotId)!.start_time, endTime: sessionEndTime(byId.get(entry.slotId)!.start_time, sessionType)! }))
      : undefined;
    const canonicalSingle = slotId ? byId.get(slotId) : null;

    const callbackUrl = new URL('/api/payments/payu/response', request.url).toString();

    const sharedPayload = {
      amount,
      sessionType,
      userEmail,
      userId,
      userName,
      userPhone,
      slotId,
      date: canonicalSingle?.date || date,
      startTime: canonicalSingle?.start_time || startTime,
      endTime: canonicalSingle ? sessionEndTime(canonicalSingle.start_time, sessionType)! : endTime,
      bundle,
      bundleSchedule,
      sessionDates: canonicalDates,
      notes,
      returnUrl,
      paymentMode,
      upiAppName,
      s2sClientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '',
      s2sDeviceInfo: request.headers.get('user-agent') || '',
      callbackUrl,
      consentReceiptId,
    };

    const claimOffer = async (txnid: string) => {
      if (!usingFirstSessionOffer) return true;
      const { data, error } = await supabase.rpc('claim_first_session_offer', {
        p_user_id: userId,
        p_session_type: sessionType,
        p_txnid: txnid,
        p_price: amount,
      });
      if (error) console.error('Could not claim first-session offer:', error);
      return !error && data === true;
    };

    if (isSmartIntentMode(paymentMode)) {
      const payment = createPayUPaymentFields(sharedPayload);
      if (!(await claimOffer(payment.txnid))) return NextResponse.json({ error: 'This first-session offer is already in use. Refresh the booking price.' }, { status: 409 });
      payment.fields.surl = callbackUrl;
      payment.fields.furl = callbackUrl;

      await persistPayUContext({
        ...sharedPayload,
        paymentTxnId: payment.txnid,
      });

      try {
        return NextResponse.json(await initiateSmartIntentPayment(payment));
      } catch (error) {
        if (usingFirstSessionOffer) await supabase.from('first_session_offer_claims').delete().eq('txnid', payment.txnid);
        throw error;
      }
    }

    const hostedCheckout = createPayUPaymentHtml({
      ...sharedPayload,
    });
    if (!(await claimOffer(hostedCheckout.txnid))) return NextResponse.json({ error: 'This first-session offer is already in use. Refresh the booking price.' }, { status: 409 });

    await persistPayUContext({
      ...sharedPayload,
      paymentTxnId: hostedCheckout.txnid,
    });

    return NextResponse.json({
      flow: 'hosted_checkout',
      paymentHtml: hostedCheckout.paymentHtml,
      txnid: hostedCheckout.txnid,
    });
  } catch (error) {
    console.error('Error creating PayU payment payload:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create PayU payment payload: ${errorMsg}` },
      { status: 500 }
    );
  }
}
