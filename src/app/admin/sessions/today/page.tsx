'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import SessionCard from '@/components/admin/SessionCard';

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

export default function TodaySessionsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysSessions = async () => {
      try {
        const today = startOfDay(new Date());
        const today_string = format(today, 'yyyy-MM-dd');

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

        // Filter today's bookings
        const todayBookings = bookings
          .filter((b: Booking) => b.slot_date === today_string)
          .sort((a: Booking, b: Booking) => {
            return (a.slot_start_time || '').localeCompare(b.slot_start_time || '');
          });

        setBookings(todayBookings);
      } catch (err) {
        console.error('Error fetching today sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysSessions();
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Today's Sessions</h1>
          <p className="text-xl text-gray-600">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Total Sessions Today</p>
              <p className="text-5xl font-bold mt-2">{bookings.length}</p>
            </div>
            <Clock size={48} className="text-blue-200 opacity-50" />
          </div>
        </motion.div>

        {/* Sessions List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ) : bookings.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <Clock size={48} className="mx-auto text-blue-300 mb-4" />
              <p className="text-xl text-gray-600">No sessions scheduled for today</p>
            </motion.div>
          ) : (
            bookings.map((booking) => (
              <motion.div key={booking.id} variants={itemVariants}>
                <SessionCard
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
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
