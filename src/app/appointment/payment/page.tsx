'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import PaymentAgreement from '@/components/booking/PaymentAgreement';

interface SlotInfo {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface SessionDate {
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const supabase = createClient();

  const sessionType = searchParams.get('type') || 'personal';
  const slotId = searchParams.get('slotId');
  const selectedDate = searchParams.get('date');
  const bundle = searchParams.get('bundle') ? parseInt(searchParams.get('bundle')!) : null;
  const sessionDatesParam = searchParams.get('sessionDates');

  // Parse sessionDates if present (for bundle bookings)
  let sessionDates: SessionDate[] = [];
  if (sessionDatesParam) {
    try {
      sessionDates = JSON.parse(decodeURIComponent(sessionDatesParam));
    } catch (err) {
      console.error('Failed to parse sessionDates:', err);
    }
  }

  const isBundleBooking = sessionDates.length > 0;
  const bundleSize = isBundleBooking ? sessionDates.length : 1;

  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [prices, setPrices] = useState({
    personal_1: 2500,
    personal_2: 4500,
    personal_3: 6000,
    couple_1: 3500,
    couple_2: 6500,
    couple_3: 9000,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Calculate price based on bundle size
  const priceKey = `${sessionType}_${bundleSize}` as keyof typeof prices;
  const sessionPrice = prices[priceKey] || 0;

  // Debug logging
  useEffect(() => {
    console.log('Payment page state:', {
      sessionType,
      slotId,
      selectedDate,
      isBundleBooking,
      bundleSize,
      slotInfoLoaded: !!slotInfo,
      userProfileLoaded: !!userProfile,
      loading,
      error,
    });
  }, [sessionType, slotId, selectedDate, isBundleBooking, bundleSize, slotInfo, userProfile, loading, error]);

  // Fetch pricing settings
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (response.ok) {
          const data = await response.json();
          // API returns { success, pricing, timestamp } - extract pricing only
          if (data.pricing) {
            setPrices(data.pricing);
          }
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
        console.log('Fetching user profile...');
        const response = await fetch('/api/user/update-profile');
        console.log('Profile response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Profile data received:', data);
          setUserProfile(data);
        } else {
          const errorText = await response.text();
          console.error('Profile fetch failed:', response.status, errorText);
          if (response.status === 401) {
            setError('Not authenticated. Please log in again.');
          } else {
            setError(`Failed to load profile: ${response.status}`);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching profile:', errorMsg);
        setError(`Error loading profile: ${errorMsg}`);
      }
    };

    if (session?.user?.email) {
      fetchUserProfile();
    }
  }, [session]);

