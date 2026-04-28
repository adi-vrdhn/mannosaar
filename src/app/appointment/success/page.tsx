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
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
      return;
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
  }, [session, bookingId, router, retryCount]);

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-green-50 pt-24 pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(76,29,149,0.12)] backdrop-blur md:p-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl font-bold text-green-600">
              ✓
            </div>

            <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              Booking Confirmed
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
              Your session has been booked successfully. A confirmation email has been sent with the details.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
              Booking ID: {bookingId || 'Pending'}
            </div>
          </div>

          {loading && (
            <div className="mt-8 rounded-3xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600" />
                <p className="text-sm font-medium text-blue-700">Preparing your meeting details...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
              {error}
            </div>
          )}

          {booking && (
            <div className="mt-8 space-y-6">
              <div className="rounded-3xl border border-purple-100 bg-purple-50 p-6">
                <h2 className="text-lg font-bold text-gray-900">Session Details</h2>

                {booking.slot_date ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Date</p>
                      <p className="mt-2 text-base font-bold text-gray-900">
                        {format(new Date(booking.slot_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Time</p>
                      <p className="mt-2 text-base font-bold text-gray-900">
                        {booking.slot_start_time && booking.slot_end_time
                          ? `${booking.slot_start_time} - ${booking.slot_end_time}`
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Type</p>
                      <p className="mt-2 text-base font-bold capitalize text-gray-900">
                        {booking.session_type || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : booking.session_dates && booking.session_dates.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {booking.session_dates.map((session, idx) => (
                      <div key={idx} className="rounded-2xl bg-white p-4">
                        <p className="text-sm font-semibold text-gray-900">
                          Session {idx + 1} of {booking.session_dates?.length}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {format(new Date(session.date), 'MMM dd, yyyy')} at {session.startTime} - {session.endTime}
                        </p>
                        {booking.meeting_links && booking.meeting_links[idx] && (
                          <a
                            href={booking.meeting_links[idx]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
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
                        className="block rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
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
                    className="mt-4 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Join Google Meet
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-gray-600">
                    Meeting link is being prepared. Please refresh in a moment.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-bold text-gray-900">Need Help?</h2>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  Any problems please WhatsApp: <span className="font-semibold text-gray-900">70806 33396</span>
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-600">
                  For meetings related mail: <span className="font-semibold text-gray-900">meeting.mannosaar@gmail.com</span>
                </p>
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
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
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
