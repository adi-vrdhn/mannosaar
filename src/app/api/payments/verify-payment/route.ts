import { NextRequest, NextResponse } from 'next/server';
import { normalizePayUAmount, verifyPayUPayment } from '@/lib/payu';
import { auth } from '@/lib/auth';
import { isSameOrigin } from '@/lib/compliance';
import { check, db } from '@/lib/whatsapp/server';
import { allowRequest } from '@/lib/compliance-server';

interface VerifyPaymentRequestBody {
  expectedAmount?: number;
  expectedPaymentId?: string;
  txnid?: string;
}

function amountsMatch(actualAmount: string, expectedAmount?: number) {
  if (expectedAmount == null) {
    return true;
  }

  return Number(actualAmount).toFixed(2) === normalizePayUAmount(expectedAmount);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    if (!(await allowRequest('payment-verify', session.user.id, 30, 60))) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    const body = (await request.json()) as VerifyPaymentRequestBody;
    const txnid = typeof body.txnid === 'string' ? body.txnid.trim() : '';

    if (!txnid) {
      return NextResponse.json({ error: 'txnid is required' }, { status: 400 });
    }

    const context = await db().from('payu_payment_contexts').select('context').eq('txnid', txnid).maybeSingle();
    check(context.error);
    const ownerId = context.data?.context?.userId;
    if (!ownerId) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (ownerId !== session.user.id && session.user.role !== 'admin' && session.user.role !== 'finance') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const verification = await verifyPayUPayment(txnid);

    if (!verification.transaction) {
      return NextResponse.json(
        {
          error: verification.message || 'Unable to verify PayU payment',
        },
        { status: 502 }
      );
    }

    const paymentIdMatches =
      !body.expectedPaymentId ||
      verification.transaction.mihpayid === body.expectedPaymentId;
    const amountMatches = amountsMatch(verification.transaction.amount, body.expectedAmount);

    return NextResponse.json({
      amountMatches,
      isSuccess: verification.isSuccess,
      message: verification.message,
      paymentIdMatches,
      transaction: {
        amount: verification.transaction.amount,
        status: verification.transaction.status,
        txnid: verification.transaction.txnid,
      },
    });
  } catch (error) {
    console.error('Error verifying PayU payment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown verification error',
      },
      { status: 500 }
    );
  }
}
