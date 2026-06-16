import crypto from 'crypto';

export interface PayUSessionDate {
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
}

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
  vpa?: string;
}

export type PayUInitiationInput = PayUBookingContext;

export type PayUPaymentMode = 'auto' | 'upi' | 'cards' | 'netbanking' | 'wallets';

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
  return `payu_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

export function normalizePayUAmount(amount: number) {
  return Number(amount).toFixed(2);
}

export function getPayUProductInfo(sessionType: string, bundleSize: number) {
  const typeLabel = sessionType === 'couple' ? 'Couple Therapy' : 'Personal Therapy';
  return bundleSize > 1 ? `${typeLabel} Bundle x${bundleSize}` : `${typeLabel} Session`;
}

export function getPayUPaymentModeFields(paymentMode?: PayUPaymentMode): PayUPaymentModeFields {
  switch (paymentMode) {
    case 'upi':
      return { pg: 'UPI', bankcode: 'UPI' };
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

export function buildPayUValidateVPAHash(params: {
  key: string;
  command?: string;
  vpa: string;
  salt: string;
}) {
  const command = params.command || 'validateVPA';
  const hashSequence = [params.key, command, params.vpa, params.salt];
  return crypto.createHash('sha512').update(hashSequence.join('|')).digest('hex');
}

export function getPayUValidateVPAUrl() {
  const explicitUrl = process.env.PAYU_VALIDATE_VPA_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const paymentUrl = getPayUConfig().paymentUrl;
  return paymentUrl.includes('test.payu.in')
    ? 'https://test.payu.in/merchant/postservice.php?form=2'
    : 'https://secure.payu.in/merchant/postservice?form=2';
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
    paymentMode: input.paymentMode,
    s2sClientIp: input.s2sClientIp,
    s2sDeviceInfo: input.s2sDeviceInfo,
    vpa: input.vpa,
  });

  const paymentModeFields = getPayUPaymentModeFields(input.paymentMode);
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

  if (input.paymentMode === 'upi' && input.vpa) {
    fields.vpa = input.vpa;
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
    txnid,
    fields: {
      ...fields,
      hash,
    },
  };
}
