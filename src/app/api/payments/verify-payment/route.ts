import { NextRequest, NextResponse } from 'next/server';
import { normalizePayUAmount, verifyPayUPayment } from '@/lib/payu';

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
    const body = (await request.json()) as VerifyPaymentRequestBody;
    const txnid = typeof body.txnid === 'string' ? body.txnid.trim() : '';

    if (!txnid) {
      return NextResponse.json({ error: 'txnid is required' }, { status: 400 });
    }

    const verification = await verifyPayUPayment(txnid);

    if (!verification.transaction) {
      return NextResponse.json(
        {
          error: verification.message || 'Unable to verify PayU payment',
          raw: verification.raw,
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
      transaction: verification.transaction,
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
