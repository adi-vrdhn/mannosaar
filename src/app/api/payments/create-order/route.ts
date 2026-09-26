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
    if (priceError || !officialPrice || Number(officialPrice.price).toFixed(2) !== Number(amount).toFixed(2)) {
      return NextResponse.json({ error: 'The booking price changed. Refresh and review the current price.' }, { status: 409 });
    }

    const callbackUrl = new URL('/api/payments/payu/response', request.url).toString();

    const sharedPayload = {
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
      s2sClientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '',
      s2sDeviceInfo: request.headers.get('user-agent') || '',
      callbackUrl,
      consentReceiptId,
    };

    if (isSmartIntentMode(paymentMode)) {
      const payment = createPayUPaymentFields(sharedPayload);
      payment.fields.surl = callbackUrl;
      payment.fields.furl = callbackUrl;

      await persistPayUContext({
        ...sharedPayload,
        paymentTxnId: payment.txnid,
      });

      return NextResponse.json(await initiateSmartIntentPayment(payment));
    }

    const hostedCheckout = createPayUPaymentHtml({
      ...sharedPayload,
    });

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
