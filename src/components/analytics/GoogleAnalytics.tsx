'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
const PUBLIC_ANALYTICS_PATHS = ['/', '/about', '/services', '/blogs', '/videos', '/images', '/privacy', '/terms', '/refund-policy', '/online-therapy-consent', '/emergency', '/data-rights', '/compliance'];

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const allowed = PUBLIC_ANALYTICS_PATHS.some(path => pathname === path || (path === '/blogs' && pathname.startsWith('/blogs/')));

  useEffect(() => {
    if (!window.gtag || !GA_ID || !allowed) {
      return;
    }

    window.gtag('event', 'page_view', {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title,
    });
  }, [allowed, pathname]);

  if (!GA_ID || !allowed) return null;
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
