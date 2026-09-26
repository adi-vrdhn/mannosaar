'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
  CreditCard,
  ExternalLink,
  LayoutList,
  NotebookPen,
  UserRound,
} from 'lucide-react';
import AdminSectionNav from './AdminSectionNav';
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
    rescheduled_at?: string;
    reschedule_count?: number;
    original_date?: string;
    original_start_time?: string;
    original_end_time?: string;
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

const statusOptions = ['all', 'pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'] as const;

const BookingsView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const viewParam = searchParams.get('view');
  const initialViewMode: 'all' | 'today' | 'upcoming' | 'past' =
    viewParam === 'today' || viewParam === 'upcoming' || viewParam === 'past' ? viewParam : 'all';
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'upcoming' | 'past'>(initialViewMode);

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
                rescheduled_at: sessionDate.rescheduled_at,
                reschedule_count: sessionDate.reschedule_count,
                original_date: sessionDate.original_date,
                original_start_time: sessionDate.original_start_time,
                original_end_time: sessionDate.original_end_time,
              }))
            : [];

          const currentSession = normalizedSessionDates[0];
          const firstSessionWasRescheduled = Boolean(
            currentSession?.rescheduled_at || Number(currentSession?.reschedule_count || 0) > 0
          );

          return {
            ...booking,
            notes: booking.notes || null,
            session_dates: normalizedSessionDates,
            user: {
              name: booking.user_name || 'N/A',
              email: booking.user_email || 'N/A',
            },
            slot: {
              date: firstSessionWasRescheduled
                ? currentSession?.date || booking.slot_date || 'N/A'
                : booking.slot_date || currentSession?.date || 'N/A',
              start_time: firstSessionWasRescheduled
                ? currentSession?.start_time || booking.slot_start_time || 'N/A'
                : booking.slot_start_time || currentSession?.start_time || 'N/A',
              end_time: firstSessionWasRescheduled
                ? currentSession?.end_time || booking.slot_end_time || 'N/A'
                : booking.slot_end_time || currentSession?.end_time || 'N/A',
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
    const dateValue = booking.slot?.date || booking.slot_date || booking.session_dates?.[0]?.date;
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
    const wasRescheduled = booking.session_dates?.some(
      (sessionDate) => sessionDate.rescheduled_at || Number(sessionDate.reschedule_count || 0) > 0
    );

    if (rawStatus === 'confirmed' && wasRescheduled) return 'rescheduled';

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

  const pastSessions = bookings.filter((b) => {
    const bookingDate = getBookingDate(b);
    return Boolean(bookingDate && bookingDate.getTime() < today.getTime());
  });

  let displayBookings = bookings;
  if (viewMode === 'today') {
    displayBookings = todaySessions;
  } else if (viewMode === 'upcoming') {
    displayBookings = upcomingSessions;
  } else if (viewMode === 'past') {
    displayBookings = pastSessions;
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
      case 'rescheduled':
        return 'bg-amber-100 text-amber-800';
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

  const formatBookingDate = (value?: string) => {
    if (!value || value === 'N/A') return 'Date unavailable';
    return format(new Date(value), 'EEE, MMM dd');
  };

  const formatBookingDateLong = (value?: string) => {
    if (!value || value === 'N/A') return 'Date unavailable';
    return format(new Date(value), 'MMM dd, yyyy');
  };

  const formatTime = (value?: string) =>
    value && value !== 'N/A' ? value.slice(0, 5) : 'N/A';

  const summaryCards = [
    {
      key: 'today',
      label: "Today's Sessions",
      value: todaySessions.length,
      helper: 'Scheduled for today',
      icon: Clock3,
      active: viewMode === 'today',
      activeClass: 'border-blue-200 bg-blue-600 text-white',
      idleClass: 'border-slate-200 bg-white text-slate-900',
      iconClass: viewMode === 'today' ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-600',
      helperClass: viewMode === 'today' ? 'text-blue-100' : 'text-slate-500',
      onClick: () => setViewMode('today'),
    },
    {
      key: 'upcoming',
      label: 'Upcoming',
      value: upcomingSessions.length,
      helper: 'Future sessions',
      icon: CalendarCheck2,
      active: viewMode === 'upcoming',
      activeClass: 'border-emerald-200 bg-emerald-600 text-white',
      idleClass: 'border-slate-200 bg-white text-slate-900',
      iconClass: viewMode === 'upcoming' ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-600',
      helperClass: viewMode === 'upcoming' ? 'text-emerald-100' : 'text-slate-500',
      onClick: () => setViewMode('upcoming'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-12 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdminSectionNav className="mb-8" />

        <div className="hidden">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
          >
            <ArrowLeft size={16} />
            Back
          </motion.button>

          <div className="hidden rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-700 sm:inline-flex">
            Admin Bookings
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b267a]">Appointments</p>
              <h1 className="mt-2 font-playfair text-3xl font-semibold text-[#34213f] sm:text-4xl">
                {viewMode === 'today' ? 'Today\'s Bookings' : viewMode === 'upcoming' ? 'Upcoming Bookings' : viewMode === 'past' ? 'Past Bookings' : 'All Bookings'}
              </h1>
            </div>

            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 sm:flex">
              <LayoutList size={22} />
            </div>
          </div>

          <div className="hidden">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{bookings.length}</p>
            </div>
            <div className="rounded-2xl bg-violet-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">Visible</p>
              <p className="mt-1 text-2xl font-black text-violet-700">{filteredBookings.length}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">Confirmed</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{displayBookings.filter((booking) => getDisplayStatus(booking) === 'confirmed').length}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">Pending</p>
              <p className="mt-1 text-2xl font-black text-amber-700">{displayBookings.filter((booking) => getDisplayStatus(booking) === 'pending').length}</p>
            </div>
          </div>

          {viewMode !== 'all' && (
            <p className="mt-4 inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
              Viewing {viewMode === 'today' ? 'today\'s sessions' : viewMode === 'upcoming' ? 'upcoming sessions' : 'past sessions'}
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden">
          {summaryCards.map(({ key, label, value, helper, icon: Icon, activeClass, idleClass, iconClass, helperClass, onClick }) => (
            <motion.button
              key={key}
              onClick={onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-[24px] border p-4 text-left shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition ${viewMode === key ? activeClass : idleClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>
                  <Icon size={20} />
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                  viewMode === key ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {viewMode === key ? 'Active' : 'View'}
                </span>
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] opacity-80">{label}</p>
              <p className="mt-2 text-4xl font-black leading-none">{value}</p>
              <p className={`mt-2 text-xs font-medium ${helperClass}`}>{helper}</p>
            </motion.button>
          ))}
        </motion.div>

        {viewMode !== 'all' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
              {viewMode === 'today' ? 'Showing only today\'s sessions' : viewMode === 'upcoming' ? 'Showing only upcoming sessions' : 'Showing only past sessions'}
            </div>
            <motion.button
              onClick={() => setViewMode('all')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Show all bookings
            </motion.button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden">
          <div className="mb-3 flex items-center gap-2">
            <NotebookPen size={16} className="text-violet-600" />
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Filter by status</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
          {statusOptions.map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilterStatus(status)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300 hover:bg-violet-50'
              }`}
            >
              {status === 'all' && <LayoutList size={15} />}
              {status === 'pending' && <CircleAlert size={15} />}
              {status === 'confirmed' && <CheckCircle2 size={15} />}
              {status === 'cancelled' && <CircleX size={15} />}
              {status === 'completed' && <CalendarCheck2 size={15} />}
              {status}
            </motion.button>
          ))}
          </div>
        </motion.div>

        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {([
              ['all', 'All'],
              ['today', 'Today'],
              ['upcoming', 'Upcoming'],
              ['past', 'Past'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewMode(key)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === key ? 'bg-white text-[#5b267a] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Status
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#5b267a] focus:outline-none"
            >
              {statusOptions.map(status => <option key={status} value={status}>{status === 'all' ? 'All statuses' : status[0].toUpperCase() + status.slice(1)}</option>)}
            </select>
          </label>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {viewMode === 'today' ? 'Today’s appointments' : viewMode === 'upcoming' ? 'Upcoming appointments' : viewMode === 'past' ? 'Past appointments' : 'All appointments'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">Loading bookings…</div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <p className="font-medium text-slate-800">No bookings found</p>
              <p className="mt-1 text-sm text-slate-500">Try another view or status filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map(booking => {
                const displayStatus = getDisplayStatus(booking);
                const isBundle = Boolean(booking.number_of_sessions && booking.number_of_sessions > 1);
                const bookingDate = booking.slot?.date && booking.slot.date !== 'N/A' ? booking.slot.date : undefined;
                return (
                  <article key={booking.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[#f3eef6] text-[#4d2465]">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{bookingDate ? format(new Date(bookingDate), 'MMM') : '---'}</span>
                          <span className="text-xl font-semibold leading-none">{bookingDate ? format(new Date(bookingDate), 'dd') : '--'}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold text-slate-950">{booking.user?.name || 'Client'}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusColor(displayStatus)}`}>{displayStatus}</span>
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500">{booking.user?.email || 'No email'}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-800"><Clock3 size={15} />{formatTime(booking.slot?.start_time)} - {formatTime(booking.slot?.end_time)}</span>
                            <span className="capitalize">{booking.session_type || 'personal'} session</span>
                            {isBundle && <span>{booking.number_of_sessions} session package</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#5b267a] px-4 py-2 text-sm font-semibold text-[#5b267a] transition hover:bg-[#f7f1fa]"
                        >
                          View details
                        </button>
                        {(booking.meeting_link || booking.meeting_links?.[0]) && (
                          <a
                            href={booking.meeting_link || booking.meeting_links?.[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5b267a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4a1f64]"
                          >
                            <ExternalLink size={15} />
                            Join meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hidden"
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
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {filteredBookings.map((booking) => {
                  const isBundle = booking.number_of_sessions && booking.number_of_sessions > 1;
                  const sessionCount = booking.number_of_sessions || 1;
                  const displayStatus = getDisplayStatus(booking);

                  return (
                    <motion.button
                      key={booking.id}
                      variants={itemVariants}
                      onClick={() => setSelectedBookingId(booking.id)}
                      className="w-full rounded-[28px] border border-slate-200 bg-white p-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition hover:border-violet-300"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-base font-black text-violet-700">
                          {getInitial(booking.user?.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[1.05rem] font-black leading-tight text-slate-950">{booking.user?.name || 'N/A'}</p>
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusColor(displayStatus)}`}>
                              {displayStatus}
                            </span>
                          </div>
                          <p className="mt-1 break-all text-sm text-slate-500">{booking.user?.email || 'N/A'}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {booking.user_phone || 'No phone'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 rounded-[24px] border border-slate-100 bg-slate-50/90 p-3.5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                            <CalendarDays size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Schedule</p>
                          {isBundle ? (
                            <div className="mt-2 space-y-1.5">
                              {booking.session_dates && booking.session_dates.length > 0 ? (
                                booking.session_dates.map((session, sessionIdx) => (
                                  <p key={`${booking.id}-${sessionIdx}`} className="text-sm font-semibold text-slate-900">
                                    Session {sessionIdx + 1}: {formatBookingDate(session.date)} • {(session.start_time || '').substring(0, 5)}
                                  </p>
                                ))
                              ) : (
                                <p className="mt-2 text-sm italic text-slate-600">Bundle: {sessionCount} sessions</p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {booking.slot && booking.slot.date !== 'N/A'
                                ? `${formatBookingDateLong(booking.slot.date)} • ${(booking.slot.start_time || '').substring(0, 5)}`
                                : 'N/A'}
                            </p>
                          )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-blue-800">
                            {booking.session_type}
                          </span>
                          {isBundle && (
                            <span className="w-fit rounded-full bg-violet-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-violet-800">
                              {sessionCount} sessions
                            </span>
                          )}
                          {booking.meeting_link && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-800">
                              <CreditCard size={12} />
                              meeting ready
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Client Note</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{truncateText(booking.notes, 110)}</p>
                        </div>

                        <div className="flex gap-2">
                          <span className="inline-flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600">
                            <UserRound size={14} />
                            Open details for update
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <span className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">
                          View details
                        </span>
                        {booking.meeting_links && booking.meeting_links.length > 1 ? (
                          <span className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-black text-violet-700">
                            {booking.meeting_links.length} links
                          </span>
                        ) : booking.meeting_link ? (
                          <a
                            href={booking.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700"
                          >
                            Join
                          </a>
                        ) : null}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto lg:block">
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
            </>
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
