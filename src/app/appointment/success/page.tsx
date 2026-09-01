'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Booking {
  id: string;
  meeting_link?: string;
  meeting_links?: string[];
  meeting_password?: string;
  google_calendar_event_id?: string;
  slot_id?: string;
  session_type?: string;
  slot_date?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  session_dates?: Array<{
    date: string;
    slotId: string;
    startTime: string;
    endTime: string;
  }>;
  number_of_sessions?: number;
}

function SuccessPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const formatTime = (time?: string) => (time ? time.slice(0, 5) : 'N/A');
  const formatSessionType = (value?: string) => {
    if (!value) return 'Therapy Session';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (!session) {
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('appointmentNote');
      window.sessionStorage.removeItem('appointmentSessionType');
      window.sessionStorage.removeItem('appointmentBundleSize');
      window.sessionStorage.removeItem('pendingPaymentSessionDates');
      window.sessionStorage.removeItem('pendingPaymentSlotInfo');
    }

    const fetchBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Fetching booking:', bookingId, 'Attempt:', retryCount + 1);
        
        // Use API endpoint instead of direct Supabase query
        const response = await fetch(`/api/bookings/get?bookingId=${bookingId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Don't cache on mobile
        });
        
        let result;
        try {
          result = await response.json();
        } catch (parseErr) {
          console.error('Failed to parse JSON response:', parseErr);
          setError('Invalid response from server');
          setLoading(false);
          return;
        }

        console.log('✅ API response status:', response.status, 'Data:', result);

        if (response.ok && result.booking) {
          console.log('✅ Booking loaded successfully:', result.booking.id);
          setBooking(result.booking);
          setLoading(false);
        } else {
          // If not ok or no booking, retry
          if (retryCount < 5) {
            console.log(`⏳ Booking not ready yet or error (${response.status}), retrying in 1.5 seconds...`);
            setTimeout(() => setRetryCount(retryCount + 1), 1500);
          } else {
            const errorMsg = result?.error || `Failed to load booking (Status: ${response.status})`;
            console.error('❌ Max retries reached:', errorMsg);
            setError(errorMsg);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('🔥 Fetch error:', err);
        if (retryCount < 5) {
          console.log(`⏳ Fetch error, retrying in 1.5 seconds... (Attempt ${retryCount + 2}/6)`);
          setTimeout(() => setRetryCount(retryCount + 1), 1500);
        } else {
          setError('Error loading booking details: ' + (err instanceof Error ? err.message : 'Unknown error'));
          setLoading(false);
        }
      }
    };

    fetchBooking();
  }, [session, status, bookingId, router, retryCount]);

  if (status === 'loading' || !session) {
    return <SuccessLoadingFallback />;
  }

  return (
    <div className="booking-theme min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/80 bg-white/90 px-5 py-8 shadow-[0_24px_70px_rgba(76,29,149,0.12)] backdrop-blur sm:px-8 sm:py-10">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl font-bold text-green-600">
              ✓
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700">
              Booking confirmed
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Your session is booked
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
              A confirmation email has been sent with the details. You can review the booking summary below.
            </p>

            <div className="mt-5 inline-flex max-w-full items-center rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
              <span className="mr-2 text-gray-500">Booking ID</span>
              <span className="break-all">{bookingId || 'Pending'}</span>
            </div>
          </div>

          {loading && (
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600" />
                <p className="text-sm font-medium text-blue-700">Preparing your meeting details...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 text-red-700">
              {error}
            </div>
          )}

          {booking && (
            <div className="mt-8 space-y-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold text-gray-900">Session summary</h2>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                    <span className="text-sm text-gray-500">Session type</span>
                    <span className="text-sm font-semibold capitalize text-gray-900">
                      {formatSessionType(booking.session_type)}
                    </span>
                  </div>
                  {booking.slot_date ? (
                    <>
                      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                        <span className="text-sm text-gray-500">Date</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {format(new Date(booking.slot_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                        <span className="text-sm text-gray-500">Time</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {booking.slot_start_time && booking.slot_end_time
                            ? `${formatTime(booking.slot_start_time)} - ${formatTime(booking.slot_end_time)}`
                            : 'N/A'}
                        </span>
                      </div>
                    </>
                  ) : booking.session_dates && booking.session_dates.length > 0 ? (
                    <>
                      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                        <span className="text-sm text-gray-500">Sessions</span>
                        <span className="text-sm font-semibold text-gray-900">{booking.session_dates.length}</span>
                      </div>
                      <div className="space-y-2 pt-1">
                        {booking.session_dates.map((session, idx) => (
                          <div key={idx} className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-sm font-semibold text-gray-900">
                              Session {idx + 1}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {format(new Date(session.date), 'MMM dd, yyyy')} • {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                  <div className="flex items-start justify-between gap-4 pt-1">
                    <span className="text-sm text-gray-500">Therapist</span>
                    <span className="text-sm font-semibold text-gray-900">Neetu Rathore</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 sm:p-6 text-center">
                <h2 className="text-lg font-bold text-gray-900">Meeting Link</h2>
                {loading ? (
                  <p className="mt-3 text-sm text-gray-600">Generating your Google Meet link...</p>
                ) : booking?.meeting_links && booking.meeting_links.length > 1 ? (
                  <div className="mt-4 space-y-3">
                    {booking.meeting_links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Session {idx + 1} - Join Google Meet
                      </a>
                    ))}
                  </div>
                ) : booking?.meeting_link ? (
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Join Google Meet
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-gray-600">
                    Meeting link is being prepared. Please refresh in a moment.
                  </p>
                )}
              </div>

              <p className="text-center text-sm text-gray-500">
                Need help? WhatsApp <span className="font-semibold text-gray-900">70806 33396</span> or email{' '}
                <span className="font-semibold text-gray-900">meeting.mannosaar@gmail.com</span>
              </p>

              <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-5">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Policies
                </p>
                <div className="mt-3 flex flex-col items-center justify-center gap-2 text-sm sm:flex-row sm:gap-4">
                  <Link href="/terms" className="font-medium text-purple-700 underline underline-offset-4">
                    Terms & Conditions
                  </Link>
                  <span className="hidden text-gray-300 sm:inline">|</span>
                  <Link href="/privacy" className="font-medium text-purple-700 underline underline-offset-4">
                    Privacy Policy
                  </Link>
                  <span className="hidden text-gray-300 sm:inline">|</span>
                  <Link href="/refund-policy" className="font-medium text-purple-700 underline underline-offset-4">
                    Refund Policy
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
            >
              Back to Home
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-full bg-gray-200 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-300"
            >
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessLoadingFallback() {
  return (
    <div className="booking-theme min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your booking details...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessLoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
}
