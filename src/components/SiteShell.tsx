'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import WhatsAppButton from '@/components/shared/WhatsAppButton';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/mind-check') {
    return <main className="flex-1">{children}</main>;
  }

  return <>
    <Suspense fallback={null}><GoogleAnalytics /></Suspense>
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <WhatsAppButton />
  </>;
}
