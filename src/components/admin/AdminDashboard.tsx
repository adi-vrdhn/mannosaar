'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import AdminSectionNav from './AdminSectionNav';
import { adminNavItems } from './adminNavItems';
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
  LayoutDashboard,
  MoreVertical,
  ShieldBan,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfDay,
  startOfMonth,
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

const quickActions = [
  { label: 'Create Slot', href: '/admin/slots', icon: CalendarPlus, className: 'from-purple-50 to-violet-50 text-purple-700' },
  { label: 'Block Date', href: '/admin/block-schedule', icon: ShieldBan, className: 'from-rose-50 to-red-50 text-rose-700' },
  { label: 'Add Session', href: '/admin/bookings', icon: UserPlus, className: 'from-blue-50 to-sky-50 text-blue-700' },
  { label: 'View Clients', href: '/admin/users', icon: Users, className: 'from-emerald-50 to-green-50 text-emerald-700' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, className: 'from-violet-50 to-purple-50 text-violet-700' },
];

const defaultPrices: PricingMap = {
  personal_1: 2500,
  personal_2: 4500,
  personal_3: 6000,
  couple_1: 3500,
  couple_2: 6500,
  couple_3: 9000,
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
    <div className="min-h-screen bg-[#f8f7ff] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-white/90 lg:flex lg:flex-col">
          <div className="flex h-24 items-center gap-3 border-b border-slate-100 px-7">
            <Image src="/images/mannosaar-logo.png" alt="Mannosaar" width={48} height={48} className="object-contain" />
            <div>
              <p className="text-xl font-black tracking-tight text-slate-900">Mannosaar</p>
              <p className="text-xs font-semibold text-slate-500">Heal • Grow • Transform</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-5 py-7">
            {adminNavItems.map(({ label, href, icon: Icon }) => {
              const active = href === '/admin';
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-violet-700'
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="m-5 rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-5 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <LayoutDashboard size={28} />
            </div>
            <p className="font-black text-slate-900">You are doing great</p>
            <p className="mt-1 text-sm text-slate-500">{dashboardData.upcomingBookings.length} upcoming sessions</p>
            <div className="mt-4 h-2 rounded-full bg-violet-100">
              <div className="h-2 w-4/5 rounded-full bg-violet-600" />
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="px-3 py-4 sm:px-6 sm:py-7 lg:px-10">
            <AdminSectionNav className="mb-4" />

            <section className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {getGreeting()}, {adminName.split(' ')[0]}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 sm:mt-2 sm:text-base">Here is what is happening with your sessions today.</p>
              </div>
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 sm:w-auto sm:rounded-2xl sm:px-4 sm:py-3">
                <CalendarDays size={16} />
                {format(new Date(), 'EEE, MMM dd, yyyy')}
              </div>
            </section>

            <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {summaryCards.map(({ label, value, caption, icon: Icon, color, href }) =>
                href ? (
                  <Link
                    key={label}
                    href={href}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-violet-200 sm:rounded-3xl sm:p-5"
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
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5"
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
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-7">
                  <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-black text-slate-950 sm:text-xl">Today's Schedule</h2>
                    <div className="flex w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {['Day', 'Week', 'Month'].map((label, index) => (
                        <button
                          key={label}
                          className={`min-w-[72px] rounded-lg px-3 py-1.5 text-xs font-bold sm:min-w-[88px] sm:px-4 sm:py-2 sm:text-sm ${
                            index === 0 ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
                          }`}
                          type="button"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading ? (
                    <div className="h-36 animate-pulse rounded-2xl bg-slate-100 sm:h-48 sm:rounded-3xl" />
                  ) : dashboardData.todayBookings.length === 0 ? (
                    <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-white to-violet-50 px-4 text-center sm:min-h-52 sm:rounded-3xl">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 sm:mb-4 sm:h-20 sm:w-20 sm:rounded-3xl">
                        <Clock3 size={26} className="sm:h-[38px] sm:w-[38px]" />
                      </div>
                      <p className="text-lg font-black text-slate-950 sm:text-xl">No sessions today</p>
                      <p className="mt-1 text-xs font-medium text-slate-500 sm:mt-2 sm:text-sm">Enjoy your free time.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                      {dashboardData.todayBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-violet-200 hover:bg-violet-50/60 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4"
                        >
                          <Link
                            href="/admin/bookings?view=today"
                            className="block"
                          >
                            <p className="text-sm font-black text-slate-950 sm:text-base">{booking.user_name || 'Client'}</p>
                            <p className="text-xs font-medium text-slate-500 sm:text-sm">
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

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-7">
                  <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-black text-slate-950 sm:text-xl">Upcoming Sessions</h2>
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
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
                  <h2 className="text-lg font-black text-slate-950 sm:text-xl">Quick Actions</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-1 sm:gap-3">
                    {quickActions.map(({ label, href, icon: Icon, className }) => (
                      <Link
                        key={href + label}
                        href={href}
                        className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r px-3 py-2.5 text-xs font-black transition hover:-translate-y-0.5 sm:gap-4 sm:px-4 sm:py-3 sm:text-sm ${className}`}
                      >
                        <Icon size={16} className="sm:h-[18px] sm:w-[18px]" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
                  <div className="mb-4 flex items-center justify-between sm:mb-5">
                    <h2 className="text-lg font-black text-slate-950 sm:text-xl">Calendar Overview</h2>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
