import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Mental Health and Wellbeing Videos',
  description: 'Watch Mannosaar videos about emotional wellbeing, relationships, stress, reflection and online counselling.',
  path: '/videos',
});

export default function VideosLayout({ children }: { children: ReactNode }) {
  return children;
}
