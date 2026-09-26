'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Edit2,
  FileText,
  Link as LinkIcon,
  Mail,
  Phone,
  Settings,
  Trash2,
} from 'lucide-react';
import NoteModal from '@/components/shared/NoteModal';
import PrivacyRequestPanel from '@/components/profile/PrivacyRequestPanel';
import SupportRequestPanel from '@/components/profile/SupportRequestPanel';

interface Booking {
  id: string;
  session_type: string;
  status: string;
  notes?: string | null;
  therapist_note_for_client?: string | null;
  sessions_taken_before?: number | null;
  meeting_link?: string;
  meeting_links?: string[];
  meeting_password?: string;
  payment_status?: string;
  payment_id?: string;
  payment_details?: {
    provider: string;
    method: string | null;
    app: string | null;
    amount: number | null;
    amountSource?: 'recorded' | 'checkout' | 'current_price' | 'unavailable';
    currency: string;
    status: string;
    paidAt: string | null;
    reference: string | null;
  };
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  slot_date?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  created_at?: string;
  number_of_sessions?: number;
  session_dates?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    startTime?: string;
    endTime?: string;
    slotId?: string;
    rescheduled_at?: string;
    reschedule_count?: number;
    original_date?: string;
    original_start_time?: string;
    original_end_time?: string;
  }>;
  sessionNumber?: number;
  totalSessions?: number;
  isUnscheduled?: boolean;
  canSchedule?: boolean;
  wasRescheduled?: boolean;
  rescheduledAt?: string;
  originalDate?: string;
  originalStartTime?: string;
  originalEndTime?: string;
  user?: {
    name: string;
    email: string;
  };
  slot?: {
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes?: number;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  whatsapp_number?: string;
}

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const supabase = createClient();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [sessionsToBook, setSessionsToBook] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'toBook'>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone_number: '', whatsapp_number: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [expandedBookingKey, setExpandedBookingKey] = useState<string | null>(null);
  const [expandedPaymentKey, setExpandedPaymentKey] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'created'>('recent');
  const [noteModal, setNoteModal] = useState<{ title: string; note: string | null } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Auto-redirect admin and therapist to admin dashboard
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/bookings/user-bookings');
          const data = await response.json();
          if (data.role === 'admin' || data.role === 'therapist') {
            console.log('📊 Admin/Therapist detected, redirecting to dashboard');
            router.push('/admin');
          }
        } catch (err) {
          console.error('Error checking role:', err);
        }
      }
    };

    checkAdminStatus();
  }, [session?.user?.email, router]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/update-profile');
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          setEditForm({ name: profile.name, phone_number: profile.phone_number || '', whatsapp_number: profile.whatsapp_number || '' });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    if (session?.user?.email) {
      fetchUserProfile();
    }
  }, [session]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!editForm.name.trim()) {
      setEditError('Name is required');
      return;
    }

    if (!editForm.phone_number.trim()) {
      setEditError('Phone number is required');
      return;
    }

    // Validate phone number (at least 10 digits)
    const phoneDigits = editForm.phone_number.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setEditError('Phone number must have at least 10 digits');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone_number: editForm.phone_number.trim(),
          whatsapp_number: editForm.whatsapp_number.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile.user);
      setEditSuccess(true);
      setShowEditModal(false);

      // Show success message
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
      setEditError(errorMsg);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/user/delete-profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        const data = await response.json();
        alert(data.message || 'Deletion request submitted for review.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete profile');
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // NextAuth resolves or creates the database identity on the server.
        const userData = { id: session.user.id };
        if (!userData.id) throw new Error('Session identity is unavailable');

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        console.log('🔍 Fetching bookings via API for userId:', userData.id);

        // Fetch bookings via API endpoint (uses service role, bypasses RLS)
        const bookingsRes = await fetch('/api/bookings/user-bookings');
        const bookingsData = await bookingsRes.json();

        const bookings = (bookingsData.bookings as Booking[]) || [];
        const role = bookingsData.role || 'user';
        const bookingsError = bookingsData.error;

        console.log('📊 Bookings from API:', {
          count: bookings.length,
          role: role,
          error: bookingsError,
          bookings: bookings.map((b) => ({ id: b.id, user_id: b.user_id, slot_date: b.slot_date, status: b.status }))
        });

        if (bookingsError && bookings.length === 0) {
          console.error('Error fetching bookings:', bookingsError);
          setUpcomingBookings([]);
          setPastBookings([]);
          setSessionsToBook([]);
          setLoading(false);
          return;
        }

        if (!bookings || bookings.length === 0) {
          console.log('⚠️ No bookings found');
          setUpcomingBookings([]);
          setPastBookings([]);
          setSessionsToBook([]);
          setLoading(false);
          return;
        }

        // Map all bookings and expand bundle sessions
        const processedBookings: Booking[] = [];
        
        bookings.forEach((b) => {
          const sessionDates = Array.isArray(b.session_dates) ? b.session_dates : [];
          const bundleTotal = Math.max(Number(b.number_of_sessions || 1), sessionDates.length);
          const baseBooking = {
            id: b.id,
            session_type: b.session_type,
            status: b.status,
            notes: b.notes,
            therapist_note_for_client: b.therapist_note_for_client,
            sessions_taken_before: b.sessions_taken_before,
            meeting_link: b.meeting_link,
            meeting_password: b.meeting_password,
            payment_status: b.payment_status,
            payment_id: b.payment_id,
            payment_details: b.payment_details,
            user_id: b.user_id,
            user_name: b.user_name,
            user_email: b.user_email,
            user_phone: b.user_phone,
            created_at: b.created_at,
            number_of_sessions: b.number_of_sessions,
            session_dates: b.session_dates,
            meeting_links: b.meeting_links,
          };

          // If this is a bundle booking, expand each session into a separate row
          if (sessionDates.length > 0) {
            sessionDates.forEach((sessionDate, index) => {
              processedBookings.push({
                ...baseBooking,
                slot_date: sessionDate.date,
                slot_start_time: sessionDate.start_time,
                slot_end_time: sessionDate.end_time,
                meeting_link: b.meeting_links && b.meeting_links[index] ? b.meeting_links[index] : b.meeting_link,
                // Add session number info for display
                sessionNumber: index + 1,
                totalSessions: bundleTotal,
                wasRescheduled: Boolean(sessionDate.rescheduled_at || Number(sessionDate.reschedule_count || 0) > 0),
                rescheduledAt: sessionDate.rescheduled_at,
                originalDate: sessionDate.original_date,
                originalStartTime: sessionDate.original_start_time,
                originalEndTime: sessionDate.original_end_time,
              });
            });
            for (let index = sessionDates.length; index < bundleTotal; index += 1) {
              const previousSession = sessionDates[index - 1];
              const previousEnd = previousSession
                ? new Date(`${previousSession.date}T${previousSession.end_time || previousSession.endTime || '23:59'}+05:30`)
                : null;
              processedBookings.push({
                ...baseBooking,
                slot_date: undefined,
                slot_start_time: undefined,
                slot_end_time: undefined,
                meeting_link: undefined,
                sessionNumber: index + 1,
                totalSessions: bundleTotal,
                isUnscheduled: true,
                canSchedule: index === sessionDates.length && Boolean(previousEnd && previousEnd.getTime() <= Date.now()),
              });
            }
          } else {
            // Single session booking
            processedBookings.push({
              ...baseBooking,
              slot_date: b.slot_date,
              slot_start_time: b.slot_start_time,
              slot_end_time: b.slot_end_time,
            });
          }
        });

        // For admin/therapist, show all bookings in one view
        if (role === 'admin' || role === 'therapist') {
          console.log('👨‍💼 Admin/Therapist view - showing all', processedBookings.length, 'client bookings');
          setUpcomingBookings(processedBookings);
          setPastBookings([]);
          setSessionsToBook([]);
        } else {
          // Keep unscheduled package sessions separate from dated appointments.
          const upcoming: Booking[] = [];
          const past: Booking[] = [];
          const toBook: Booking[] = [];

          processedBookings.forEach((booking) => {
            if (booking.isUnscheduled) {
              toBook.push(booking);
            } else if (booking.slot_date && booking.slot_date >= dateString) {
              upcoming.push(booking);
            } else {
              past.push(booking);
            }
          });

          console.log('👤 User view - upcoming:', upcoming.length, 'past:', past.length);
          setUpcomingBookings(upcoming);
          setPastBookings(past);
          setSessionsToBook(toBook);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('An error occurred while loading bookings');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchBookings();

      // Set up real-time subscription for booking updates
      const channel = supabase
        .channel('profile-bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
          },
          (payload) => {
            console.log('📡 Real-time booking update:', payload);
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [session?.user?.email]);

  const getNotePreview = (note?: string | null) => {
    const trimmedNote = note?.trim();
    if (!trimmedNote) {
      return 'No note added';
    }

    return trimmedNote.length > 90 ? `${trimmedNote.slice(0, 90)}...` : trimmedNote;
  };

  const renderNoteCell = (booking: Booking) => {
    const hasNote = Boolean(booking.therapist_note_for_client?.trim());

    return (
      <div className={`max-w-xl border-l-2 pl-3 ${hasNote ? 'border-[#7b3f98]' : 'border-slate-200'}`}>
        <p className={`whitespace-pre-wrap break-words text-sm ${hasNote ? 'text-slate-700' : 'text-slate-400'}`}>
          {hasNote ? getNotePreview(booking.therapist_note_for_client) : 'No note from your therapist yet.'}
        </p>
        {hasNote && (
          <button
            type="button"
            onClick={() =>
              setNoteModal({
                title: 'Note from your therapist',
                note: booking.therapist_note_for_client || null,
              })
            }
            className="mt-2 text-xs font-semibold text-purple-700 underline underline-offset-4 hover:text-purple-900"
          >
            View full note
          </button>
        )}
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Sort upcoming bookings based on selected option
  const getSortedUpcomingBookings = () => {
    const sorted = [...upcomingBookings];
    
    switch (sortOption) {
      case 'recent':
        // Most recent first (newer dates first)
        return sorted.sort((a, b) => {
          const dateA = new Date(a.slot_date || '');
          const dateB = new Date(b.slot_date || '');
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        // Oldest first (older dates first)
        return sorted.sort((a, b) => {
          const dateA = new Date(a.slot_date || '');
          const dateB = new Date(b.slot_date || '');
          return dateA.getTime() - dateB.getTime();
        });
      case 'created':
        // By creation date (oldest bookings first)
        return sorted.sort((a, b) => {
          const createdA = new Date(a.created_at || '');
          const createdB = new Date(b.created_at || '');
          return createdA.getTime() - createdB.getTime();
        });
      default:
        return sorted;
    }
  };

  const sortedUpcomingBookings = getSortedUpcomingBookings();
  const soonestUpcomingBooking = [...upcomingBookings].sort((a, b) => {
    const dateA = new Date(`${a.slot_date || ''}T${a.slot_start_time || '00:00:00'}`);
    const dateB = new Date(`${b.slot_date || ''}T${b.slot_start_time || '00:00:00'}`);
    return dateA.getTime() - dateB.getTime();
  })[0];
  const visibleBookings = activeTab === 'upcoming'
    ? sortedUpcomingBookings
    : activeTab === 'toBook'
    ? sessionsToBook
    : pastBookings;
  const totalSessions = upcomingBookings.length + pastBookings.length + sessionsToBook.length;
  const completedSessions = pastBookings.length;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const displayName = userProfile?.name || session?.user?.name || 'User';
  const displayEmail = userProfile?.email || session?.user?.email || '';

  const formatTime = (time?: string) => (time ? time.slice(0, 5) : 'N/A');
  const formatSessionDate = (date?: string) => (date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A');
  const getSessionDay = (date?: string) => (date ? format(new Date(date), 'EEEE') : 'Session');

  const tabItems = [
    { key: 'upcoming' as const, label: 'Upcoming Sessions', icon: CalendarDays, count: upcomingBookings.length },
    { key: 'past' as const, label: 'Past Sessions', icon: CheckCircle2, count: pastBookings.length },
    { key: 'toBook' as const, label: 'Sessions to Book', icon: Clock3, count: sessionsToBook.length },
  ];

  const renderSessionCard = (booking: Booking, muted = false) => {
    const isBundle = booking.totalSessions && booking.totalSessions > 1;
    const hasMeetingLink = Boolean(booking.meeting_link);
    const bookingKey = `${booking.id}-${booking.sessionNumber || 0}`;
    const isExpanded = expandedBookingKey === bookingKey;
    const isPaymentExpanded = expandedPaymentKey === bookingKey;
    const payment = booking.payment_details;
    const paymentStatus = String(payment?.status || booking.payment_status || 'unknown').replaceAll('_', ' ').toLowerCase();
    const paymentAmount = payment?.amount == null
      ? 'Not available'
      : new Intl.NumberFormat('en-IN', { style: 'currency', currency: payment.currency || 'INR' }).format(payment.amount);
    const paymentMethodLabels: Record<string, string> = {
      auto: 'PayU checkout',
      cards: 'Card',
      cc: 'Credit card',
      dc: 'Debit card',
      netbanking: 'Net banking',
      nb: 'Net banking',
      wallets: 'Wallet',
      upi: 'UPI',
      upi_intent: 'UPI',
      upi_qr: 'UPI QR',
    };
    const upiAppLabels: Record<string, string> = {
      gpay: 'Google Pay',
      phonepe: 'PhonePe',
      paytm: 'Paytm',
      bhim: 'BHIM',
      qr: 'QR code',
      any: 'UPI app',
    };
    const paymentMethod = payment?.method
      ? paymentMethodLabels[payment.method.toLowerCase()] || payment.method
      : 'Not recorded';
    const paymentApp = payment?.app
      ? upiAppLabels[payment.app.toLowerCase()] || payment.app
      : null;

    if (booking.isUnscheduled) {
      return (
        <article key={`${booking.id}-unscheduled-${booking.sessionNumber}`} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f3eef6] px-2.5 py-1 text-xs font-medium text-[#5b267a]">Session {booking.sessionNumber} of {booking.totalSessions}</span>
                <span className="text-xs capitalize text-slate-500">{booking.session_type || 'personal'}</span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-900">Choose a date for this session</h3>
              <p className="mt-1 text-sm text-slate-600">
                {booking.canSchedule ? 'Your previous session is complete. Choose the next date and time.' : 'This session unlocks after your previous session is completed.'}
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-slate-500">Package</dt>
                  <dd className="mt-1 font-medium text-slate-800">{booking.totalSessions}-session bundle</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Payment</dt>
                  <dd className="mt-1 font-medium capitalize text-slate-800">{paymentStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Package amount</dt>
                  <dd className="mt-1 font-medium text-slate-800">{paymentAmount}</dd>
                </div>
              </dl>
            </div>
            {booking.canSchedule ? (
              <Link href={`/appointment/slots?type=${encodeURIComponent(booking.session_type)}&bundle=${booking.totalSessions}&scheduleBundle=${encodeURIComponent(booking.id)}&sessionIndex=${(booking.sessionNumber || 1) - 1}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#5b267a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4a1f64]">
                Choose date and time
              </Link>
            ) : (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">Locked</span>
            )}
          </div>
        </article>
      );
    }

    return (
      <article
        key={`${booking.id}-${muted ? 'past' : 'upcoming'}-${booking.sessionNumber || 0}`}
        className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[#f3eef6] text-[#4d2465]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                {booking.slot_date ? format(new Date(booking.slot_date), 'MMM') : '---'}
              </span>
              <span className="text-xl font-semibold leading-none">
                {booking.slot_date ? format(new Date(booking.slot_date), 'dd') : '--'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{getSessionDay(booking.slot_date)}</p>
                {isBundle && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Session {booking.sessionNumber} of {booking.totalSessions}
                  </span>
                )}
                <span className="text-xs capitalize text-slate-500">
                  {booking.session_type || 'personal'}
                </span>
              </div>

              <h3 className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Clock3 size={15} aria-hidden="true" />
                {formatTime(booking.slot_start_time)} - {formatTime(booking.slot_end_time)}
              </h3>

              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500">Note from therapist</p>
                <div className="mt-1 text-sm">{renderNoteCell(booking)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {hasMeetingLink ? (
              <a
                href={booking.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#5b267a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4a1f64]"
              >
                <LinkIcon size={16} />
                Join meeting
              </a>
            ) : (
              <span className="text-sm text-slate-500">Link pending</span>
            )}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${
              booking.wasRescheduled
                ? 'bg-amber-50 text-amber-700'
                : muted ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <CheckCircle2 size={15} />
              {booking.wasRescheduled ? 'Rescheduled' : muted ? 'Completed' : 'Confirmed'}
            </span>
            <button
              type="button"
              onClick={() => {
                setExpandedBookingKey(isExpanded ? null : bookingKey);
                if (isExpanded) setExpandedPaymentKey(null);
              }}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              aria-expanded={isExpanded}
            >
              More
              <ChevronDown size={15} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                Booking ID: <span className="font-mono text-xs text-slate-600">{booking.id}</span>
              </div>
              {!muted && !booking.wasRescheduled && (
                <Link
                  href={`/appointment/slots?reschedule=${encodeURIComponent(booking.id)}${booking.sessionNumber ? `&sessionIndex=${booking.sessionNumber - 1}` : ''}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#5b267a] px-4 py-2 text-sm font-semibold text-[#5b267a] transition hover:bg-[#f7f1fa]"
                >
                  Reschedule session
                </Link>
              )}
            </div>

            {booking.wasRescheduled && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">This session was rescheduled.</p>
                {booking.originalDate && (
                  <p className="mt-1 text-amber-800">
                    Previous time: {formatSessionDate(booking.originalDate)} · {formatTime(booking.originalStartTime)}–{formatTime(booking.originalEndTime)}
                  </p>
                )}
                <p className="mt-1 text-xs text-amber-700">The one allowed reschedule has been used.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setExpandedPaymentKey(isPaymentExpanded ? null : bookingKey)}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              aria-expanded={isPaymentExpanded}
            >
              <CreditCard size={15} />
              Payment details
              <ChevronDown size={15} className={`transition-transform ${isPaymentExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
        {isExpanded && isPaymentExpanded && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-xs text-slate-500">Payment status</p>
                <p className="mt-1 font-medium capitalize text-slate-900">{paymentStatus}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{payment?.amountSource === 'current_price' ? 'Current session price' : 'Amount paid'}</p>
                <p className="mt-1 font-medium text-slate-900">{paymentAmount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Provider</p>
                <p className="mt-1 font-medium text-slate-900">{payment?.provider || 'Payment provider'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Payment method</p>
                <p className="mt-1 font-medium text-slate-900">{paymentMethod}</p>
                {paymentApp && <p className="mt-0.5 text-xs text-slate-500">via {paymentApp}</p>}
              </div>
              <div>
                <p className="text-xs text-slate-500">Paid on</p>
                <p className="mt-1 font-medium text-slate-900">{payment?.paidAt ? format(new Date(payment.paidAt), 'MMM dd, yyyy') : 'Not available'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <span>Payment reference</span>
              <span className="font-mono text-slate-700">{payment?.reference || (booking.payment_id ? `•••• ${booking.payment_id.slice(-8)}` : 'Not available')}</span>
            </div>
            {isBundle && <p className="mt-2 text-xs text-slate-500">This payment covers the complete session package.</p>}
            {payment?.amountSource === 'current_price' && <p className="mt-2 text-xs text-amber-700">The original payment amount was not recorded, so the current listed price is shown.</p>}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] py-12 text-slate-950">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        <main className="min-w-0">
          <header className="mb-8 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-playfair text-2xl font-semibold text-[#34213f] sm:text-4xl">Your account</h1>
              <p className="mt-2 hidden text-sm text-slate-600 sm:block">Manage your details and therapy sessions.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:gap-2 sm:px-4"
              >
                <Settings size={16} />
                Settings
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:px-4"
              >
                Log out
              </button>
            </div>
          </header>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              {error}
            </motion.div>
          )}

          <motion.section
            id="profile"
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <motion.div className="w-full">
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {displayName}
                  </h2>
                  <div className="mt-3 grid justify-items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex min-w-0 items-center justify-center gap-2">
                      <Mail size={17} className="shrink-0" />
                      <span className="truncate">{displayEmail}</span>
                    </span>
                    <span className={`inline-flex items-center justify-center gap-2 ${
                      userProfile?.phone_number ? '' : 'text-amber-600'
                    }`}>
                      {userProfile?.phone_number ? <Phone size={17} /> : <AlertTriangle size={17} />}
                      {userProfile?.phone_number || 'Phone number required to book sessions'}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/appointment/type"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#5b267a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4a1f64]"
                >
                  <CalendarDays size={18} />
                  Book a session
                </Link>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              </motion.div>
            </div>

            <motion.div className="mt-3 grid w-full grid-cols-3 divide-x divide-slate-200 pt-3">
              {[
                { label: 'Completed', value: completedSessions, icon: CheckCircle2 },
                { label: 'Upcoming', value: upcomingBookings.length, icon: Clock3 },
                { label: 'Total', value: totalSessions, icon: CalendarDays },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="px-3 text-center first:pl-0 last:pr-0">
                  <div className="flex items-center justify-center gap-2">
                    <Icon size={16} className="hidden text-slate-400 sm:block" />
                    <p className="text-lg font-semibold text-slate-950">{value}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.section>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

                {editError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  >
                    {editError}
                  </motion.div>
                )}

                {editSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2"
                  >
                    <Check size={18} />
                    Profile updated successfully!
                  </motion.div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Enter your name"
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number * ({editForm.phone_number.replace(/\D/g, '').length} digits)
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Enter your phone number"
                      disabled={editLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include area code, minimum 10 digits
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={editForm.whatsapp_number}
                      onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="e.g., +1234567890"
                      disabled={editLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include country code (e.g., +1 for USA). We'll send session reminders and updates via WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Profile Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
              >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Request account deletion?</h2>
                
                <p className="text-gray-600 text-center mb-6">
                  We will review your request and delete or de-identify eligible data. Some booking, payment, consent, or safety records may need to be retained where required by law.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProfile}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    {deleteLoading ? 'Submitting...' : 'Submit request'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <section id="sessions">
          <motion.div
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <span id="notes" className="sr-only">Notes</span>
            <div className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5 sm:px-6">
              {tabItems.map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`relative inline-flex shrink-0 items-center gap-2 py-4 text-sm font-medium transition ${
                    activeTab === key ? 'text-[#5b267a]' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{count}</span>
                  {activeTab === key && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#5b267a]" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {activeTab === 'upcoming'
                      ? 'Upcoming sessions'
                      : activeTab === 'toBook'
                      ? 'Sessions to book'
                      : 'Past sessions'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeTab === 'toBook'
                      ? 'Sessions included in your paid package that still need a date and time.'
                      : 'Your appointment details and meeting links.'}
                  </p>
                </div>

                {activeTab === 'upcoming' && upcomingBookings.length > 0 && (
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Sort
                    <select
                      value={sortOption}
                      onChange={(event) => setSortOption(event.target.value as typeof sortOption)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#5b267a] focus:outline-none"
                    >
                      <option value="recent">Latest date</option>
                      <option value="oldest">Earliest date</option>
                      <option value="created">Date booked</option>
                    </select>
                  </label>
                )}
              </div>

              {loading ? (
                <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#5b267a]" />
                  <p className="text-sm text-slate-600">Loading your sessions...</p>
                </div>
              ) : visibleBookings.length === 0 ? (
                <motion.div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-lg font-semibold text-slate-800">
                    {activeTab === 'upcoming'
                      ? 'No upcoming sessions'
                      : activeTab === 'toBook'
                      ? 'No sessions waiting to be booked'
                      : 'No past sessions yet'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {activeTab === 'upcoming'
                      ? "You haven't booked any therapy sessions yet."
                      : activeTab === 'toBook'
                      ? 'Any remaining sessions from a package will appear here.'
                      : 'Completed sessions will show here.'}
                  </p>
                  {activeTab === 'upcoming' && (
                    <Link
                      href="/appointment/type"
                      className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#5b267a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4a1f64]"
                    >
                      Book Your First Appointment
                    </Link>
                  )}
                </motion.div>
              ) : (
                <motion.div className="space-y-3">
                  {visibleBookings.map((booking) => renderSessionCard(booking, activeTab === 'past'))}
                </motion.div>
              )}
            </div>
          </motion.div>

          <aside className="hidden">
            <motion.div
              initial="hidden"
              animate="visible"
              className="rounded-[2rem] border border-purple-100 bg-white/85 p-5 shadow-[0_20px_70px_rgba(88,28,135,0.07)] backdrop-blur-xl"
            >
              <p className="text-base font-black text-slate-950">Progress</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center xl:grid-cols-1">
                <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#7c3aed ${progressPercent * 3.6}deg, #ede9fe 0deg)`,
                    }}
                  />
                  <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-2xl font-black text-slate-950">{progressPercent}%</span>
                    <span className="text-center text-[11px] font-bold leading-tight text-slate-500">Complete</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    { label: 'Completed', value: completedSessions, icon: CheckCircle2 },
                    { label: 'Upcoming', value: upcomingBookings.length, icon: Clock3 },
                    { label: 'Total Sessions', value: totalSessions, icon: BarChart3 },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl bg-purple-50/70 p-3">
                      <span className="rounded-2xl bg-white p-3 text-purple-700 shadow-sm">
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="text-lg font-black text-slate-950">{value}</p>
                        <p className="text-xs font-bold text-slate-500">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-600 via-fuchsia-500 to-violet-500 p-5 text-white shadow-[0_18px_55px_rgba(147,51,234,0.22)]"
            >
              <p className="text-lg font-black">Next Session</p>
              {soonestUpcomingBooking ? (
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center xl:flex-col xl:items-stretch">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-white/18 p-3 text-center backdrop-blur">
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        {soonestUpcomingBooking.slot_date ? format(new Date(soonestUpcomingBooking.slot_date), 'MMM') : '---'}
                      </p>
                      <p className="text-3xl font-black leading-none">
                        {soonestUpcomingBooking.slot_date ? format(new Date(soonestUpcomingBooking.slot_date), 'dd') : '--'}
                      </p>
                    </div>
                    <div>
                      <p className="font-black">
                        {formatTime(soonestUpcomingBooking.slot_start_time)} - {formatTime(soonestUpcomingBooking.slot_end_time)}
                      </p>
                      <p className="text-sm font-medium text-white/75">{formatSessionDate(soonestUpcomingBooking.slot_date)}</p>
                    </div>
                  </div>
                  {soonestUpcomingBooking.meeting_link ? (
                    <a
                      href={soonestUpcomingBooking.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-purple-700"
                    >
                      <LinkIcon size={16} />
                      Join Meeting
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full bg-white/18 px-5 py-3 text-sm font-black text-white">
                      Link pending
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm font-medium text-white/80">Book a session to see your next appointment here.</p>
              )}
            </motion.div>
          </aside>
        </section>

        <section className="hidden">
          <div id="payments" className="rounded-[1.75rem] border border-purple-100 bg-white/85 p-5 shadow-[0_16px_55px_rgba(88,28,135,0.06)]">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                <CreditCard size={20} />
              </span>
              <div>
                <h3 className="font-black text-slate-950">Payments</h3>
                <p className="text-sm font-medium text-slate-500">PayU payments are attached to confirmed bookings.</p>
              </div>
            </div>
          </div>

          <div id="documents" className="rounded-[1.75rem] border border-purple-100 bg-white/85 p-5 shadow-[0_16px_55px_rgba(88,28,135,0.06)]">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                <FileText size={20} />
              </span>
              <div>
                <h3 className="font-black text-slate-950">Documents</h3>
                <p className="text-sm font-medium text-slate-500">Session documents will appear here when available.</p>
              </div>
            </div>
          </div>

          <div id="settings" className="rounded-[1.75rem] border border-purple-100 bg-white/85 p-5 shadow-[0_16px_55px_rgba(88,28,135,0.06)]">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                <Settings size={20} />
              </span>
              <div>
                <h3 className="font-black text-slate-950">Preferences</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="mt-1 text-sm font-black text-purple-700 underline underline-offset-4"
                >
                  Edit profile details
                </button>
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#faf9f7] p-5 shadow-xl sm:p-7"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <h2 id="settings-title" className="font-playfair text-2xl font-semibold text-[#34213f]">Settings</h2>
                    <p className="mt-1 text-sm text-slate-600">Account help, privacy, and data controls.</p>
                  </div>
                  <button type="button" onClick={() => setShowSettingsModal(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => { setShowSettingsModal(false); setShowEditModal(true); }} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300">
                    <span className="font-semibold text-slate-900">Personal details</span>
                    <span className="mt-1 block text-sm text-slate-500">Update your name, phone, or WhatsApp number.</span>
                  </button>
                  <button type="button" onClick={() => document.getElementById('support-request-form')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300">
                    <span className="font-semibold text-slate-900">Report a problem</span>
                    <span className="mt-1 block text-sm text-slate-500">Submit a website, payment, or booking issue.</span>
                  </button>
                </div>

                <div id="support-request-form"><SupportRequestPanel /></div>
                <PrivacyRequestPanel />

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-semibold text-slate-900">Delete account</h3>
                  <p className="mt-1 text-sm text-slate-500">Submit your account for deletion review, subject to legal retention requirements.</p>
                  <button type="button" onClick={() => { setShowSettingsModal(false); setShowDeleteModal(true); }} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800">
                    <Trash2 size={16} />
                    Request account deletion
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <NoteModal
          isOpen={!!noteModal}
          note={noteModal?.note ?? null}
          title={noteModal?.title}
          onClose={() => setNoteModal(null)}
        />
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
