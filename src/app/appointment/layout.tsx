import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appointment',
  robots: { index: false, follow: false },
};

export default function AppointmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
