'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import Link from 'next/link';
import { User, Phone, Edit2, LogOut, Trash2, AlertTriangle, Check } from 'lucide-react';

interface Booking {
  id: string;
  session_type: string;
  status: string;
  notes?: string | null;
  sessions_taken_before?: number | null;
  meeting_link?: string;
  meeting_links?: string[];
  meeting_password?: string;
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
    slotId?: string;
  }>;
  sessionNumber?: number;
  totalSessions?: number;
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone_number: '', whatsapp_number: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'created'>('recent');
  const [rescheduleModal, setRescheduleModal] = useState<{ bookingId: string; sessionIndex?: number } | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

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
        // Sign out and redirect after successful deletion
        await signOut({ callbackUrl: '/' });
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
        
        // Try to fetch user, if not found create them
        let { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();

        // If user doesn't exist (no data returned), create them
        if (!userData && !userError) {
          console.log('Creating user:', session.user.email);
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([
              {
                email: session.user.email,
                name: session.user.name || '',
                role: 'user',
                phone_number: null,
              },
            ])
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating user - Full error:', JSON.stringify(createError, null, 2));
            console.error('Error code:', createError.code);
            console.error('Error message:', createError.message);
            
            // Try creating user with minimal fields if the above fails
            if (createError.code === '23502' || createError.message?.includes('phone_number')) {
              console.log('Retrying without phone_number column...');
              const { data: minimalUser, error: retryError } = await supabase
                .from('users')
                .insert([
                  {
                    email: session.user.email,
                    name: session.user.name || '',
                    role: 'user',
                  },
                ])
                .select('id')
                .single();

              if (retryError) {
                console.error('Retry failed:', JSON.stringify(retryError, null, 2));
                setError('Could not create user profile. Please check Supabase database permissions.');
                setLoading(false);
                return;
              }
              
              userData = minimalUser;
            } else {
              setError('Could not create user profile. Please check Supabase database.');
              setLoading(false);
              return;
            }
          } else if (newUser) {
            userData = newUser;
          }
        }

        if (userError || !userData) {
          console.error('User fetch error:', userError);
          setError('Could not load your profile. Please refresh and try again.');
          setLoading(false);
          return;
        }

        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        console.log('🔍 Fetching bookings via API for userId:', userData.id);

        // Fetch bookings via API endpoint (uses service role, bypasses RLS)
        const bookingsRes = await fetch('/api/bookings/user-bookings');
        const bookingsData = await bookingsRes.json();

        const bookings = bookingsData.bookings || [];
        const role = bookingsData.role || 'user';
        const bookingsError = bookingsData.error;

        console.log('📊 Bookings from API:', {
          count: bookings.length,
          role: role,
          error: bookingsError,
          bookings: bookings.map((b: any) => ({ id: b.id, user_id: b.user_id, slot_date: b.slot_date, status: b.status }))
        });

        setUserRole(role);

        if (bookingsError && bookings.length === 0) {
          console.error('Error fetching bookings:', bookingsError);
          setUpcomingBookings([]);
          setPastBookings([]);
          setAllBookings([]);
          setLoading(false);
          return;
        }

        if (!bookings || bookings.length === 0) {
          console.log('⚠️ No bookings found');
          setUpcomingBookings([]);
          setPastBookings([]);
          setAllBookings([]);
          setLoading(false);
          return;
        }

        // Map all bookings and expand bundle sessions
        const processedBookings: Booking[] = [];
        
        bookings.forEach((b: any) => {
          const baseBooking = {
            id: b.id,
            session_type: b.session_type,
            status: b.status,
            notes: b.notes,
            sessions_taken_before: b.sessions_taken_before,
            meeting_link: b.meeting_link,
            meeting_password: b.meeting_password,
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
          if (b.session_dates && Array.isArray(b.session_dates) && b.session_dates.length > 0) {
            b.session_dates.forEach((sessionDate: any, index: number) => {
              processedBookings.push({
                ...baseBooking,
                slot_date: sessionDate.date,
                slot_start_time: sessionDate.start_time,
                slot_end_time: sessionDate.end_time,
                meeting_link: b.meeting_links && b.meeting_links[index] ? b.meeting_links[index] : b.meeting_link,
                // Add session number info for display
                sessionNumber: index + 1,
                totalSessions: b.session_dates.length,
              });
            });
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
          setAllBookings(processedBookings);
          setUpcomingBookings([]);
          setPastBookings([]);
        } else {
          // For regular users, separate upcoming and past bookings
          const upcoming: Booking[] = [];
          const past: Booking[] = [];

          processedBookings.forEach((booking) => {
            if (booking.slot_date && booking.slot_date >= dateString) {
              upcoming.push(booking);
            } else {
              past.push(booking);
            }
          });

          console.log('👤 User view - upcoming:', upcoming.length, 'past:', past.length);
          setUpcomingBookings(upcoming);
          setPastBookings(past);
          setAllBookings([]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <motion.h1 variants={itemVariants} className="text-5xl font-bold text-gray-900 mb-4">
            My Profile
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-gray-600">
            Manage your therapy sessions and bookings
          </motion.p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            {error}
          </motion.div>
        )}

        {/* User Info */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-lg p-8 mb-12"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase mb-2">Full Name</p>
              <p className="text-2xl font-bold text-gray-900">{userProfile?.name || session?.user?.name || 'User'}</p>
              <p className="text-gray-600 mb-4">{userProfile?.email || session?.user?.email}</p>
              {userProfile?.phone_number && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone size={16} />
                  {userProfile.phone_number}
                </p>
              )}
              {!userProfile?.phone_number && (
                <p className="text-amber-600 flex items-center gap-2 font-semibold">
                  <AlertTriangle size={16} />
                  Phone number required to book sessions
                </p>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-3 pt-8 border-t flex-wrap">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
            <Link href="/appointment/type">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                + Book New Appointment
              </button>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete Profile
            </button>
          </motion.div>
        </motion.div>

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
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Delete Profile?</h2>
                
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete your profile? This action cannot be undone and all your bookings and data will be permanently deleted.
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
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookings Section - Different views for users vs admin/therapist */}
        {userRole === 'admin' || userRole === 'therapist' ? (
          // ADMIN/THERAPIST VIEW - Show all client bookings
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-gray-900 mb-6">
              {userRole === 'admin' ? 'All Client Bookings' : 'Your Client Bookings'}
            </motion.h2>

            {/* Bookings List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                  </div>
                  <p>Loading bookings...</p>
                </div>
              ) : allBookings.length === 0 ? (
                <motion.div variants={itemVariants} className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-lg">No bookings found</p>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-purple-600 bg-purple-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Client Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Session Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Session Time</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Sessions Before</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Meeting Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBookings.map((booking) => (
                        <tr 
                          key={`${booking.id}-admin-${booking.sessionNumber || 0}`}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            <div className="flex flex-col">
                              <span>{booking.user_name || 'N/A'}</span>
                              {booking.totalSessions && booking.totalSessions > 1 && (
                                <span className="text-xs font-semibold text-purple-600 mt-1">
                                  Session {booking.sessionNumber} of {booking.totalSessions}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{booking.user_email || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-700">{booking.user_phone || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-800">
                            {booking.slot_date ? format(new Date(booking.slot_date), 'MMM dd, yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {booking.slot_start_time && booking.slot_end_time ? `${booking.slot_start_time} - ${booking.slot_end_time}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              booking.session_type === 'personal' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-pink-100 text-pink-800'
                            }`}>
                              {booking.session_type === 'personal' ? 'Personal' : 'Couple'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                                {booking.notes || 'No note added'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-semibold">
                            {booking.sessions_taken_before ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            {booking.meeting_link ? (
                              <a 
                                href={booking.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 font-medium text-sm underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          // REGULAR USER VIEW - Show upcoming and past tabs
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Upcoming Sessions ({upcomingBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'past'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Past Sessions ({pastBookings.length})
              </button>
            </motion.div>

            {/* Sort Options - Only show for upcoming sessions */}
            {activeTab === 'upcoming' && upcomingBookings.length > 0 && (
              <motion.div variants={itemVariants} className="mb-6 flex gap-3 flex-wrap">
                <span className="text-gray-700 font-semibold flex items-center">Sort by:</span>
                <button
                  onClick={() => setSortOption('recent')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    sortOption === 'recent'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                  }`}
                >
                  Most Recent
                </button>
                <button
                  onClick={() => setSortOption('oldest')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    sortOption === 'oldest'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                  }`}
                >
                  Oldest First
                </button>
                <button
                  onClick={() => setSortOption('created')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    sortOption === 'created'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                  }`}
                >
                  Date Booked
                </button>
              </motion.div>
            )}

            {/* Bookings List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                  </div>
                  <p>Loading your bookings...</p>
                </div>
              ) : activeTab === 'upcoming' ? (
                upcomingBookings.length === 0 ? (
                  <motion.div variants={itemVariants} className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                    <p className="text-lg mb-4">No upcoming sessions</p>
                    <p className="text-sm mb-6">You haven't booked any therapy sessions yet.</p>
                    <Link href="/appointment/type">
                      <button className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all">
                        Book Your First Appointment
                      </button>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants} className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-purple-600 bg-purple-50">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">User Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Session Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Session Time</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Type of Session</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Sessions Before</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Meeting Link</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSortedUpcomingBookings().map((booking, idx) => {
                          // Check if this is part of a bundle
                          const isBundle = booking.totalSessions && booking.totalSessions > 1;
                          const sessionIndex = isBundle ? (booking.sessionNumber ? booking.sessionNumber - 1 : 0) : undefined;
                          
                          return (
                            <tr 
                              key={`${booking.id}-${booking.sessionNumber || 0}`}
                              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-gray-800">
                                <div className="flex flex-col">
                                  <span>{booking.user_name || 'N/A'}</span>
                                  {isBundle && (
                                    <span className="text-xs font-semibold text-purple-600 mt-1">
                                      Session {booking.sessionNumber} of {booking.totalSessions}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-800">
                                {booking.slot_date ? format(new Date(booking.slot_date), 'MMM dd, yyyy') : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-gray-800">
                                {booking.slot_start_time && booking.slot_end_time ? `${booking.slot_start_time} - ${booking.slot_end_time}` : 'N/A'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  booking.session_type === 'personal' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-pink-100 text-pink-800'
                                }`}>
                                  {booking.session_type === 'personal' ? 'Personal' : 'Couple'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                <div className="max-w-xs">
                                  <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                                    {booking.notes || 'No note added'}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-800 font-semibold">
                                {booking.sessions_taken_before ?? 0}
                              </td>
                              <td className="px-4 py-3">
                                {booking.meeting_link ? (
                                  <a 
                                    href={booking.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 font-medium underline"
                                  >
                                    Join Meeting
                                  </a>
                                ) : (
                                  <span className="text-gray-400">Not available</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setRescheduleModal({ bookingId: booking.id, sessionIndex })}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
                                >
                                  Reschedule
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </motion.div>
                )
              ) : pastBookings.length === 0 ? (
                <motion.div variants={itemVariants} className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-lg">No past sessions yet</p>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-purple-600 bg-purple-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">User Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Session Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Session Time</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Type of Session</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Sessions Before</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Meeting Link</th>
                        </tr>
                    </thead>
                    <tbody>
                      {pastBookings.map((booking) => (
                        <tr 
                          key={`${booking.id}-past-${booking.sessionNumber || 0}`}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors opacity-75"
                        >
                          <td className="px-4 py-3 text-gray-800">
                            <div className="flex flex-col">
                              <span>{booking.user_name || 'N/A'}</span>
                              {booking.totalSessions && booking.totalSessions > 1 && (
                                <span className="text-xs font-semibold text-purple-600 mt-1">
                                  Session {booking.sessionNumber} of {booking.totalSessions}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {booking.slot_date ? format(new Date(booking.slot_date), 'MMM dd, yyyy') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {booking.slot_start_time && booking.slot_end_time ? `${booking.slot_start_time} - ${booking.slot_end_time}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              booking.session_type === 'personal' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-pink-100 text-pink-800'
                            }`}>
                              {booking.session_type === 'personal' ? 'Personal' : 'Couple'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                                {booking.notes || 'No note added'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-semibold">
                            {booking.sessions_taken_before ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            {booking.meeting_link ? (
                              <a 
                                href={booking.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 font-medium underline"
                              >
                                Join Meeting
                              </a>
                            ) : (
                              <span className="text-gray-400">Not available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Reschedule Modal */}
        <AnimatePresence>
          {rescheduleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRescheduleModal(null)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Reschedule Session</h2>
                
                <p className="text-gray-700 mb-6">
                  You'll be redirected to select a new date and time for your session. No charges will apply.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setRescheduleModal(null)}
                    disabled={rescheduleLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams({
                        reschedule: rescheduleModal.bookingId,
                      });
                      if (rescheduleModal.sessionIndex !== undefined) {
                        params.append('sessionIndex', rescheduleModal.sessionIndex.toString());
                      }
                      router.push(`/appointment/slots?${params.toString()}`);
                      setRescheduleModal(null);
                    }}
                    disabled={rescheduleLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    Continue to Select Slots
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
