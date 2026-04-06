'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import TherapistHeader from './TherapistHeader';

interface SlotInfo {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
}

const BookingConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const supabase = createClient();

  const sessionType = searchParams.get('type') || 'personal';
  const slotId = searchParams.get('slotId');
  const selectedDate = searchParams.get('date');

  // Price state
  const [prices, setPrices] = useState({ personal: 1200, couple: 1500 });
  const sessionPrice = prices[sessionType as keyof typeof prices] || 1200;

  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Fetch pricing settings
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (response.ok) {
          const data = await response.json();
          setPrices(data.prices);
        }
      } catch (err) {
        console.error('Error fetching prices:', err);
        // Use defaults if fetch fails
      }
    };

    fetchPrices();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/update-profile');
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          // Show phone modal if phone number is missing
          if (!profile.phone_number) {
            setShowPhoneModal(true);
          }
        } else if (response.status === 401) {
          // User not authenticated
          console.log('User not authenticated');
        } else {
          console.error('Failed to fetch profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    if (session?.user?.email) {
      fetchUserProfile();
    }
  }, [session]);

  // Fetch slot details
  useEffect(() => {
    const fetchSlotInfo = async () => {
      if (!slotId) return;

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('therapy_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (fetchError) {
        setError('Failed to load slot information');
      } else if (data) {
        setSlotInfo(data);
      }
      setLoading(false);
    };

    fetchSlotInfo();
  }, [slotId, supabase]);

  const handleSavePhoneNumber = async () => {
    if (!phoneInput.trim()) {
      setPhoneError('Phone number is required');
      return;
    }

    const phoneDigits = phoneInput.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setPhoneError('Phone number must have at least 10 digits');
      return;
    }

    setSavingPhone(true);
    setPhoneError('');

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfile?.name || session?.user?.name || '',
          phone_number: phoneInput.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save phone number');
      }

      const updated = await response.json();
      setUserProfile(updated.user);
      setShowPhoneModal(false);
      setPhoneInput('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save phone number';
      setPhoneError(errorMsg);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!session?.user?.email || !slotId || !slotInfo) {
      setError('Missing required information');
      return;
    }

    // Check if phone number is set
    if (!userProfile?.phone_number) {
      setShowPhoneModal(true);
      return;
    }

    setConfirming(true);
    setError('');

    try {
      // Redirect to payment page instead of creating booking directly
      const params = new URLSearchParams({
        type: sessionType,
        slotId: slotId,
        date: slotInfo.date,
      });
      router.push(`/appointment/payment?${params.toString()}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Navigation error:', errorMsg);
      setError(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  if (!session) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
        >
          {/* Header */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmation</h1>
          <p className="text-gray-600 mb-8">Review your appointment details</p>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
            >
              {error}
            </motion.div>
          )}

          {loading ? (
            <div className="text-center py-12">Loading booking details...</div>
          ) : (
            <>
              {/* Booking Details - Horizontal Layout */}
              {slotInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Session Date */}
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Session Date
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {format(new Date(slotInfo.date), 'MMM dd, yyyy')}
                      </p>
                    </div>

                    {/* Session Time */}
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Session Time
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {slotInfo.start_time} - {slotInfo.end_time}
                      </p>
                    </div>

                    {/* Session Type */}
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Session Type
                      </p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{sessionType}</p>
                    </div>

                    {/* Therapist */}
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Therapist
                      </p>
                      <p className="text-lg font-bold text-gray-900">Neetu Rathore</p>
                    </div>

                    {/* Duration */}
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Duration
                      </p>
                      <p className="text-lg font-bold text-gray-900">40 mins</p>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Price
                      </p>
                      <p className="text-lg font-bold text-purple-600">₹{sessionPrice}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="p-6 bg-blue-50 border border-blue-200 rounded-2xl mb-8"
              >
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> A Google Meet link will be sent to your email{' '}
                  <span className="font-semibold">{session.user?.email}</span> once the booking is confirmed.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex gap-4"
              >
                <button
                  onClick={() => router.back()}
                  disabled={confirming}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={confirming}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {confirming ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Phone Number Modal */}
        <AnimatePresence>
          {showPhoneModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!savingPhone) setShowPhoneModal(false);
              }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Phone Number Required</h2>
                <p className="text-gray-600 mb-6">
                  We need your phone number to complete your booking. This helps us send you session reminders and updates.
                </p>

                {phoneError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  >
                    {phoneError}
                  </motion.div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number ({phoneInput.replace(/\D/g, '').length} digits)
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter your phone number (e.g., +91 98765 43210)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-lg"
                    disabled={savingPhone}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Include country code, minimum 10 digits
                  </p>
                </div>

                <div className="flex gap-3">
                  {!userProfile?.phone_number && (
                    <button
                      onClick={() => router.back()}
                      disabled={savingPhone}
                      className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSavePhoneNumber}
                    disabled={savingPhone}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {savingPhone ? 'Saving...' : 'Continue'}
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

export default BookingConfirmation;
