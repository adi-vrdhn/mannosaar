'use client';

export default function AnalyticsSettingsButton() {
  if (!process.env.NEXT_PUBLIC_GA_ID) return null;
  return <button type="button" className="w-fit text-left text-sm text-[#d8ccdc] underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b4fe]" onClick={() => {
    window.localStorage.removeItem('mannosaar_analytics_consent_v1');
    window.location.assign('/privacy');
  }}>Analytics settings</button>;
}
