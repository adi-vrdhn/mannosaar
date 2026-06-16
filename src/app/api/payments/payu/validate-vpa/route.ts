import { NextRequest, NextResponse } from 'next/server';
import {
  buildPayUValidateVPAHash,
  getPayUConfig,
  getPayUValidateVPAUrl,
} from '@/lib/payu';

interface ValidateVpaBody {
  vpa?: string;
}

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const requestText = await request.text();

    if (!requestText.trim()) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
    }

    let body: ValidateVpaBody;
    try {
      body = JSON.parse(requestText) as ValidateVpaBody;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const vpa = typeof body.vpa === 'string' ? body.vpa.trim().toLowerCase() : '';
    if (!vpa) {
      return NextResponse.json({ error: 'VPA is required' }, { status: 400 });
    }

    const { key, salt } = getPayUConfig();
    if (!key || !salt) {
      return NextResponse.json(
        { error: 'PayU credentials are not configured' },
        { status: 500 }
      );
    }

    const hash = buildPayUValidateVPAHash({ key, vpa, salt });
    const endpoint = getPayUValidateVPAUrl();
    const payload = new URLSearchParams({
      form: '2',
      key,
      command: 'validateVPA',
      var1: vpa,
      hash,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    const responseText = await response.text();
    let rawResponse: Record<string, unknown> | null = null;

    try {
      rawResponse = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : null;
    } catch {
      rawResponse = null;
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'PayU VPA validation failed',
          statusCode: response.status,
          raw: rawResponse || responseText,
        },
        { status: 502 }
      );
    }

    const status = String(rawResponse?.status || '').toUpperCase();
    const isVPAValid = toNumber(rawResponse?.isVPAValid) === 1;
    const isAutoPayVPAValid =
      toNumber(rawResponse?.isAutoPayVPAValid) === 1;
    const payerAccountName = typeof rawResponse?.payerAccountName === 'string' ? rawResponse.payerAccountName : '';
    const message =
      typeof rawResponse?.msg === 'string'
        ? rawResponse.msg
        : typeof rawResponse?.message === 'string'
          ? rawResponse.message
          : isVPAValid
            ? 'VPA is valid'
            : 'VPA is invalid';

    return NextResponse.json({
      status,
      vpa,
      isValid: Boolean(isVPAValid),
      isAutoPayVPAValid: Boolean(isAutoPayVPAValid),
      payerAccountName,
      message,
      raw: rawResponse,
    });
  } catch (error) {
    console.error('Error validating PayU VPA:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to validate VPA: ${errorMessage}` },
      { status: 500 }
    );
  }
}
