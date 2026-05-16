'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-QDPW5YK7B5';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window.gtag || !GA_ID) {
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
