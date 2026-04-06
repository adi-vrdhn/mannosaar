'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Clock, Users, Lock, Settings, BookOpen } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';

interface Booking {
  id: string;
  user_name: string;
  session_type: string;
  slot_date: string;
  slot_start_time: string;
}

interface StatsData {
  todayCount: number;
  upcomingCount: number;
  bookings: Booking[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsData>({
    todayCount: 0,
    upcomingCount: 0,
    bookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = startOfDay(new Date());
        const today_string = format(today, 'yyyy-MM-dd');
        const in3Days = format(addDays(today, 3), 'yyyy-MM-dd');

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

        // Count upcoming sessions (including today)
        const upcomingCount = bookings.filter((b: Booking) => b.slot_date >= today_string).length || 0;

        // Get next 3 days bookings
        const next3DaysBookings = bookings.filter(
          (b: Booking) => b.slot_date >= today_string && b.slot_date < in3Days
        ) || [];

        setStats({
          todayCount,
          upcomingCount,
          bookings: next3DaysBookings.sort((a: Booking, b: Booking) => {
            const dateCompare = a.slot_date.localeCompare(b.slot_date);
            if (dateCompare !== 0) return dateCompare;
            return (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
          }),
        });

        console.log('📊 Admin stats:', { todayCount, upcomingCount, bookingsCount: next3DaysBookings.length, allBookings: bookings.length });
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

          {/* RIGHT SIDE - 30% Calendar */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-6 h-fit">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Next 3 Days</h2>
            
            {loading ? (
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ) : stats.bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No sessions in next 3 days</p>
            ) : (
              <motion.div variants={containerVariants} className="space-y-3 max-h-96 overflow-y-auto">
                {stats.bookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-l-4 border-purple-500 hover:shadow-md transition-shadow"
                  >
                    <p className="font-semibold text-gray-900 text-sm">{booking.user_name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {format(new Date(booking.slot_date), 'MMM dd')} • {booking.slot_start_time}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                      booking.session_type === 'personal'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-pink-100 text-pink-800'
                    }`}>
                      {booking.session_type === 'personal' ? 'Personal' : 'Couple'}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
