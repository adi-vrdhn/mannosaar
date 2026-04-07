import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import SlotSelection from '@/components/booking/SlotSelection';

export default async function AppointmentSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; bundle?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const sessionType = params.type || 'personal';
  const bundleSize = params.bundle ? parseInt(params.bundle) : 1;

  // Validate bundle size
  if (![1, 2, 3].includes(bundleSize)) {
    redirect(`/appointment/type`);
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading slots...</div>}>
      <SlotSelection sessionType={sessionType} bundleSize={bundleSize} />
    </Suspense>
  );
}
