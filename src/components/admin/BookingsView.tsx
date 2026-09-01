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

const statusOptions = ['all', 'pending', 'confirmed', 'cancelled', 'completed'] as const;

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

  const formatBookingDate = (value?: string) => {
    if (!value || value === 'N/A') return 'Date unavailable';
    return format(new Date(value), 'EEE, MMM dd');
  };

  const formatBookingDateLong = (value?: string) => {
    if (!value || value === 'N/A') return 'Date unavailable';
    return format(new Date(value), 'MMM dd, yyyy');
  };

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.10),_transparent_38%),linear-gradient(180deg,#faf7ff_0%,#f7f4ff_100%)] pb-12 pt-20 sm:pt-24">
      <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-10 2xl:px-12">
        <AdminSectionNav className="mb-4" />

        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
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
          className="mb-5 rounded-[28px] border border-violet-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(76,29,149,0.08)] backdrop-blur sm:mb-8 sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Bookings Overview</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {viewMode === 'today' ? 'Today\'s Bookings' : viewMode === 'upcoming' ? 'Upcoming Bookings' : 'All Bookings'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 sm:text-base">
                Review session status, open client details, and jump into the next action without digging through long tables.
              </p>
            </div>

            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 sm:flex">
              <LayoutList size={22} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
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
              Viewing {viewMode === 'today' ? 'today\'s sessions' : 'upcoming sessions'}
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 grid grid-cols-2 gap-3 sm:mb-8">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
              {viewMode === 'today' ? 'Showing only today\'s sessions' : 'Showing only upcoming sessions'}
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:mb-8">
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(88,28,135,0.08)]"
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
