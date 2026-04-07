'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
  slot_date?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  number_of_sessions?: number; // for bundle bookings
  session_dates?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    slotId: string;
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
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch bookings without nested select (avoid nested relationship issues)
  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings with denormalized user and slot data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('slot_date', { ascending: false })
        .order('slot_start_time', { ascending: false });

      if (bookingsError) {
        console.error('❌ Error fetching bookings:', bookingsError);
        return;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Map bookings to the display format
      // Data is already denormalized in the bookings table
      const enrichedBookings = bookingsData.map((booking: any) => ({
        ...booking,
        user: {
          name: booking.user_name || 'N/A',
          email: booking.user_email || 'N/A',
        },
        slot: {
          date: booking.slot_date || 'N/A',
          start_time: booking.slot_start_time || 'N/A',
          end_time: booking.slot_end_time || 'N/A',
        },
      }));

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('📡 Real-time update:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  const filteredBookings =
    filterStatus === 'all' ? bookings : bookings.filter((b) => b.status === filterStatus);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Go Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📋 All Bookings</h1>
          <p className="text-gray-600">
            Total: <span className="font-semibold text-purple-600">{bookings.length}</span> bookings | 
            {' '}Filtered: <span className="font-semibold text-purple-600">{filteredBookings.length}</span>
          </p>
        </motion.div>

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
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
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
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => {
                    // Check if this is a bundle booking
                    const isBundle = booking.number_of_sessions && booking.number_of_sessions > 1;
                    const sessionCount = booking.number_of_sessions || 1;

                    return (
                      <motion.tr
                        key={booking.id}
                        variants={itemVariants}
                        onClick={() => setSelectedBookingId(booking.id)}
                        className={`border-b cursor-pointer transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-purple-50`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{booking.user?.name || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-600 text-sm">{booking.user?.email || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-600 text-sm">{booking.user_phone || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          {isBundle ? (
                            // Bundle booking - show all session dates
                            <div className="space-y-1">
                              {booking.session_dates && booking.session_dates.map((session, sessionIdx) => (
                                <p key={sessionIdx} className="text-gray-900 text-sm whitespace-nowrap">
                                  <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold mr-2">
                                    Session {sessionIdx + 1}/{sessionCount}
                                  </span>
                                  {format(new Date(session.date), 'MMM dd')} {session.start_time.substring(0, 5)}
                                </p>
                              ))}
                              {!booking.session_dates && (
                                <p className="text-gray-600 text-sm text-italic">Bundle: {sessionCount} sessions</p>
                              )}
                            </div>
                          ) : (
                            // Single booking
                            <p className="text-gray-900 font-medium whitespace-nowrap">
                              {booking.slot
                                ? format(new Date(booking.slot.date), 'MMM dd, yyyy') +
                                  ' ' +
                                  booking.slot.start_time.substring(0, 5)
                                : 'N/A'}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="capitalize px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 w-fit">
                              {booking.session_type}
                            </span>
                            {isBundle && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 w-fit">
                                Bundle x{sessionCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`capitalize px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookingId(booking.id);
                            }}
                            className="px-4 py-1 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                          >
                            View Details
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
