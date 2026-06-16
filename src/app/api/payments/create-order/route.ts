import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PayUPaymentMode, PayUSessionDate, createPayUPaymentFields } from '@/lib/payu';

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
  vpa?: string;
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
      vpa,
    } = body;

    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const s2sClientIp = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';
    const s2sDeviceInfo = request.headers.get('user-agent') || '';

    const normalizedVpa = typeof vpa === 'string' ? vpa.trim().toLowerCase() : '';

    console.log('Create PayU request:', {
      amount,
      sessionType,
      userEmail,
      userId,
      slotId,
      date,
      bundle,
      paymentMode,
      hasVpa: Boolean(normalizedVpa),
    });

    if (!amount || !sessionType || !userEmail || !userId || !userName) {
      console.error('Missing required fields:', { amount, sessionType, userEmail, userId, userName });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (paymentMode === 'upi' && !normalizedVpa) {
      return NextResponse.json(
        { error: 'UPI ID is required for UPI payments' },
        { status: 400 }
      );
    }

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
      vpa: normalizedVpa || undefined,
      s2sClientIp,
      s2sDeviceInfo,
    });

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
                paymentMode: paymentMode || 'auto',
                s2sClientIp: s2sClientIp || null,
                s2sDeviceInfo: s2sDeviceInfo || null,
                sessionDates: sessionDates || [],
                sessionType,
                slotId: slotId || null,
                userEmail,
                userId,
                userName,
                userPhone: userPhone || null,
                vpa: normalizedVpa || null,
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

    const callbackUrl = new URL('/api/payments/payu/response', request.url).toString();
    payment.fields.surl = callbackUrl;
    payment.fields.furl = callbackUrl;

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating PayU payment payload:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create PayU payment payload: ${errorMsg}` },
      { status: 500 }
    );
  }
}
