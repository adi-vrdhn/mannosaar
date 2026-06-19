import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  PayUPaymentMode,
  PayUSessionDate,
  PayUUpiAppName,
  createPayUPaymentFields,
} from '@/lib/payu';

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
  sessionDates?: PayUSessionDate[];
  notes?: string;
  returnUrl?: string;
  paymentMode?: PayUPaymentMode;
  upiAppName?: PayUUpiAppName;
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

export async function POST(request: NextRequest) {
  try {
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
      sessionDates,
      notes,
      returnUrl,
      paymentMode,
      upiAppName,
    } = body;

    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const s2sClientIp = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';
    const s2sDeviceInfo = request.headers.get('user-agent') || '';

    console.log('Create PayU request:', {
      amount,
      sessionType,
      userEmail,
      userId,
      slotId,
      date,
      bundle,
      paymentMode,
      upiAppName: upiAppName || null,
    });

    if (!amount || !sessionType || !userEmail || !userId || !userName) {
      console.error('Missing required fields:', { amount, sessionType, userEmail, userId, userName });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const callbackUrl = new URL('/api/payments/payu/response', request.url).toString();

    const payment = createPayUPaymentFields({
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
      sessionDates,
      notes,
      returnUrl,
      paymentMode,
      s2sClientIp,
      s2sDeviceInfo,
      upiAppName,
    });

    payment.fields.surl = callbackUrl;
    payment.fields.furl = callbackUrl;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { error: contextError } = await supabase
          .from('payu_payment_contexts')
          .upsert(
            {
              txnid: payment.txnid,
              context: {
                amount,
                bundle: bundle || null,
                date: date || null,
                startTime: startTime || null,
                endTime: endTime || null,
                notes: notes || null,
                returnUrl: returnUrl || null,
                paymentMode: payment.paymentMode,
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
              },
            },
            { onConflict: 'txnid' }
          );

        if (contextError) {
          if (!isMissingPayUContextTableError(contextError)) {
            console.warn('Unable to persist PayU payment context:', contextError.message);
          }
        }
      } catch (error) {
        if (!isMissingPayUContextTableError(error)) {
          console.warn('Unable to persist PayU payment context:', error instanceof Error ? error.message : error);
        }
      }
    }

    if (isSmartIntentMode(payment.paymentMode)) {
      return NextResponse.json(await initiateSmartIntentPayment(payment));
    }

    return NextResponse.json({
      flow: 'hosted_checkout',
      paymentUrl: payment.paymentUrl,
      fields: payment.fields,
      txnid: payment.txnid,
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
