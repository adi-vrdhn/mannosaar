import type { Metadata } from 'next';
import MindCheck from '@/components/MindCheck';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...createPageMetadata({
    title: 'Mind Check',
    description: 'A private, non-diagnostic self-reflection for adults. Explore ten everyday concerns and receive a personal summary.',
    path: '/mind-check',
  }),
  robots: { index: false, follow: false },
};

export default function MindCheckPage() {
  return <MindCheck />;
}
