'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AdminSectionNav from './AdminSectionNav';
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ChevronLeft,
  Clock3,
  IndianRupee,
  MoreVertical,
  ShieldBan,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  session_type: 'personal' | 'couple';
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  meeting_link?: string;
  payment_status?: string;
  status: string;
  number_of_sessions?: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  total_sessions?: number;
}

type PricingMap = Record<string, number>;
type ScheduleView = 'day' | 'week' | 'month';

const quickActions = [
  { label: 'Create Slot', href: '/admin/slots', icon: CalendarPlus },
  { label: 'Block Date', href: '/admin/block-schedule', icon: ShieldBan },
  { label: 'Add Session', href: '/admin/bookings', icon: UserPlus },
  { label: 'View Clients', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

const defaultPrices: PricingMap = {
  personal_1: 2500,
  personal_2: 4500,
  personal_3: 6000,
  couple_1: 3500,
  couple_2: 6500,
  couple_3: 9000,
};

const getInitial = (name?: string | null) => (name?.trim()?.charAt(0) || 'A').toUpperCase();

const formatTime = (time?: string) => (time ? time.slice(0, 5) : 'N/A');

const getBookingAmount = (booking: Booking, prices: PricingMap) => {
  const sessions = booking.number_of_sessions || 1;
  const key = `${booking.session_type || 'personal'}_${sessions}`;
  return prices[key] || prices[`${booking.session_type || 'personal'}_1`] || 0;
};

const AdminDashboard = () => {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [prices, setPrices] = useState<PricingMap>(defaultPrices);
  const [loading, setLoading] = useState(true);
  const [scheduleView, setScheduleView] = useState<ScheduleView>('day');
  const [scheduleDate, setScheduleDate] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [bookingsResponse, usersResponse, pricingResponse] = await Promise.all([
          fetch('/api/bookings/user-bookings', { cache: 'no-store' }),
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch('/api/admin/pricing', { cache: 'no-store' }),
        ]);

        if (bookingsResponse.ok) {
          const data = await bookingsResponse.json();
          setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        }

        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setUsers(Array.isArray(data.users) ? data.users : []);
        }

        if (pricingResponse.ok) {
          const data = await pricingResponse.json();
          if (data.pricing) {
            setPrices(data.pricing);
          }
        }
      } catch (error) {
        console.error('Admin dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const today = startOfDay(new Date());
  const todayString = format(today, 'yyyy-MM-dd');
  const tomorrowString = format(addDays(today, 1), 'yyyy-MM-dd');
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const dashboardData = useMemo(() => {
    const normalizedBookings = bookings.filter((booking) => booking.slot_date);
    const todayBookings = normalizedBookings
      .filter((booking) => booking.slot_date === todayString)
      .sort((a, b) => (a.slot_start_time || '').localeCompare(b.slot_start_time || ''));

    const upcomingBookings = normalizedBookings
      .filter((booking) => booking.slot_date > todayString)
      .sort((a, b) => {
        const dateCompare = a.slot_date.localeCompare(b.slot_date);
        if (dateCompare !== 0) return dateCompare;
        return (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
      });

    const thisMonthRevenue = normalizedBookings
      .filter((booking) => {
        const bookingDate = new Date(booking.slot_date);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      })
      .reduce((sum, booking) => sum + getBookingAmount(booking, prices), 0);

    return {
      todayBookings,
      upcomingBookings,
      thisMonthRevenue,
      nextSessionTomorrow: upcomingBookings.some((booking) => booking.slot_date === tomorrowString),
    };
  }, [bookings, monthEnd, monthStart, prices, todayString, tomorrowString]);

  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const leadingBlanks = Array.from({ length: getDay(monthStart) });
    return { days, leadingBlanks };
  }, [monthEnd, monthStart]);

  const adminName = session?.user?.name || 'Nitu Rathore';
  const scheduleRange = useMemo(() => {
    if (scheduleView === 'week') {
      return {
        start: startOfWeek(scheduleDate, { weekStartsOn: 1 }),
        end: endOfWeek(scheduleDate, { weekStartsOn: 1 }),
      };
    }
    if (scheduleView === 'month') {
      return { start: startOfMonth(scheduleDate), end: endOfMonth(scheduleDate) };
    }
    return { start: scheduleDate, end: scheduleDate };
  }, [scheduleDate, scheduleView]);
  const scheduleBookings = useMemo(() => {
    const start = format(scheduleRange.start, 'yyyy-MM-dd');
    const end = format(scheduleRange.end, 'yyyy-MM-dd');
    return bookings
      .filter(booking => booking.slot_date && booking.slot_date >= start && booking.slot_date <= end)
      .sort((a, b) => {
        const dateDifference = a.slot_date.localeCompare(b.slot_date);
        return dateDifference || (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
      });
  }, [bookings, scheduleRange.end, scheduleRange.start]);
  const scheduleHeading = scheduleView === 'day'
    ? isSameDay(scheduleDate, today) ? "Today's schedule" : format(scheduleDate, 'EEEE, MMMM d')
    : scheduleView === 'week'
      ? `${format(scheduleRange.start, 'MMM d')} – ${format(scheduleRange.end, 'MMM d, yyyy')}`
      : format(scheduleDate, 'MMMM yyyy');
  const moveSchedule = (direction: -1 | 1) => {
    setScheduleDate(current => scheduleView === 'day'
      ? addDays(current, direction)
      : scheduleView === 'week'
        ? addWeeks(current, direction)
        : addMonths(current, direction));
  };
  const upcomingPreview = dashboardData.upcomingBookings.slice(0, 4);
  const monthSessionCount = bookings.filter((booking) => {
    if (!booking.slot_date) return false;
    const bookingDate = new Date(booking.slot_date);
    return bookingDate >= monthStart && bookingDate <= monthEnd;
  }).length;
  const summaryCards = [
    {
      label: "Today's Sessions",
      value: dashboardData.todayBookings.length,
      caption: dashboardData.todayBookings.length ? 'Sessions scheduled today' : 'No sessions today',
      icon: CalendarDays,
      color: 'bg-violet-100 text-violet-700',
      href: '/admin/bookings?view=today',
    },
    {
      label: 'Upcoming Sessions',
      value: dashboardData.upcomingBookings.length,
      caption: dashboardData.nextSessionTomorrow ? 'Next session tomorrow' : 'No session tomorrow',
      icon: CalendarCheck,
      color: 'bg-emerald-100 text-emerald-700',
      href: '/admin/bookings?view=upcoming',
    },
    {
      label: 'This Month Revenue',
      value: `₹${dashboardData.thisMonthRevenue.toLocaleString('en-IN')}`,
      caption: `From ${monthSessionCount} sessions`,
      icon: IndianRupee,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Total Clients',
      value: users.length,
      caption: 'Active clients',
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] text-slate-950">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <AdminSectionNav className="mb-8" />

            <section className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-playfair text-3xl font-semibold text-[#34213f] sm:text-4xl">
                  Welcome, {adminName.split(' ')[0]}
                </h1>
                <p className="mt-2 text-sm text-slate-500 sm:text-base">Here is what is happening with your sessions today.</p>
              </div>
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 sm:w-auto">
                <CalendarDays size={16} />
                Today&apos;s overview
              </div>
            </section>

            <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {summaryCards.map(({ label, value, caption, icon: Icon, color, href }) =>
                href ? (
                  <Link
                    key={label}
                    href={href}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 sm:p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 sm:rounded-full ${color}`}>
                        <Icon size={20} className="sm:h-7 sm:w-7" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight text-slate-500 sm:text-sm">{label}</p>
                        <p className="mt-1 break-words text-xl font-black leading-none text-slate-950 sm:text-3xl">{loading ? '...' : value}</p>
                        <p className="mt-1 text-xs font-medium leading-tight text-slate-500 sm:text-sm">{caption}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 sm:rounded-full ${color}`}>
                        <Icon size={20} className="sm:h-7 sm:w-7" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight text-slate-500 sm:text-sm">{label}</p>
                        <p className="mt-1 break-words text-xl font-black leading-none text-slate-950 sm:text-3xl">{loading ? '...' : value}</p>
                        <p className="mt-1 text-xs font-medium leading-tight text-slate-500 sm:text-sm">{caption}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
              <div className="space-y-4 sm:space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7">
                  <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Schedule</h2>
                    <div className="flex w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {(['day', 'week', 'month'] as const).map(view => (
                        <button
                          key={view}
                          onClick={() => setScheduleView(view)}
                          className={`min-w-[72px] rounded-lg px-3 py-1.5 text-xs font-bold sm:min-w-[88px] sm:px-4 sm:py-2 sm:text-sm ${
                            scheduleView === view ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          type="button"
                        >
                          {view[0].toUpperCase() + view.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-5 flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-between gap-2 sm:justify-start">
                      <button type="button" onClick={() => moveSchedule(-1)} aria-label={`Previous ${scheduleView}`} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-violet-700"><ChevronLeft size={18} /></button>
                      <p className="min-w-0 text-center text-sm font-semibold text-slate-900 sm:min-w-[210px]">{scheduleHeading}</p>
                      <button type="button" onClick={() => moveSchedule(1)} aria-label={`Next ${scheduleView}`} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-violet-700"><ChevronRight size={18} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setScheduleDate(startOfDay(new Date()))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700">Today</button>
                      <input
                        type="date"
                        aria-label="Choose schedule date"
                        value={format(scheduleDate, 'yyyy-MM-dd')}
                        onChange={event => {
                          if (event.target.value) setScheduleDate(new Date(`${event.target.value}T00:00:00`));
                        }}
                        className="min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-violet-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="h-36 animate-pulse rounded-2xl bg-slate-100 sm:h-48 sm:rounded-3xl" />
                  ) : scheduleBookings.length === 0 ? (
                    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl bg-slate-50 px-4 text-center sm:min-h-52">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eee7f2] text-[#5b267a] sm:mb-4">
                        <Clock3 size={26} className="sm:h-[38px] sm:w-[38px]" />
                      </div>
                      <p className="text-lg font-semibold text-slate-950">No sessions in this {scheduleView}</p>
                      <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">Choose another date or period.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                      {scheduleBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-violet-200 hover:bg-violet-50/60 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4"
                        >
                          <Link
                            href="/admin/bookings"
                            className="block"
                          >
                            <p className="text-sm font-black text-slate-950 sm:text-base">{booking.user_name || 'Client'}</p>
                            <p className="text-xs font-medium text-slate-500 sm:text-sm">
                              {scheduleView !== 'day' && `${format(new Date(`${booking.slot_date}T00:00:00`), 'EEE, MMM d')} · `}
                              {formatTime(booking.slot_start_time)} - {formatTime(booking.slot_end_time)}
                            </p>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black capitalize text-emerald-700 sm:px-3 sm:text-xs">
                              {booking.status || 'confirmed'}
                            </span>
                            {booking.meeting_link && (
                              <a
                                href={booking.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-black text-violet-700 transition hover:bg-violet-50 sm:px-3 sm:text-xs"
                              >
                                Join meeting
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7">
                  <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Upcoming sessions</h2>
                    <Link
                      href="/admin/bookings?view=upcoming"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 sm:px-4 sm:text-sm"
                    >
                      <Calendar size={16} />
                      View Bookings
                    </Link>
                  </div>

                  <div className="space-y-2.5 md:hidden">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                      ))
                    ) : upcomingPreview.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                        No upcoming sessions yet.
                      </div>
                    ) : (
                      upcomingPreview.map((booking) => (
                        <Link
                          key={booking.id}
                          href="/admin/bookings"
                          className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-violet-200 hover:bg-violet-50/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900">{booking.user_name || 'Client'}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">
                                {format(new Date(booking.slot_date), 'MMM dd')} · {formatTime(booking.slot_start_time)} - {formatTime(booking.slot_end_time)}
                              </p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black capitalize text-emerald-700">
                              {booking.status || 'confirmed'}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-[11px] font-black capitalize text-violet-700">
                              {booking.session_type || 'Personal'}
                            </span>
                            <span className="text-xs font-bold text-violet-700">Open</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-y border-slate-200 bg-slate-50 text-sm text-slate-500">
                          <th className="px-4 py-3 font-black">Date</th>
                          <th className="px-4 py-3 font-black">Time</th>
                          <th className="px-4 py-3 font-black">Client</th>
                          <th className="px-4 py-3 font-black">Session Type</th>
                          <th className="px-4 py-3 font-black">Status</th>
                          <th className="px-4 py-3 font-black">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array.from({ length: 4 }).map((_, index) => (
                            <tr key={index} className="border-b border-slate-100">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
                              </td>
                            </tr>
                          ))
                        ) : upcomingPreview.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                              No upcoming sessions yet.
                            </td>
                          </tr>
                        ) : (
                          upcomingPreview.map((booking) => (
                            <tr key={booking.id} className="border-b border-slate-100 text-sm">
                              <td className="px-4 py-4 font-semibold text-slate-700">
                                {format(new Date(booking.slot_date), 'EEE, MMM dd yyyy')}
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-700">
                                {formatTime(booking.slot_start_time)} - {formatTime(booking.slot_end_time)}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">
                                    {getInitial(booking.user_name)}
                                  </span>
                                  <span className="font-bold text-slate-800">{booking.user_name || 'Client'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="rounded-lg bg-violet-100 px-3 py-1 text-xs font-black capitalize text-violet-700">
                                  {booking.session_type || 'Personal'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-black capitalize text-emerald-700">
                                  {booking.status || 'confirmed'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <Link href="/admin/bookings" className="text-slate-500 hover:text-violet-700">
                                  <MoreVertical size={18} />
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Link
                    href="/admin/bookings"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 text-xs font-black text-violet-700 sm:mt-5 sm:text-sm"
                  >
                    View all sessions
                    <ChevronRight size={16} />
                  </Link>
                </section>
              </div>

              <aside className="space-y-4 sm:space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Quick actions</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-1 sm:gap-3">
                    {quickActions.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href + label}
                        href={href}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:gap-4 sm:px-4 sm:py-3 sm:text-sm"
                      >
                        <Icon size={16} className="sm:h-[18px] sm:w-[18px]" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between sm:mb-5">
                    <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">Calendar overview</h2>
                    <div className="flex items-center gap-2 text-slate-500">
                      <ChevronLeft size={18} />
                      <ChevronRight size={18} />
                    </div>
                  </div>
                  <p className="mb-3 text-center text-xs font-bold text-slate-500 sm:mb-4 sm:text-sm">{format(today, 'MMMM yyyy')}</p>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 sm:gap-2 sm:text-xs">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-700 sm:gap-2 sm:text-sm">
                    {calendarDays.leadingBlanks.map((_, index) => (
                      <span key={`blank-${index}`} />
                    ))}
                    {calendarDays.days.map((day) => {
                      const hasSession = bookings.some((booking) => booking.slot_date === format(day, 'yyyy-MM-dd'));
                      const active = isSameDay(day, today);

                      return (
                        <Link
                          key={day.toISOString()}
                          href="/admin/calendar"
                          className={`flex h-7 items-center justify-center rounded-full transition sm:h-9 ${
                            active
                              ? 'bg-violet-600 font-black text-white'
                              : hasSession
                                ? 'bg-violet-50 text-violet-700'
                                : 'hover:bg-slate-100'
                          }`}
                        >
                          {format(day, 'd')}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              </aside>
            </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
