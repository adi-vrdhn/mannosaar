'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import BookingDetailsModal from './BookingDetailsModal';

interface Booking {
  id: string;
  user_id: string;
  slot_id: string;
  session_type: string;
  status: string;
  meeting_link?: string;
  meeting_links?: string[]; // for bundle bookings with multiple links
  meeting_password?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  notes?: string | null;
  slot_date?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  number_of_sessions?: number; // for bundle bookings
  session_dates?: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
    startTime?: string;
    endTime?: string;
    slot_id?: string;
    slotId?: string;
  }>; // for bundle bookings
}

interface BookingWithDetails extends Booking {
  user?: {
    name: string;
    email: string;
  };
  slot?: {
    date: string;
    start_time: string;
    end_time: string;
  };
}

const BookingsView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const viewParam = searchParams.get('view');
  const initialViewMode: 'all' | 'today' | 'upcoming' =
    viewParam === 'today' || viewParam === 'upcoming' ? viewParam : 'all';
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'upcoming'>(initialViewMode);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  // Fetch bookings through the API so admin views bypass browser-side RLS.
  const fetchBookings = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/bookings/user-bookings?status=all', {
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error('❌ Error fetching bookings:', response.status);
        return;
      }

      const result = await response.json();
      const bookingsData = Array.isArray(result.bookings) ? result.bookings as Booking[] : [];

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      const enrichedBookings = bookingsData
        .map((booking) => {
          const normalizedSessionDates = Array.isArray(booking.session_dates)
            ? booking.session_dates.map((sessionDate) => ({
                date: sessionDate.date,
                start_time: sessionDate.start_time || sessionDate.startTime || '',
                end_time: sessionDate.end_time || sessionDate.endTime || '',
                slotId: sessionDate.slotId || sessionDate.slot_id || '',
              }))
            : [];

          return {
            ...booking,
            notes: booking.notes || null,
            session_dates: normalizedSessionDates,
            user: {
              name: booking.user_name || 'N/A',
              email: booking.user_email || 'N/A',
            },
            slot: {
              date: booking.slot_date || normalizedSessionDates[0]?.date || 'N/A',
              start_time: booking.slot_start_time || normalizedSessionDates[0]?.start_time || 'N/A',
              end_time: booking.slot_end_time || normalizedSessionDates[0]?.end_time || 'N/A',
            },
          };
        })
        .sort((a, b) => {
          const dateCompare = (b.slot?.date || '').localeCompare(a.slot?.date || '');
          if (dateCompare !== 0) return dateCompare;
          return (b.slot?.start_time || '').localeCompare(a.slot?.start_time || '');
        });

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Calculate today's sessions and upcoming sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const getBookingDate = (booking: BookingWithDetails) => {
    const dateValue = booking.slot_date || booking.slot?.date || booking.session_dates?.[0]?.date;
    if (!dateValue || dateValue === 'N/A') {
      return null;
    }

    const bookingDate = new Date(dateValue);
    if (Number.isNaN(bookingDate.getTime())) {
      return null;
    }

    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate;
  };

  const getDisplayStatus = (booking: BookingWithDetails) => {
    const rawStatus = booking.status || 'confirmed';

    if (rawStatus === 'confirmed') {
      const bookingDate = getBookingDate(booking);
      if (bookingDate && bookingDate.getTime() < today.getTime()) {
        return 'completed';
      }
    }

    return rawStatus;
  };

  const todaySessions = bookings.filter((b) => {
    const bookingDate = getBookingDate(b);
    return bookingDate?.getTime() === today.getTime();
  });

  const upcomingSessions = bookings.filter((b) => {
    const bookingDate = getBookingDate(b);
    return Boolean(bookingDate && bookingDate.getTime() > today.getTime());
  });

  let displayBookings = bookings;
  if (viewMode === 'today') {
    displayBookings = todaySessions;
  } else if (viewMode === 'upcoming') {
    displayBookings = upcomingSessions;
  }

  const filteredBookings =
    filterStatus === 'all' ? displayBookings : displayBookings.filter((b) => getDisplayStatus(b) === filterStatus);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitial = (name?: string) => (name?.trim().charAt(0) || 'C').toUpperCase();
  const truncateText = (value?: string | null, max = 100) => {
    if (!value) return 'No note added';
    const normalized = value.trim();
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max).trimEnd()}...`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-10 2xl:px-12">
        {/* Go Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => router.back()}
          className="mb-6 rounded-2xl bg-slate-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
        >
          ← Back
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            📋 {viewMode === 'today' ? 'Today\'s Bookings' : viewMode === 'upcoming' ? 'Upcoming Bookings' : 'All Bookings'}
          </h1>
          <p className="text-gray-600">
            Total: <span className="font-semibold text-purple-600">{bookings.length}</span> bookings | 
            {' '}Filtered: <span className="font-semibold text-purple-600">{filteredBookings.length}</span>
          </p>
          {viewMode !== 'all' && (
            <p className="mt-3 inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
              Viewing {viewMode === 'today' ? 'today\'s sessions' : 'upcoming sessions'}
            </p>
          )}
        </motion.div>

        {/* Today's & Upcoming Sessions Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Today's Sessions Card */}
          <motion.button
            onClick={() => setViewMode('today')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-8 rounded-2xl shadow-lg transition-all ${
              viewMode === 'today'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="text-left flex-1">
                <p className={`text-sm font-semibold uppercase tracking-wider ${
                  viewMode === 'today' ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  Today's Sessions
                </p>
                <p className="text-5xl font-bold mt-4">{todaySessions.length}</p>
              </div>
              <div className={`text-4xl ${
                viewMode === 'today' ? 'text-blue-100' : 'text-blue-200'
              }`}>
                🕐
              </div>
            </div>
          </motion.button>

          {/* Upcoming Sessions Card */}
          <motion.button
            onClick={() => setViewMode('upcoming')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-8 rounded-2xl shadow-lg transition-all ${
              viewMode === 'upcoming'
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-green-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="text-left flex-1">
                <p className={`text-sm font-semibold uppercase tracking-wider ${
                  viewMode === 'upcoming' ? 'text-green-100' : 'text-gray-600'
                }`}>
                  Upcoming Sessions
                </p>
                <p className="text-5xl font-bold mt-4">{upcomingSessions.length}</p>
              </div>
              <div className={`text-4xl ${
                viewMode === 'upcoming' ? 'text-green-100' : 'text-green-200'
              }`}>
                📅
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* View Mode Info */}
        {viewMode !== 'all' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex gap-3">
            <motion.button
              onClick={() => setViewMode('all')}
              className="rounded-2xl bg-slate-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
            >
              ← Show All Bookings
            </motion.button>
            <div className="flex items-center">
              <p className="text-gray-700 font-semibold">
                {viewMode === 'today' ? 'Today\'s Sessions' : 'Upcoming Sessions'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
              }`}
            >
              {status === 'all' ? '📊 All' : status}
            </motion.button>
          ))}
        </motion.div>

        {/* Bookings Table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_70px_rgba(88,28,135,0.1)]"
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No bookings found</p>
              <p className="text-sm mt-2">No bookings with status "{filterStatus}"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1360px] table-fixed">
                <colgroup>
                  <col className="w-[23%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[21%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.16em] text-gray-500">Client</th>
                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.16em] text-gray-500">Session Schedule</th>
                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.16em] text-gray-500">Type</th>
                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.16em] text-gray-500">Status</th>
                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.16em] text-gray-500">Notes</th>
                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-[0.16em] text-gray-500">Meeting</th>
                    <th className="px-8 py-5 text-right text-xs font-black uppercase tracking-[0.16em] text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => {
                    // Check if this is a bundle booking
                    const isBundle = booking.number_of_sessions && booking.number_of_sessions > 1;
                    const sessionCount = booking.number_of_sessions || 1;
                    const displayStatus = getDisplayStatus(booking);

                    return (
                      <motion.tr
                        key={booking.id}
                        variants={itemVariants}
                        onClick={() => setSelectedBookingId(booking.id)}
                        className={`cursor-pointer border-b border-gray-100 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-purple-50`}
                      >
                        <td className="px-8 py-6 align-middle">
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-base font-black text-purple-700">
                              {getInitial(booking.user?.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="break-words text-base font-black leading-6 text-gray-950">{booking.user?.name || 'N/A'}</p>
                              <p className="mt-1 break-all text-sm font-medium leading-6 text-gray-500">{booking.user?.email || 'N/A'}</p>
                              <p className="mt-1 text-sm font-semibold leading-6 text-gray-500">{booking.user_phone || 'No phone'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 align-middle">
                          {isBundle ? (
                            // Bundle booking - show all session dates
                            <div className="space-y-2">
                              {booking.session_dates && booking.session_dates.length > 0 && booking.session_dates.map((session, sessionIdx) => (
                                <p key={sessionIdx} className="text-sm font-semibold leading-6 text-gray-900">
                                  <span className="mr-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                                    Session {sessionIdx + 1}/{sessionCount}
                                  </span>
                                  {format(new Date(session.date), 'MMM dd')} {(session.start_time || '').substring(0, 5)} IST
                                </p>
                              ))}
                              {(!booking.session_dates || booking.session_dates.length === 0) && (
                                <p className="text-sm italic text-gray-600">Bundle: {sessionCount} sessions</p>
                              )}
                            </div>
                          ) : (
                            // Single booking
                            <p className="text-base font-black leading-6 text-gray-900">
                              {booking.slot && booking.slot.date !== 'N/A'
                                ? format(new Date(booking.slot.date), 'MMM dd, yyyy') +
                                  ' ' +
                                  (booking.slot.start_time || '').substring(0, 5) +
                                  ' IST'
                                : 'N/A'}
                            </p>
                          )}
                        </td>
                        <td className="px-8 py-6 align-middle">
                          <div className="flex flex-col gap-2">
                            <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-xs font-black capitalize text-blue-800">
                              {booking.session_type}
                            </span>
                            {isBundle && (
                              <span className="w-fit rounded-full bg-purple-100 px-4 py-2 text-xs font-black text-purple-800">
                                Bundle x{sessionCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 align-middle">
                          <span className={`inline-flex rounded-full px-4 py-2 text-xs font-black capitalize ${getStatusColor(displayStatus)}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-8 py-6 align-middle">
                          <p className="max-w-[280px] text-sm leading-6 text-gray-700">
                            {truncateText(booking.notes, 120)}
                          </p>
                        </td>
                        <td className="px-8 py-6 align-middle">
                          {booking.meeting_links && booking.meeting_links.length > 1 ? (
                            // Multiple meeting links for bundle bookings
                            <div className="space-y-2">
                              {booking.meeting_links.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-2xl bg-blue-100 px-3 py-3 text-center text-xs font-black text-blue-700 transition-colors hover:bg-blue-200"
                                >
                                  Session {idx + 1}
                                </a>
                              ))}
                            </div>
                          ) : booking.meeting_link ? (
                            // Single meeting link
                            <a
                              href={booking.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-2xl bg-green-100 px-4 py-3 text-center text-xs font-black leading-5 text-green-700 transition-colors hover:bg-green-200"
                            >
                              Join Meet
                            </a>
                          ) : (
                            <span className="text-xs font-semibold text-gray-400">No link</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right align-middle">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookingId(booking.id);
                            }}
                            className="inline-flex min-w-[112px] items-center justify-center whitespace-nowrap rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-purple-700"
                          >
                            Details
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        onRefresh={fetchBookings}
      />
    </div>
  );
};

export default BookingsView;
