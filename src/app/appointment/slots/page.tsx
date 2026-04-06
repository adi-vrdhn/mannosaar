import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import SlotSelection from '@/components/booking/SlotSelection';

export default async function AppointmentSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading slots...</div>}>
      <SlotSelection />
    </Suspense>
  );
}
