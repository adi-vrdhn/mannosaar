'use client';

import Link from 'next/link';
import type { ConsentSelections } from '@/lib/compliance';
import { POLICY_VERSIONS, REQUIRED_CONSENT_TYPES } from '@/lib/compliance';

export const emptyConsentSelections: ConsentSelections = {
  AGE_18: false,
  ONLINE_THERAPY_VOLUNTARY: false,
  ONLINE_THERAPY_LIMITATIONS: false,
  NOT_EMERGENCY_SERVICE: false,
  EMERGENCY_ACTION: false,
  PRIVACY_POLICY: false,
  TERMS_AND_POLICIES: false,
  MARKETING: false,
};

export function allRequiredConsentsAccepted(selections: ConsentSelections) {
  return REQUIRED_CONSENT_TYPES.every(type => selections[type]);
}

export default function ComplianceConsentCard({
  selections,
  onChange,
}: {
  selections: ConsentSelections;
  onChange: (value: ConsentSelections) => void;
}) {
  const ready = allRequiredConsentsAccepted(selections);
  const setRequired = (checked: boolean) => {
    const next = { ...selections };
    for (const type of REQUIRED_CONSENT_TYPES) next[type] = checked;
    onChange(next);
  };

  return (
    <section className="my-6 rounded-2xl border border-[#d9c8e4] bg-[#faf7fc] p-5 sm:p-6" aria-labelledby="before-you-continue">
      <h2 id="before-you-continue" className="font-serif text-xl font-semibold text-[#392346]">Before payment</h2>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={ready} onChange={event => setRequired(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#642b82]" />
        <span className="text-sm leading-6 text-[#493d52]">
          I am 18 or older, voluntarily consent to online counselling, and understand its limits. Mannosaar is not an emergency service; in immediate danger I will contact local emergency services or crisis support. I have read the{' '}
          <Link href="/online-therapy-consent" target="_blank" className="font-semibold text-[#642b82] underline underline-offset-2">Online Therapy Consent</Link> (v{POLICY_VERSIONS.onlineTherapyConsent}) and{' '}
          <Link href="/privacy" target="_blank" className="font-semibold text-[#642b82] underline underline-offset-2">Privacy Policy</Link> (v{POLICY_VERSIONS.privacy}), and agree to the{' '}
          <Link href="/terms" target="_blank" className="font-semibold text-[#642b82] underline underline-offset-2">Terms</Link> and{' '}
          <Link href="/refund-policy" target="_blank" className="font-semibold text-[#642b82] underline underline-offset-2">refund policy</Link>.
        </span>
      </label>
    </section>
  );
}
