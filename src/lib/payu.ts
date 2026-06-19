import crypto from 'crypto';

export interface PayUSessionDate {
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
}

export type PayUPaymentMode = 'auto' | 'cards' | 'netbanking' | 'wallets' | 'upi_intent' | 'upi_qr';
export type PayUUpiAppName = 'any' | 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'qr';

export interface PayUBookingContext {
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  sessionType: string;
  amount: number;
  slotId?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  bundle?: number | null;
  sessionDates?: PayUSessionDate[];
  notes?: string;
  returnUrl?: string;
  paymentMode?: PayUPaymentMode;
  s2sClientIp?: string;
  s2sDeviceInfo?: string;
  upiAppName?: PayUUpiAppName | null;
}

export type PayUInitiationInput = PayUBookingContext;

interface PayUPaymentModeFields {
  pg?: string;
  bankcode?: string;
  txn_s2s_flow?: string;
  upiAppName?: string;
}

export interface PayUInitiationResult {
  paymentUrl: string;
  fields: Record<string, string>;
  txnid: string;
  paymentMode: PayUPaymentMode;
}

export interface PayUVerifiedTransaction {
  amount: string;
  mihpayid: string;
  raw: Record<string, unknown>;
  status: string;
  txnid: string;
  unmappedStatus: string;
}

export interface PayUVerifyPaymentResult {
  isSuccess: boolean;
  message: string;
  raw: Record<string, unknown> | null;
  transaction: PayUVerifiedTransaction | null;
}

function isTestPaymentUrl(paymentUrl: string) {
  return paymentUrl.includes('test.payu.in');
}

function toRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

export function getPayUConfig() {
  const key =
    process.env.PAYU_KEY ||
    process.env.PAYU_MERCHANT_KEY ||
    process.env.NEXT_PUBLIC_PAYU_KEY ||
    '';
  const salt =
    process.env.PAYU_SALT ||
    process.env.PAYU_MERCHANT_SALT ||
    process.env.NEXT_PUBLIC_PAYU_SALT ||
    '';
  const paymentUrl = process.env.PAYU_PAYMENT_URL || process.env.PAYU_BASE_URL || 'https://secure.payu.in/_payment';

  return { key, salt, paymentUrl };
}

export function encodePayUContext(context: PayUBookingContext): string {
  return Buffer.from(JSON.stringify(context), 'utf8').toString('base64');
}

export function decodePayUContext(encodedContext?: string | null): PayUBookingContext | null {
  if (!encodedContext) {
    return null;
  }

  try {
    const decoded = Buffer.from(encodedContext, 'base64').toString('utf8');
    return JSON.parse(decoded) as PayUBookingContext;
  } catch (error) {
    console.error('Failed to decode PayU context:', error);
    return null;
  }
}

export function serializePayUSessionDates(sessionDates?: PayUSessionDate[]) {
  if (!sessionDates?.length) {
    return '';
  }

  return sessionDates
    .map((session) =>
      [session.date, session.startTime, session.endTime, session.slotId]
        .map((value) => encodeURIComponent(value || ''))
        .join('~')
    )
    .join(';');
}

export function deserializePayUSessionDates(serialized?: string | null): PayUSessionDate[] {
  if (!serialized) {
    return [];
  }

  try {
    return serialized
      .split(';')
      .map((entry) => {
        const [date, startTime, endTime, slotId] = entry
          .split('~')
          .map((value) => decodeURIComponent(value || ''));

        return { date, startTime, endTime, slotId };
      })
      .filter((session) => session.date && session.startTime && session.endTime && session.slotId);
  } catch (error) {
    console.error('Failed to deserialize PayU session dates:', error);
    return [];
  }
}

