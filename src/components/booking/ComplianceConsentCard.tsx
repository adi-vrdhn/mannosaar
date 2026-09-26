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
  const setRequiredConsent = (checked: boolean) => {
    const next = { ...selections, MARKETING: false };
    for (const type of REQUIRED_CONSENT_TYPES) next[type] = checked;
    onChange(next);
  };

  return (
    <section className="my-6 border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="before-you-continue">
      <div>
        <h2 id="before-you-continue" className="text-lg font-semibold text-slate-950">One final confirmation</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Review the information below and tick once to continue.</p>
      </div>

      <div className="mt-5 space-y-4">
        <div className="border-l-2 border-amber-500 pl-3 text-sm leading-6 text-slate-700">
          <p><strong>Mannosaar is not an emergency or crisis service.</strong> In immediate danger, contact your local emergency or crisis service.</p>
        </div>

        <label className={`flex cursor-pointer items-start gap-3 border p-4 transition ${ready ? 'border-purple-500 bg-purple-50/50' : 'border-slate-300 bg-white hover:border-purple-300'}`}>
          <input type="checkbox" checked={ready} onChange={event => setRequiredConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-purple-700 focus:ring-purple-600" />
          <span className="text-sm leading-6 text-slate-700">
            I confirm that I am 18 or older, voluntarily consent to online therapy and understand its limitations. I acknowledge that Mannosaar is not an emergency service, and I agree to the{' '}
            <Link href="/online-therapy-consent" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">Online Therapy Consent</Link> (v{POLICY_VERSIONS.onlineTherapyConsent}),{' '}
            <Link href="/privacy" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">Privacy Policy</Link> (v{POLICY_VERSIONS.privacy}),{' '}
            <Link href="/terms" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">Terms</Link>, and{' '}
            <Link href="/refund-policy" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">cancellation, rescheduling and refund policies</Link>.
          </span>
        </label>

        <p className={`text-sm font-medium ${ready ? 'text-emerald-700' : 'text-slate-500'}`} aria-live="polite">
          {ready ? 'Ready to continue to payment.' : 'Tick the confirmation above to continue.'}
        </p>
      </div>
    </section>
  );
}
