export const POLICY_VERSIONS = {
  privacy: '1.0',
  terms: '1.0',
  onlineTherapyConsent: '1.0',
  cancellationRefund: '1.0',
  emergencyDisclaimer: '1.0',
} as const;

export const CONSENT_VERSION = '1.0';

export const REQUIRED_CONSENT_TYPES = [
  'AGE_18',
  'ONLINE_THERAPY_VOLUNTARY',
  'ONLINE_THERAPY_LIMITATIONS',
  'NOT_EMERGENCY_SERVICE',
  'EMERGENCY_ACTION',
  'PRIVACY_POLICY',
  'TERMS_AND_POLICIES',
] as const;

export type RequiredConsentType = (typeof REQUIRED_CONSENT_TYPES)[number];
export type ConsentSelections = Record<RequiredConsentType, boolean> & { MARKETING?: boolean };

export const CONSENT_POLICY_VERSION: Record<RequiredConsentType | 'MARKETING', string> = {
  AGE_18: CONSENT_VERSION,
  ONLINE_THERAPY_VOLUNTARY: POLICY_VERSIONS.onlineTherapyConsent,
  ONLINE_THERAPY_LIMITATIONS: POLICY_VERSIONS.onlineTherapyConsent,
  NOT_EMERGENCY_SERVICE: POLICY_VERSIONS.emergencyDisclaimer,
  EMERGENCY_ACTION: POLICY_VERSIONS.emergencyDisclaimer,
  PRIVACY_POLICY: POLICY_VERSIONS.privacy,
  TERMS_AND_POLICIES: POLICY_VERSIONS.terms,
  MARKETING: CONSENT_VERSION,
};

export function hasRequiredConsents(value: unknown): value is ConsentSelections {
  if (!value || typeof value !== 'object') return false;
  const selections = value as Record<string, unknown>;
  return REQUIRED_CONSENT_TYPES.every(type => selections[type] === true);
}

export function requestCountry(headers: Headers) {
  return (headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || '').trim().toUpperCase();
}

export function requestIp(headers: Headers) {
  return (headers.get('x-forwarded-for')?.split(',')[0] || headers.get('x-real-ip') || '').trim().slice(0, 64) || null;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
