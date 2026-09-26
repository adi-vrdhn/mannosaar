import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Session',
  robots: { index: false, follow: false },
};

export default function BookSessionLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