export function generatePayUTxnId() {
  return `payu_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export function normalizePayUAmount(amount: number) {
  return Number(amount).toFixed(2);
}

export function getPayUProductInfo(sessionType: string, bundleSize: number) {
  const typeLabel = sessionType === 'couple' ? 'Couple Therapy' : 'Personal Therapy';
  return bundleSize > 1 ? `${typeLabel} Bundle x${bundleSize}` : `${typeLabel} Session`;
}

export function getPayUUpiAppCode(upiAppName?: PayUUpiAppName | null) {
  switch (upiAppName) {
    case 'gpay':
      return 'gpay';
    case 'phonepe':
      return 'phonepe';
    case 'paytm':
      return 'paytm';
    case 'bhim':
      return 'bhim';
    case 'qr':
      return 'qr';
    case 'any':
    default:
      return 'gpay/phonepe/paytm/bhim';
  }
}

export function getPayUPaymentModeFields(
  paymentMode?: PayUPaymentMode,
  upiAppName?: PayUUpiAppName | null
): PayUPaymentModeFields {
  switch (paymentMode) {
    case 'upi_intent':
      return {
        pg: 'UPI',
        bankcode: 'INTENT',
        upiAppName: getPayUUpiAppCode(upiAppName),
      };
    case 'upi_qr':
      return {
        pg: 'UPI',
        bankcode: 'INTENT',
        upiAppName: 'qr',
      };
    case 'cards':
      return { pg: 'CC' };
    case 'netbanking':
      return { pg: 'NB' };
    case 'wallets':
      return { pg: 'CASH' };
    default:
      return {};
  }
}

export function buildPayUInitiationHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}) {
  const hashSequence = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || '',
    params.udf2 || '',
    params.udf3 || '',
    params.udf4 || '',
    params.udf5 || '',
    '',
    '',
    '',
    '',
    '',
    params.salt,
  ];

  return crypto.createHash('sha512').update(hashSequence.join('|')).digest('hex');
}

export function buildPayUCommandHash(params: {
  key: string;
  command: string;
  salt: string;
  var1: string;
}) {
  const hashSequence = [params.key, params.command, params.var1, params.salt];
  return crypto.createHash('sha512').update(hashSequence.join('|')).digest('hex');
}

export function getPayUCommandUrl(explicitUrl?: string) {
  if (explicitUrl) {
    return explicitUrl;
  }

  const paymentUrl = getPayUConfig().paymentUrl;
  return isTestPaymentUrl(paymentUrl)
    ? 'https://test.payu.in/merchant/postservice.php?form=2'
    : 'https://secure.payu.in/merchant/postservice?form=2';
}

export function getPayUVerifyPaymentUrl() {
  return getPayUCommandUrl(process.env.PAYU_VERIFY_PAYMENT_URL);
}

export function buildPayUVerifyPaymentHash(params: {
  key: string;
  txnid: string;
  salt: string;
}) {
  return buildPayUCommandHash({
    key: params.key,
    command: 'verify_payment',
    salt: params.salt,
    var1: params.txnid,
  });
}

export function buildPayUResponseHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
  additionalCharges?: string;
}) {
  const hashSegments = [
    params.salt,
    params.status,
    '',
    '',
    '',
    '',
    '',
    params.udf5 || '',
    params.udf4 || '',
    params.udf3 || '',
    params.udf2 || '',
    params.udf1 || '',
    params.email,
    params.firstname,
    params.productinfo,
    params.amount,
    params.txnid,
    params.key,
  ];

  const finalHashSegments = params.additionalCharges
    ? [params.additionalCharges, ...hashSegments]
    : hashSegments;

  return crypto.createHash('sha512').update(finalHashSegments.join('|')).digest('hex');
}

export async function verifyPayUPayment(txnid: string): Promise<PayUVerifyPaymentResult> {
  const { key, salt } = getPayUConfig();
  if (!key || !salt) {
    return {
      isSuccess: false,
      message: 'PayU credentials are not configured',
      raw: null,
      transaction: null,
    };
  }

  const endpoint = getPayUVerifyPaymentUrl();
  const payload = new URLSearchParams({
    form: '2',
    key,
    command: 'verify_payment',
    var1: txnid,
    hash: buildPayUVerifyPaymentHash({ key, txnid, salt }),
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
  let raw: Record<string, unknown> | null = null;

  try {
    raw = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : null;
  } catch {
    raw = null;
  }

  if (!response.ok) {
    return {
      isSuccess: false,
      message: `Verify payment request failed with status ${response.status}`,
      raw,
      transaction: null,
    };
  }

  const detailsContainer = toRecord(raw?.transaction_details);
  const transaction = toRecord(detailsContainer?.[txnid]);

  if (!transaction) {
    return {
      isSuccess: false,
      message: 'Verify payment response did not include the requested transaction',
      raw,
      transaction: null,
    };
  }

  const normalizedTransaction: PayUVerifiedTransaction = {
    amount: toStringValue(transaction.amt || transaction.amount || transaction.transaction_amount),
    mihpayid: toStringValue(transaction.mihpayid || transaction.paymentId),
    raw: transaction,
    status: toStringValue(transaction.status).toLowerCase(),
    txnid: toStringValue(transaction.txnid || txnid),
    unmappedStatus: toStringValue(transaction.unmappedstatus || transaction.unmappedStatus).toLowerCase(),
  };

  return {
    isSuccess: normalizedTransaction.status === 'success',
    message: toStringValue(raw?.msg || raw?.message) || 'Verify payment response received',
    raw,
    transaction: normalizedTransaction,
  };
}

export function createPayUPaymentFields(input: PayUInitiationInput): PayUInitiationResult {
  const { key, salt, paymentUrl } = getPayUConfig();

  if (!key || !salt) {
    throw new Error('PayU credentials are not configured');
  }

  const txnid = generatePayUTxnId();
  const bundleSize = input.sessionDates?.length || input.bundle || 1;
  const productinfo = getPayUProductInfo(input.sessionType, bundleSize);
  const amount = normalizePayUAmount(input.amount);
  const firstSession = input.sessionDates?.[0];
  const paymentMode = input.paymentMode || 'auto';
  const encodedContext = encodePayUContext({
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    userPhone: input.userPhone,
    sessionType: input.sessionType,
    amount: input.amount,
    slotId: input.slotId,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    bundle: input.bundle,
    sessionDates: input.sessionDates,
    notes: input.notes,
    returnUrl: input.returnUrl,
    paymentMode,
    s2sClientIp: input.s2sClientIp,
    s2sDeviceInfo: input.s2sDeviceInfo,
    upiAppName: input.upiAppName,
  });

  const paymentModeFields = getPayUPaymentModeFields(paymentMode, input.upiAppName);
  const fields: Record<string, string> = {
    key,
    txnid,
    amount,
    productinfo,
    firstname: input.userName,
    email: input.userEmail,
    phone: input.userPhone || '',
    surl: input.returnUrl || '',
    furl: input.returnUrl || '',
    udf1: encodedContext,
    udf2: input.returnUrl || '',
    udf3: input.sessionType,
    udf4: String(input.userId),
    udf5: input.slotId || firstSession?.slotId || '',
    service_provider: 'payu_paisa',
  };

  if (input.s2sClientIp) {
    fields.s2s_client_ip = input.s2sClientIp;
  }

  if (input.s2sDeviceInfo) {
    fields.s2s_device_info = input.s2sDeviceInfo;
  }

  if (paymentModeFields.pg) {
    fields.pg = paymentModeFields.pg;
  }

  if (paymentModeFields.bankcode) {
    fields.bankcode = paymentModeFields.bankcode;
  }

  if (paymentModeFields.txn_s2s_flow) {
    fields.txn_s2s_flow = paymentModeFields.txn_s2s_flow;
  }

  if (paymentModeFields.upiAppName) {
    fields.upiAppName = paymentModeFields.upiAppName;
  }

  const hash = buildPayUInitiationHash({
    key,
    txnid,
    amount,
    productinfo,
    firstname: input.userName,
    email: input.userEmail,
    udf1: fields.udf1,
    udf2: fields.udf2,
    udf3: fields.udf3,
    udf4: fields.udf4,
    udf5: fields.udf5,
    salt,
  });

  return {
    paymentUrl,
    paymentMode,
    txnid,
    fields: {
      ...fields,
      hash,
    },
  };
}
