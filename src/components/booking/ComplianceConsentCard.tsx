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
  const setGroup = (types: readonly (typeof REQUIRED_CONSENT_TYPES)[number][], checked: boolean) => {
    const next = { ...selections };
    for (const type of types) next[type] = checked;
    onChange(next);
  };

  return (
    <section className="my-6 border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="before-you-continue">
      <div>
        <h2 id="before-you-continue" className="text-lg font-semibold text-slate-950">One final confirmation</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Please review each statement and confirm it separately before payment.</p>
      </div>

      <div className="mt-5 space-y-4">
        <div className="border-l-2 border-amber-500 pl-3 text-sm leading-6 text-slate-700">
          <p><strong>Mannosaar is not an emergency or crisis service.</strong> In immediate danger, contact your local emergency or crisis service.</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border border-slate-300 p-4 focus-within:border-purple-500">
          <input type="checkbox" checked={selections.AGE_18} onChange={event => setGroup(['AGE_18'], event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-purple-700" />
          <span className="text-sm leading-6 text-slate-700">I confirm that I am 18 or older.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-slate-300 p-4 focus-within:border-purple-500">
          <input type="checkbox" checked={selections.ONLINE_THERAPY_VOLUNTARY && selections.ONLINE_THERAPY_LIMITATIONS} onChange={event => setGroup(['ONLINE_THERAPY_VOLUNTARY', 'ONLINE_THERAPY_LIMITATIONS'], event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-purple-700" />
          <span className="text-sm leading-6 text-slate-700">I voluntarily consent to online counselling, understand its limits, and have read the <Link href="/online-therapy-consent" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">Online Therapy Consent</Link> (v{POLICY_VERSIONS.onlineTherapyConsent}).</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-slate-300 p-4 focus-within:border-purple-500">
          <input type="checkbox" checked={selections.NOT_EMERGENCY_SERVICE && selections.EMERGENCY_ACTION} onChange={event => setGroup(['NOT_EMERGENCY_SERVICE', 'EMERGENCY_ACTION'], event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-purple-700" />
          <span className="text-sm leading-6 text-slate-700">I understand that this is not an emergency service. In immediate danger I will contact local emergency services or crisis support.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-slate-300 p-4 focus-within:border-purple-500">
          <input type="checkbox" checked={selections.PRIVACY_POLICY && selections.TERMS_AND_POLICIES} onChange={event => setGroup(['PRIVACY_POLICY', 'TERMS_AND_POLICIES'], event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-purple-700" />
          <span className="text-sm leading-6 text-slate-700">I have read the <Link href="/privacy" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">Privacy Policy</Link> (v{POLICY_VERSIONS.privacy}) and agree to the <Link href="/terms" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">Terms</Link> and <Link href="/refund-policy" target="_blank" className="font-semibold text-purple-700 underline underline-offset-4">refund policy</Link>.</span>
        </label>

        <p className={`text-sm font-medium ${ready ? 'text-emerald-700' : 'text-slate-500'}`} aria-live="polite">
          {ready ? 'Ready to continue to payment.' : 'Confirm all four statements to continue.'}
        </p>
      </div>
    </section>
  );
}
