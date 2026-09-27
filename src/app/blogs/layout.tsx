import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Mental Health and Wellbeing Resources',
  description: 'Read practical, non-diagnostic articles and resources from Mannosaar about emotional wellbeing, relationships, stress and counselling.',
  path: '/blogs',
});

export default function BlogsLayout({ children }: { children: ReactNode }) {
  return children;
}
