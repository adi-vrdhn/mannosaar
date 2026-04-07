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
  }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const slotId = params.slotId;
  const bundleSize = params.bundle ? parseInt(params.bundle) : 1;
  
  // sessionDates are now stored in sessionStorage on client
  // Single bookings (bundle=1) will get data from sessionStorage or slotId
  // Bundle bookings (bundle>1) will get data from sessionStorage only

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading confirmation...</div>}>
      <BookingConfirmation />
    </Suspense>
  );
}

