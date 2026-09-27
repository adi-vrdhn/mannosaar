import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Wellbeing Images and Visual Resources',
  description: 'Browse Mannosaar visual resources about emotional wellbeing, relationships, reflection and everyday mental health.',
  path: '/images',
});

export default function ImagesLayout({ children }: { children: ReactNode }) {
  return children;
}
