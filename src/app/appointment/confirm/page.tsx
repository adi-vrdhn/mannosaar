import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import BookingConfirmation from '@/components/booking/BookingConfirmation';

export default async function AppointmentConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    type?: string
    slotId?: string
    bundle?: string
    sessionDates?: string
  }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const slotId = params.slotId;
  const bundleSize = params.bundle ? parseInt(params.bundle) : 1;
  const sessionDates = params.sessionDates ? JSON.parse(params.sessionDates) : null;

  // For bundle bookings, need sessionDates. For single, need slotId
  if (bundleSize > 1 && !sessionDates) {
    redirect('/appointment/type');
  }

  if (bundleSize === 1 && !slotId) {
    const type = params.type || 'personal';
    redirect('/appointment/slots?type=' + type);
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading confirmation...</div>}>
      <BookingConfirmation />
    </Suspense>
  );
}

