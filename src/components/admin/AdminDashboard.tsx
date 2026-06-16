'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ChevronLeft,
  Clock3,
  CreditCard,
  Home,
  IndianRupee,
  LayoutDashboard,
  MoreVertical,
  Settings,
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

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Appointments', href: '/admin/bookings', icon: CalendarDays },
  { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { label: 'Clients', href: '/admin/users', icon: Users },
  { label: 'Slots', href: '/admin/slots', icon: Clock3 },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

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
            {navItems.map(({ label, href, icon: Icon }) => {
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
          <div className="px-4 py-7 sm:px-6 lg:px-10">
            <section className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {getGreeting()}, {adminName.split(' ')[0]}
                </h1>
                <p className="mt-2 text-base font-medium text-slate-500">Here is what is happening with your sessions today.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                <CalendarDays size={18} />
                {format(new Date(), 'EEE, MMM dd, yyyy')}
              </div>
            </section>

            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map(({ label, value, caption, icon: Icon, color, href }) =>
                href ? (
                  <Link
                    key={label}
                    href={href}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-violet-200"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${color}`}>
                        <Icon size={28} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-500">{label}</p>
                        <p className="mt-1 text-3xl font-black text-slate-950">{loading ? '...' : value}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{caption}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${color}`}>
                        <Icon size={28} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-500">{label}</p>
                        <p className="mt-1 text-3xl font-black text-slate-950">{loading ? '...' : value}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{caption}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-950">Today's Schedule</h2>
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {['Day', 'Week', 'Month'].map((label, index) => (
                        <button
                          key={label}
                          className={`rounded-lg px-4 py-2 text-sm font-bold ${
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
                    <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
                  ) : dashboardData.todayBookings.length === 0 ? (
                    <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-white to-violet-50 text-center">
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
                        <Clock3 size={38} />
                      </div>
                      <p className="text-xl font-black text-slate-950">No sessions today</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Enjoy your free time.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.todayBookings.map((booking) => (
                        <Link
                          href="/admin/bookings?view=today"
                          key={booking.id}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-violet-200 hover:bg-violet-50/60 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-black text-slate-950">{booking.user_name || 'Client'}</p>
                            <p className="text-sm font-medium text-slate-500">
                              {formatTime(booking.slot_start_time)} - {formatTime(booking.slot_end_time)}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black capitalize text-emerald-700">
                            {booking.status || 'confirmed'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-black text-slate-950">Upcoming Sessions</h2>
                    <Link
                      href="/admin/bookings?view=upcoming"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
                    >
                      <Calendar size={16} />
                      View Bookings
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
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
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-black text-violet-700"
                  >
                    View all sessions
                    <ChevronRight size={16} />
                  </Link>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <h2 className="text-xl font-black text-slate-950">Quick Actions</h2>
                  <div className="mt-5 space-y-3">
                    {quickActions.map(({ label, href, icon: Icon, className }) => (
                      <Link
                        key={href + label}
                        href={href}
                        className={`flex items-center gap-4 rounded-2xl bg-gradient-to-r px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${className}`}
                      >
                        <Icon size={18} />
                        {label}
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-950">Calendar Overview</h2>
                    <div className="flex items-center gap-2 text-slate-500">
                      <ChevronLeft size={18} />
                      <ChevronRight size={18} />
                    </div>
                  </div>
                  <p className="mb-4 text-center text-sm font-bold text-slate-500">{format(today, 'MMMM yyyy')}</p>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-slate-700">
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
                          className={`flex h-9 items-center justify-center rounded-full transition ${
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
