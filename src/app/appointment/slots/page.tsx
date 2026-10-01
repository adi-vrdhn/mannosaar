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
    <Suspense fallback={<div className="appointment-pinterest flex min-h-[70vh] items-center justify-center text-sm font-medium text-[#4c4052]">Preparing available times…</div>}>
      <SlotSelection sessionType={sessionType} bundleSize={bundleSize} />
    </Suspense>
  );
}
