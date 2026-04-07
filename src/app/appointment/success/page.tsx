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
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-green-600">✓</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Booking Confirmed!
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-8">
            Your therapy session has been successfully booked. You will receive a confirmation email shortly with all the details.
          </p>

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 inline-block max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-700 font-medium">Loading booking details...</p>
              </div>
              <p className="text-xs text-blue-600">Attempt {retryCount + 1} of 6</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-600">
              ❌ {error}
            </div>
          )}

          {/* Booking ID */}
          {bookingId && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8 inline-block">
              <p className="text-sm text-gray-600 mb-1">Booking ID</p>
              <p className="text-lg font-mono text-purple-600 font-semibold">{bookingId}</p>
            </div>
          )}

          {/* Google Meet Link(s) */}
          {loading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600">Generating Google Meet link...</p>
            </div>
          ) : booking?.meeting_links && booking.meeting_links.length > 1 ? (
            // Multiple meeting links for bundle bookings
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-4">Google Meet Links ({booking.meeting_links.length} sessions)</p>
              <div className="space-y-3">
                {booking.meeting_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center"
                  >
                    🎥 Session {idx + 1} - Join Google Meet
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Confirmation emails with all meeting links have been sent to you and your therapist
              </p>
            </div>
          ) : booking?.meeting_link ? (
            // Single meeting link for single bookings
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-3">Google Meet Link</p>
              <a
                href={booking.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                🎥 Join Google Meet (40 mins)
              </a>
              <p className="text-xs text-gray-500 mt-3">
                A confirmation email with the meeting link has been sent to you and your therapist
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-yellow-700">
                ⚠️ Google Meet link is being prepared. Please refresh the page in a moment.
              </p>
            </div>
          )}

          {/* Booking Summary */}
          {booking && (
            <div className="mb-8">
              {/* Single Booking Summary */}
              {booking.slot_date && (
                <div className="overflow-x-auto inline-block">
                  <table className="border-collapse">
                    <tbody>
                      <tr className="border-b-2 border-gray-200">
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                          ID
                        </td>
                        <td className="px-6 py-4 text-lg font-bold text-gray-900">{booking.id?.slice(0, 8)}...</td>
                      </tr>
                      <tr className="border-b-2 border-gray-200">
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                          Session Date
                        </td>
                        <td className="px-6 py-4 text-lg font-bold text-gray-900">
                          {format(new Date(booking.slot_date), 'MMM dd, yyyy')}
                        </td>
                      </tr>
                      <tr className="border-b-2 border-gray-200">
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                          Time
                        </td>
                        <td className="px-6 py-4 text-lg font-bold text-gray-900">
                          {booking.slot_start_time && booking.slot_end_time
                            ? `${booking.slot_start_time} - ${booking.slot_end_time}`
                            : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50">
                          Type
                        </td>
                        <td className="px-6 py-4 text-lg font-bold text-gray-900 capitalize">{booking.session_type || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bundle Booking Summary */}
              {booking.session_dates && booking.session_dates.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bundle Sessions ({booking.number_of_sessions || booking.session_dates.length})
                  </h3>
                  <div className="space-y-3">
                    {booking.session_dates.map((session, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border border-purple-100 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Session {idx + 1} of {booking.session_dates?.length}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(session.date), 'MMM dd, yyyy')} at {session.startTime} - {session.endTime}
                            </p>
                          </div>
                          {booking.meeting_links && booking.meeting_links[idx] && (
                            <a
                              href={booking.meeting_links[idx]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
                            >
                              Join
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Session Type:</span> <span className="capitalize">{booking.session_type}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/profile"
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
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