  // Fetch slot details (for single bookings only)
  useEffect(() => {
    if (isBundleBooking) {
      // For bundles, we don't fetch a single slot - just mark as loaded
      setLoading(false);
      return;
    }

    const fetchSlotInfo = async () => {
      if (!slotId) {
        setError('No slot ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('therapy_slots')
          .select('*')
          .eq('id', slotId)
          .single();

        console.log('Slot fetch response:', { data, fetchError, slotId });

        if (fetchError) {
          console.error('Slot fetch error:', fetchError);
          setError('Failed to load slot information: ' + JSON.stringify(fetchError));
        } else if (data) {
          console.log('Slot loaded:', data);
          setSlotInfo(data);
        } else {
          console.warn('No slot data and no error');
          setError('Slot not found');
        }
      } catch (err) {
        console.error('Error fetching slot:', err);
        setError('Error loading slot information');
      } finally {
        setLoading(false);
      }
    };

    fetchSlotInfo();
  }, [slotId, isBundleBooking, supabase]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (loading) {
      setError('Still loading booking details. Please wait...');
      return;
    }

    if (!session?.user?.email) {
      setError('Not authenticated');
      return;
    }

    // Validate we have either slotId (single) or sessionDates (bundle)
    if (!isBundleBooking && !slotId) {
      setError('No booking information provided');
      return;
    }

    if (isBundleBooking && !slotInfo) {
      console.warn('Slot info not loaded for bundle booking, but continuing...');
      // For bundles, slotInfo is not needed
    } else if (!isBundleBooking && !slotInfo) {
      setError('Slot information not loaded');
      return;
    }

    // Allow payment even if user profile is still loading - we'll use session user data
    // if (userProfile) {
    //   setError('User profile not loaded');
    //   return;
    // }

    setProcessing(true);
    setError('');

    try {
      // Step 1: Get user ID
      console.log('🔵 Step 1: Getting user ID...');
      const userResponse = await fetch('/api/user/get-id');
      if (!userResponse.ok) {
        throw new Error('User not found');
      }
      const userData = await userResponse.json();
      const { userId } = userData;

      if (!userId) {
        throw new Error('User not found');
      }

      console.log('✅ User ID:', userId);

      // Step 2: Create Razorpay order
      const totalAmount = isBundleBooking ? sessionPrice * bundleSize : sessionPrice;
      console.log('🔵 Step 2: Creating payment order with:', {
        amount: totalAmount,
        sessionType,
        userEmail: session.user.email,
        userId,
        isBundleBooking,
        bundleSize,
        slotId,
      });

      const orderPayload: any = {
        amount: isBundleBooking ? sessionPrice * bundleSize : sessionPrice,
        sessionType,
        userEmail: session.user.email,
        userId,
      };

      if (isBundleBooking) {
        orderPayload.bundle = bundle;
        orderPayload.sessionDates = sessionDates;
      } else {
        orderPayload.slotId = slotId;
        orderPayload.date = slotInfo?.date;
      }

      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const orderText = await orderResponse.text();
      console.log('Order response:', { status: orderResponse.status, body: orderText });

      if (!orderResponse.ok) {
        let orderError = 'Failed to create payment order';
        try {
          const errorData = JSON.parse(orderText);
          orderError = errorData.error || orderError;
        } catch {
          orderError = orderText || orderError;
        }
        throw new Error(orderError);
      }

      let orderData;
      try {
        orderData = JSON.parse(orderText);
      } catch {
        throw new Error('Invalid order response from server');
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Mental Health Platform',
        description: `${sessionType === 'couple' ? 'Couple' : 'Personal'} Therapy ${bundleSize > 1 ? `Bundle (${bundleSize} sessions)` : 'Session'}`,
        prefill: {
          name: userProfile?.name || session.user?.name || 'User',
          email: userProfile?.email || session.user?.email || '',
          contact: userProfile?.phone_number || '',
        },
        handler: async (response: any) => {
          try {
            // Step 4: Verify payment
            const verifyPayload: any = {
              orderId: orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              userId,
              userEmail: session.user.email,
              sessionType,
              userName: userProfile?.name || session.user?.name || 'User',
              userPhone: userProfile?.phone_number || '',
            };

            if (isBundleBooking) {
              verifyPayload.bundle = bundle;
              verifyPayload.sessionDates = sessionDates;
            } else {
              verifyPayload.slotId = slotId;
            }

            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(verifyPayload),
            });

            const verifyText = await verifyResponse.text();
            console.log('Verify response:', { status: verifyResponse.status, body: verifyText });

            if (!verifyResponse.ok) {
              let verifyError = 'Payment verification failed';
              try {
                const errorData = JSON.parse(verifyText);
                verifyError = errorData.error || verifyError;
              } catch {
                verifyError = verifyText || verifyError;
              }
              throw new Error(verifyError);
            }

            let verifyData;
            try {
              verifyData = JSON.parse(verifyText);
            } catch {
              throw new Error('Invalid verification response');
            }

            if (verifyData.success) {
              // Redirect to success page
              console.log('✅ Payment verified, redirecting to success...');
              router.push(`/appointment/success?bookingId=${verifyData.booking.id}`);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Payment verification failed';
            console.error('Payment verification error:', errorMsg, err);
            setError(errorMsg);
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError('Payment cancelled. Please try again.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Payment error:', errorMsg, err);
      setError(errorMsg);
      setProcessing(false);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment</h1>
          <p className="text-gray-600 mb-8">Complete your booking by making the payment</p>

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
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          ) : !isBundleBooking && !slotInfo ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold">Failed to load booking details</p>
              <p className="text-gray-500 text-sm mt-2">{error || 'Slot not found'}</p>
            </div>
          ) : (
            <>
              {/* Order Summary - Single Booking */}
              {slotInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Date</span>
                      <span className="font-semibold text-gray-900">
                        {format(new Date(slotInfo.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Time</span>
                      <span className="font-semibold text-gray-900">
                        {slotInfo.start_time} - {slotInfo.end_time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Type</span>
                      <span className="font-semibold text-gray-900 capitalize">{sessionType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold text-gray-900">40 mins</span>
                    </div>
                    <div className="border-t border-gray-300 pt-4 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-purple-600">₹{sessionPrice}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary - Bundle Booking */}
              {isBundleBooking && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Bundle Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Type</span>
                      <span className="font-semibold text-gray-900 capitalize">{sessionType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bundle Size</span>
                      <span className="font-semibold text-gray-900">{bundleSize} Sessions</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price per Session</span>
                      <span className="font-semibold text-gray-900">₹{sessionPrice}</span>
                    </div>

                    {/* Sessions List */}
                    <div className="border-t border-gray-300 pt-4 space-y-2">
                      <p className="font-semibold text-gray-900">Sessions:</p>
                      {sessionDates.map((session, idx) => (
                        <div key={idx} className="text-sm text-gray-600 ml-4">
                          <span className="font-medium">Session {idx + 1}:</span> {format(new Date(session.date), 'MMM dd')} at {session.startTime}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-300 pt-4 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-purple-600">₹{sessionPrice * bundleSize}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-blue-50 border border-blue-200 rounded-2xl mb-8"
              >
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You will be redirected to a secure payment gateway to complete your payment. A Google Meet link will be sent to your email once the payment is confirmed.
                </p>
              </motion.div>

              {/* Payment Agreement */}
              <PaymentAgreement 
                isChecked={agreementChecked}
                onCheck={setAgreementChecked}
              />

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4"
              >
                <button
                  onClick={() => router.back()}
                  disabled={processing}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processing || !agreementChecked}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Pay ₹${isBundleBooking ? sessionPrice * bundleSize : sessionPrice}`}
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function PaymentLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment page...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentPageContent />
    </Suspense>
  );
}
