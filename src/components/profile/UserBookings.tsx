'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import NoteModal from '@/components/shared/NoteModal';

interface Booking {
  id: string;
  session_type: string;
  meeting_link?: string;
  meeting_password?: string;
  google_calendar_event_id?: string;
  notes?: string | null;
  status: string;
  created_at: string;
  slot: {
    date: string;
    start_time: string;
    end_time: string;
  };
}

export default function UserBookings() {
  const { data: session } = useSession();
  const router = useRouter();
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteModal, setNoteModal] = useState<{ title: string; note: string | null } | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            id,
            session_type,
            meeting_link,
            meeting_password,
            google_calendar_event_id,
            notes,
            status,
            created_at,
            slot_id,
            therapy_slots (
              date,
              start_time,
              end_time
            )
          `)
          .eq('user_id', session.user?.email)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          setError('Failed to load bookings');
          return;
        }

        // Map the response to match our interface
        const mappedBookings = data?.map((booking: any) => ({
          id: booking.id,
          session_type: booking.session_type,
          meeting_link: booking.meeting_link,
          meeting_password: booking.meeting_password,
          google_calendar_event_id: booking.google_calendar_event_id,
          notes: booking.notes,
          status: booking.status,
          created_at: booking.created_at,
          slot: booking.therapy_slots,
        })) || [];

        setBookings(mappedBookings);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [session, supabase, router]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View all your therapy sessions</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-900 text-lg mb-4">No bookings yet</p>
            <a
              href="/appointment/type"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Book a Session
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600 hover:shadow-lg transition-shadow"
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Booked on{' '}
                    {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>

                {/* Session Details */}
                <div className="grid md:grid-cols-3 gap-6 mb-4">
                  {/* Date & Time */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Session Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.slot
                        ? format(new Date(booking.slot.date), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Time */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.slot
                        ? `${booking.slot.start_time.substring(0, 5)} - ${booking.slot.end_time.substring(0, 5)}`
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Session Type */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Session Type</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {booking.session_type}
                    </p>
                  </div>
                </div>

                {/* Google Meet Link & Password */}
                {booking.meeting_link && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Meet Link */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Google Meet</p>
                        <a
                          href={booking.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          📹 Join Meeting
                        </a>
                      </div>

                      {/* Password */}
                      {booking.meeting_password && (
                        <div className="bg-white rounded p-3 border border-blue-200">
                          <p className="text-sm text-gray-600 mb-1">Password</p>
                          <p className="text-xl font-mono font-bold text-blue-600">
                            {booking.meeting_password}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setNoteModal({
                      title: 'Your Booking Note',
                      note: booking.notes || null,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-200"
                >
                  View Notes
                </button>

                {/* Booking ID */}
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 inline-block mt-2">
                  Booking ID: {booking.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NoteModal
        isOpen={!!noteModal}
        note={noteModal?.note ?? null}
        title={noteModal?.title}
        onClose={() => setNoteModal(null)}
      />
    </div>
  );
}
