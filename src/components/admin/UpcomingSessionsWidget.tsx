'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';

interface Session {
  id: string;
  user: {
    name: string;
    email: string;
    phone_number?: string;
  };
  slot: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
    therapist_id: string;
  };
  session_type: 'personal' | 'couple';
  meeting_link?: string;
  status: string;
}

const UpcomingSessionsWidget = () => {
  const { data: session } = useSession();
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [therapistId, setTherapistId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTherapistId = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      // Get user ID from email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (userError || !userData?.id) {
        console.error('Error fetching user:', userError);
        setLoading(false);
        return;
      }

      setTherapistId(userData.id);
    };

    fetchTherapistId();
  }, [session, supabase]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!therapistId) return;

      try {
        setLoading(true);
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // Get all confirmed bookings with user and slot info
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(
            `id, session_type, status, meeting_link,
             user:users(name, email, phone_number),
             slot:therapy_slots(id, date, start_time, end_time, duration_minutes, therapist_id)`
          )
          .eq('status', 'confirmed');

        console.log('🔍 Admin fetching bookings:', {
          therapistId,
          totalBookings: bookings?.length || 0,
          error: error?.message || 'none',
        });

        if (error) {
          console.error('❌ Error fetching bookings:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          setLoading(false);
          return;
        }

        if (!bookings || !Array.isArray(bookings)) {
          console.warn('⚠️ No bookings found or invalid data structure');
          setSessions([]);
          setLoading(false);
          return;
        }

        console.log('📊 All bookings from DB:', bookings.map(b => ({
          id: b.id,
          status: b.status,
          slotDate: (Array.isArray(b.slot) ? b.slot[0]?.date : (b.slot as any)?.date) || 'N/A',
          slotTherapistId: (Array.isArray(b.slot) ? b.slot[0]?.therapist_id : (b.slot as any)?.therapist_id) || 'N/A',
          userName: (Array.isArray(b.user) ? b.user[0]?.name : (b.user as any)?.name) || 'N/A',
        })));

        // Filter by therapist_id and future dates, then sort
        const therapistSessions = bookings
          .filter((b: any) => {
            if (!b.slot) return false;
            const slot = Array.isArray(b.slot) ? b.slot[0] : b.slot;
            // Show bookings for this therapist OR if therapist_id is null/empty (unassigned slots - for admin)
            const isTherapistBooking = slot?.therapist_id === therapistId;
            const isUnassignedSlot = !slot?.therapist_id || slot?.therapist_id === '00000000-0000-0000-0000-000000000000';
            return (isTherapistBooking || isUnassignedSlot) && slot?.date >= dateString;
          })
          .map((b: any) => ({
            ...b,
            slot: Array.isArray(b.slot) ? b.slot[0] : b.slot,
            user: Array.isArray(b.user) ? b.user[0] : b.user,
          }))
          .sort((a: any, b: any) => {
            const dateA = new Date(a.slot.date + 'T' + a.slot.start_time);
            const dateB = new Date(b.slot.date + 'T' + b.slot.start_time);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5);

        console.log('📊 Upcoming sessions for therapist:', {
          therapistId,
          totalBookings: bookings.length,
          filtered: therapistSessions.length,
          sessions: therapistSessions.map(s => ({ id: s.id, date: s.slot?.date, therapistId: s.slot?.therapist_id }))
        });

        setSessions(therapistSessions);
      } catch (err) {
        console.error('❌ Exception fetching sessions:', err instanceof Error ? err.message : err);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [therapistId, supabase]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Upcoming Sessions</h2>
        <div className="text-center py-8 text-gray-500">Loading sessions...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Upcoming Sessions</h2>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No upcoming sessions</div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              whileHover={{ scale: 1.01 }}
              className="p-4 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{session.user.name}</p>
                  <p className="text-sm text-gray-600">{session.user.email}</p>
                  {session.user.phone_number && (
                    <p className="text-sm text-gray-600">{session.user.phone_number}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    session.session_type === 'personal'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-pink-100 text-pink-800'
                  }`}
                >
                  {session.session_type === 'personal' ? 'Personal' : 'Couple'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-gray-600 font-semibold">Date</p>
                  <p className="text-gray-900">{format(new Date(session.slot.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold">Time</p>
                  <p className="text-gray-900">
                    {session.slot.start_time} - {session.slot.end_time}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold">Duration</p>
                  <p className="text-gray-900">{session.slot.duration_minutes} mins</p>
                </div>
              </div>

              {session.meeting_link && (
                <a
                  href={session.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors"
                >
                  Join Meeting
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UpcomingSessionsWidget;
