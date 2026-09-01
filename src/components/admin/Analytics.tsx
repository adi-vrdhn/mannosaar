'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Filter, X } from 'lucide-react';
import AdminSectionNav from './AdminSectionNav';
import BookingDetailsModal from './BookingDetailsModal';
import NoteModal from '@/components/shared/NoteModal';

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  session_type: string;
  status: string;
  notes?: string | null;
  sessions_taken_before?: number | null;
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  meeting_link: string;
}

const Analytics = () => {
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    personalSessions: 0,
    coupleSessions: 0,
  });

  // Modal state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ title: string; note: string | null } | null>(null);

  // Fetch all bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Fetch from API endpoint (bypasses RLS using service role)
        const response = await fetch('/api/bookings/user-bookings');
        if (!response.ok) {
          console.error('Error fetching bookings:', response.status);
          setLoading(false);
          return;
        }

        const { bookings } = await response.json();
        
        if (!bookings || !Array.isArray(bookings)) {
          console.error('Invalid bookings data:', bookings);
          setLoading(false);
          return;
        }

        setAllBookings(bookings || []);

        // Calculate stats
        const total = bookings?.length || 0;
        const confirmed = bookings?.filter((b: Booking) => b.status === 'confirmed').length || 0;
        const personal = bookings?.filter((b: Booking) => b.session_type === 'personal').length || 0;
        const couple = bookings?.filter((b: Booking) => b.session_type === 'couple').length || 0;

        setStats({
          totalBookings: total,
          confirmedBookings: confirmed,
          personalSessions: personal,
          coupleSessions: couple,
        });

        console.log('📊 Analytics bookings fetched from API:', { total, confirmed });
      } catch (err) {
        console.error('Error in fetchBookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleRefresh = () => {
    // Refetch bookings when a booking is updated
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings/user-bookings');
        if (!response.ok) return;
        const { bookings } = await response.json();
        if (bookings && Array.isArray(bookings)) {
          setAllBookings(bookings);
          const confirmed = bookings.filter((b: Booking) => b.status === 'confirmed').length || 0;
          setStats(prev => ({ ...prev, confirmedBookings: confirmed }));
        }
      } catch (err) {
        console.error('Error refreshing bookings:', err);
      }
    };
    fetchBookings();
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...allBookings];

    // Search filter (client name, email, phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.user_name?.toLowerCase().includes(query) ||
          b.user_email?.toLowerCase().includes(query) ||
          b.user_phone?.toLowerCase().includes(query)
      );
    }

    // Session type filter
    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter((b) => b.session_type === sessionTypeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((b) => b.slot_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((b) => b.slot_date <= endDate);
    }

    setFilteredBookings(filtered);
  }, [searchQuery, sessionTypeFilter, statusFilter, startDate, endDate, allBookings]);

  const clearFilters = () => {
    setSearchQuery('');
    setSessionTypeFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pb-12 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminSectionNav className="mb-5" />

        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => router.back()}
          className="mb-6 inline-flex w-full items-center justify-center rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 sm:w-auto"
        >
          ← Back
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">Analytics</h1>
          <p className="text-gray-600">View all sessions and detailed analytics</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4"
        >
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <p className="text-purple-100 text-sm font-semibold uppercase">Total Bookings</p>
            <p className="mt-2 text-3xl font-bold sm:text-4xl">{stats.totalBookings}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm font-semibold uppercase">Confirmed</p>
            <p className="mt-2 text-3xl font-bold sm:text-4xl">{stats.confirmedBookings}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-semibold uppercase">Personal Sessions</p>
            <p className="mt-2 text-3xl font-bold sm:text-4xl">{stats.personalSessions}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-lg">
            <p className="text-pink-100 text-sm font-semibold uppercase">Couple Sessions</p>
            <p className="mt-2 text-3xl font-bold sm:text-4xl">{stats.coupleSessions}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={20} className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Search & Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Session Type */}
            <div>
              <label htmlFor="sessionTypeFilter" className="block text-sm font-semibold text-gray-700 mb-2">Session Type</label>
              <select
                id="sessionTypeFilter"
                value={sessionTypeFilter}
                onChange={(e) => setSessionTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="personal">Personal</option>
                <option value="couple">Couple</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDateFilter" className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <input
                id="startDateFilter"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDateFilter" className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <input
                id="endDateFilter"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || sessionTypeFilter !== 'all' || statusFilter !== 'all' || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </motion.div>

        {/* Sessions Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Sessions ({filteredBookings.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading sessions...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No sessions found</div>
          ) : (
            <>
              <div className="space-y-4 p-4 lg:hidden">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-gray-900">{booking.user_name}</p>
                        <p className="break-all text-sm text-gray-600">{booking.user_email}</p>
                        <p className="mt-1 text-sm text-gray-600">{booking.user_phone || 'N/A'}</p>
                      </div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold text-gray-900">Schedule:</span>{' '}
                        {booking.slot_date ? format(new Date(booking.slot_date), 'MMM dd, yyyy') : 'N/A'}{' '}
                        {booking.slot_start_time && booking.slot_end_time
                          ? `${booking.slot_start_time} - ${booking.slot_end_time}`
                          : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            booking.session_type === 'personal'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {booking.session_type === 'personal' ? 'Personal' : 'Couple'}
                        </span>
                        <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                          Sessions before: {booking.sessions_taken_before ?? 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setNoteModal({
                              title: `Note for ${booking.user_name || 'booking'}`,
                              note: booking.notes || null,
                            })
                          }
                          className="inline-flex items-center rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-200"
                        >
                          View Notes
                        </button>
                        {booking.meeting_link ? (
                          <a
                            href={booking.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-purple-700 underline"
                          >
                            Meeting Link
                          </a>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                            No meeting link
                          </span>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedBookingId(booking.id)}
                      className="mt-4 inline-flex rounded-lg bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-200"
                    >
                      Edit
                    </motion.button>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Client Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Session Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Notes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sessions Before</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Meeting Link</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.user_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.user_email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.user_phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.slot_date ? format(new Date(booking.slot_date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.slot_start_time && booking.slot_end_time
                          ? `${booking.slot_start_time} - ${booking.slot_end_time}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.session_type === 'personal'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {booking.session_type === 'personal' ? 'Personal' : 'Couple'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <button
                          type="button"
                          onClick={() =>
                            setNoteModal({
                              title: `Note for ${booking.user_name || 'booking'}`,
                              note: booking.notes || null,
                            })
                          }
                          className="inline-flex items-center rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-200"
                        >
                          View Notes
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {booking.sessions_taken_before ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {booking.meeting_link ? (
                          <a
                            href={booking.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 font-semibold hover:text-purple-800 underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors text-xs font-semibold"
                        >
                          Edit
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>

        {/* Booking Details Modal */}
        <BookingDetailsModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={handleRefresh}
        />

        <NoteModal
          isOpen={!!noteModal}
          note={noteModal?.note ?? null}
          title={noteModal?.title}
          onClose={() => setNoteModal(null)}
        />
      </div>
    </div>
  );
};

export default Analytics;
