'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
const CONSENT_KEY = 'mannosaar_analytics_consent_v1';
const PUBLIC_ANALYTICS_PATHS = ['/', '/about', '/services', '/blogs', '/videos', '/images', '/privacy', '/terms', '/refund-policy', '/online-therapy-consent', '/emergency', '/data-rights', '/compliance'];

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const allowed = PUBLIC_ANALYTICS_PATHS.some(path => pathname === path || (path === '/blogs' && pathname.startsWith('/blogs/')));
  const [consent, setConsent] = useState<'granted' | 'denied' | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const read = () => {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      setConsent(stored === 'granted' || stored === 'denied' ? stored : null);
      setLoaded(true);
    };
    read();
  }, []);

  const choose = (value: 'granted' | 'denied') => {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.location.reload();
  };

  useEffect(() => {
    if (!window.gtag || !GA_ID || !allowed || consent !== 'granted') {
      return;
    }

    window.gtag('event', 'page_view', {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title,
    });
  }, [allowed, consent, pathname]);

  if (!GA_ID || !allowed || !loaded) return null;
  if (consent !== 'granted') return consent === null ? (
    <div role="region" aria-label="Analytics choice" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 shadow-xl sm:inset-x-auto sm:right-4">
      <p className="font-semibold">Help us improve Mannosaar</p>
      <p className="mt-1 leading-6">With your permission, we use analytics on public information pages only. We do not send booking or therapy details. You can change this choice in the footer.</p>
      <div className="mt-3 flex gap-3">
        <button type="button" onClick={() => choose('denied')} className="rounded border border-slate-400 px-4 py-2 font-medium focus-visible:outline-2 focus-visible:outline-purple-700">Decline</button>
        <button type="button" onClick={() => choose('granted')} className="rounded bg-purple-700 px-4 py-2 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700">Allow analytics</button>
      </div>
    </div>
  ) : null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { send_page_view: false });
      `}</Script>
    </>
  );
}
