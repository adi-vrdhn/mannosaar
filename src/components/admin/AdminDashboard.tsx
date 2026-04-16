'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Clock, Users, Lock, Settings, X, Search } from 'lucide-react';
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
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_sessions: number;
  created_at: string;
}

interface UserSession {
  id: string;
  user_name: string;
  session_type: 'personal' | 'couple';
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  meeting_link?: string;
  status: string;
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
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userModalLoading, setUserModalLoading] = useState(false);

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

  // Fetch all users with their session counts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          console.error('Error fetching users:', response.status);
          return;
        }
        const data = await response.json();
        setUsers(data.users || []);
        console.log('👥 Users fetched:', data.users?.length);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setUserModalLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/sessions`);
      if (!response.ok) {
        console.error('Error fetching user sessions:', response.status);
        setUserSessions([]);
        return;
      }
      const data = await response.json();
      setUserSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      setUserSessions([]);
    } finally {
      setUserModalLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone && user.phone.includes(searchQuery))
  );

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
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-lg p-8 text-white cursor-pointer"
                onClick={() => setSearchQuery('')}
              >
                <Users size={40} className="mb-4" />
                <h3 className="text-2xl font-bold mb-2">Users Management</h3>
                <p className="text-cyan-100">View all users and their booking history</p>
              </motion.div>
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

            {/* Users List Block */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Users List */}
              {loading ? (
                <div className="space-y-3">
                  <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No users found</p>
              ) : (
                <motion.div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={() => handleUserClick(user)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer transition hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {user.total_sessions} sessions
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
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

        {/* User Sessions Modal */}
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-6 flex items-center justify-between border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                  <p className="text-cyan-100">{selectedUser.email}</p>
                  {selectedUser.phone && <p className="text-cyan-100">{selectedUser.phone}</p>}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-cyan-700 rounded-lg transition"
                  title="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {userModalLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                ) : userSessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No sessions booked yet</p>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
                    {userSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                {session.session_type === 'personal' ? '👤' : '👥'} {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} Session
                              </span>
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {session.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              📅 {format(new Date(session.slot_date), 'MMM d, yyyy')} at {session.slot_start_time}
                            </p>
                            {session.meeting_link && (
                              <a
                                href={session.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-cyan-600 hover:text-cyan-800 hover:underline mt-2 inline-block"
                              >
                                🔗 Join Meet
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
