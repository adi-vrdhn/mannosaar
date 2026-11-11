import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Mental Health Articles and Counselling Guides',
  description: 'Explore Mannosaar articles on stress, relationships, emotional wellbeing and starting counselling in India. Read at your own pace and find support options when you need them.',
  path: '/blogs',
});

export default function BlogsLayout({ children }: { children: ReactNode }) {
  return children;
}
