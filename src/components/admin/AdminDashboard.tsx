'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Clock, Users, Lock, Settings, BookOpen } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import SessionCard from './SessionCard';

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
  payment_status: string;
}

interface StatsData {
  todayCount: number;
  upcomingCount: number;
  todayBookings: Booking[];
  upcomingBookings: Booking[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsData>({
    todayCount: 0,
    upcomingCount: 0,
    todayBookings: [],
    upcomingBookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = startOfDay(new Date());
        const today_string = format(today, 'yyyy-MM-dd');
        const in7Days = format(addDays(today, 7), 'yyyy-MM-dd');

        // Fetch all confirmed bookings using API endpoint (bypasses RLS)
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

        // Count today's sessions
        const todayCount = bookings.filter((b: Booking) => b.slot_date === today_string).length || 0;

        // Count upcoming sessions (next 7 days)
        const upcomingCount = bookings.filter((b: Booking) => 
          b.slot_date > today_string && b.slot_date <= in7Days
        ).length || 0;

        // Get today's bookings
        const todayBookings = bookings
          .filter((b: Booking) => b.slot_date === today_string)
          .sort((a: Booking, b: Booking) => {
            return (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
          });

        // Get next 7 days bookings
        const upcomingBookings = bookings
          .filter((b: Booking) => b.slot_date > today_string && b.slot_date <= in7Days)
          .sort((a: Booking, b: Booking) => {
            const dateCompare = a.slot_date.localeCompare(b.slot_date);
            if (dateCompare !== 0) return dateCompare;
            return (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
          });

        setStats({
          todayCount,
          upcomingCount,
          todayBookings,
          upcomingBookings,
        });

        console.log('📊 Admin stats:', { todayCount, upcomingCount, totalBookings: bookings.length });
      } catch (err) {
        console.error('Error in fetchStats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-xl text-gray-600">Manage therapy sessions and bookings</p>
        </motion.div>

        {/* Main Grid: Left (70%) and Right (30%) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* LEFT SIDE - 70% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
              {/* Today's Sessions Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Today's Sessions</p>
                    <p className="text-5xl font-bold mt-2">{stats.todayCount}</p>
                  </div>
                  <Clock size={48} className="text-blue-200 opacity-50" />
                </div>
              </div>

              {/* Upcoming Sessions Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-semibold uppercase tracking-wide">Upcoming Sessions</p>
                    <p className="text-5xl font-bold mt-2">{stats.upcomingCount}</p>
                  </div>
                  <Calendar size={48} className="text-green-200 opacity-50" />
                </div>
              </div>
            </motion.div>

            {/* Blocks Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manage Slots Block */}
              <Link href="/admin/slots">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer h-full"
                >
                  <Calendar size={40} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Manage Slots</h3>
                  <p className="text-purple-100">Create and manage therapy slots</p>
                </motion.div>
              </Link>

              {/* Block Dates Block */}
              <Link href="/admin/block-schedule">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer h-full"
                >
                  <Lock size={40} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Block Dates</h3>
                  <p className="text-red-100">Block time periods and dates</p>
                </motion.div>
              </Link>
            </motion.div>

            {/* Bookings Block */}
            <motion.div variants={itemVariants}>
              <Link href="/admin/bookings">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-8 text-white cursor-pointer"
                >
                  <BookOpen size={40} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Manage Bookings</h3>
                  <p className="text-teal-100">View, edit and reschedule client sessions</p>
                </motion.div>
              </Link>
            </motion.div>

            {/* Analytics Block */}
            <motion.div variants={itemVariants}>
              <Link href="/admin/analytics">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-8 text-white cursor-pointer"
                >
                  <Users size={40} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Analytics</h3>
                  <p className="text-indigo-100">View all sessions and detailed analytics</p>
                </motion.div>
              </Link>
            </motion.div>

            {/* Settings Block */}
            <motion.div variants={itemVariants}>
              <Link href="/admin/settings">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white cursor-pointer"
                >
                  <Settings size={40} className="mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Settings</h3>
                  <p className="text-orange-100">Manage integrations and preferences</p>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* RIGHT SIDE - 30% Sessions */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-6 h-fit">
            {/* Today's Sessions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Sessions</h2>
              
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ) : stats.todayBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-sm">No sessions today</p>
              ) : (
                <motion.div variants={containerVariants} className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.todayBookings.map((booking) => (
                    <SessionCard
                      key={booking.id}
                      id={booking.id}
                      userName={booking.user_name}
                      userEmail={booking.user_email}
                      userPhone={booking.user_phone}
                      sessionType={booking.session_type}
                      slotDate={booking.slot_date}
                      slotStartTime={booking.slot_start_time}
                      slotEndTime={booking.slot_end_time}
                      meetingLink={booking.meeting_link}
                      paymentStatus={booking.payment_status}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Upcoming Sessions (7 days) */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions (7 days)</h2>
              
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ) : stats.upcomingBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-sm">No upcoming sessions</p>
              ) : (
                <motion.div variants={containerVariants} className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.upcomingBookings.map((booking) => (
                    <SessionCard
                      key={booking.id}
                      id={booking.id}
                      userName={booking.user_name}
                      userEmail={booking.user_email}
                      userPhone={booking.user_phone}
                      sessionType={booking.session_type}
                      slotDate={booking.slot_date}
                      slotStartTime={booking.slot_start_time}
                      slotEndTime={booking.slot_end_time}
                      meetingLink={booking.meeting_link}
                      paymentStatus={booking.payment_status}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
