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

interface StoredSlotInfo {
  id?: string;
  slotId?: string;
  date: string;
  startTime: string;
  endTime: string;
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

interface PayUPaymentPayload {
  acsTemplate?: string;
  deepLink?: string;
  paymentUrl?: string;
  fields?: Record<string, unknown>;
  flow?: 'hosted_checkout' | 'upi_intent' | 'upi_qr';
  error?: string;
  intentUriData?: string;
  merchantName?: string;
  merchantVpa?: string;
  otpPostUrl?: string;
  paymentId?: string;
  txnid?: string;
}

interface BookingCreateResponse {
  booking?: {
    id: string;
  };
  error?: string;
}

const PAYMENT_SESSION_DATES_STORAGE_KEY = 'pendingPaymentSessionDates';
const PAYMENT_SLOT_INFO_STORAGE_KEY = 'pendingPaymentSlotInfo';
const PAYU_PENDING_TXN_STORAGE_KEY = 'payuPendingTxnId';

type PaymentDeviceKind = 'desktop' | 'android' | 'ios' | 'other-mobile';
type UpiAppOption = 'any' | 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'qr';

const ANDROID_UPI_APP_PACKAGES: Record<Exclude<UpiAppOption, 'any' | 'qr'>, string> = {
  bhim: 'in.org.npci.upiapp',
  gpay: 'com.google.android.apps.nbu.paisa.user',
  paytm: 'net.one97.paytm',
  phonepe: 'com.phonepe.app',
};

const UPI_APP_LABELS: Record<UpiAppOption, string> = {
  any: 'Pay with any UPI app',
  bhim: 'BHIM',
  gpay: 'Google Pay',
  paytm: 'Paytm',
  phonepe: 'PhonePe',
  qr: 'Dynamic QR',
};

const IOS_UPI_APP_PREFIXES: Record<Exclude<UpiAppOption, 'any' | 'qr'>, string> = {
  bhim: 'bhim://upi/pay?',
  gpay: 'gpay://upi/pay?',
  paytm: 'paytm://upi/pay?',
  phonepe: 'phonepe://upi/pay?',
};

function getPaymentDeviceKind(userAgent: string): PaymentDeviceKind {
  const normalizedUserAgent = userAgent.toLowerCase();

  if (/android/.test(normalizedUserAgent)) {
    return 'android';
  }

  if (/iphone|ipad|ipod/.test(normalizedUserAgent)) {
    return 'ios';
  }

  if (/mobile/.test(normalizedUserAgent)) {
    return 'other-mobile';
  }

  return 'desktop';
}

function buildAndroidIntentTarget(deepLink: string, upiApp: UpiAppOption) {
  if (upiApp === 'any' || upiApp === 'qr') {
    return deepLink;
  }

  const packageName = ANDROID_UPI_APP_PACKAGES[upiApp];
  const query = deepLink.replace(/^upi:\/\/pay\?/, '');
  return `intent://pay?${query}#Intent;scheme=upi;package=${packageName};end`;
}

function buildIosIntentTarget(intentUriData: string, upiApp: Exclude<UpiAppOption, 'any' | 'qr'>) {
  return `${IOS_UPI_APP_PREFIXES[upiApp]}${intentUriData.replace(/^upi:\/\/pay\?/, '')}`;
}

function parseSessionDates(value: string | null): SessionDate[] {
  if (!value) {
    return [];
  }

  let attempt = value;

  for (let depth = 0; depth < 4; depth += 1) {
    const normalizedAttempt = attempt.replace(/\+/g, ' ');

    try {
      const parsed = JSON.parse(normalizedAttempt);

      if (Array.isArray(parsed)) {
        return parsed as SessionDate[];
      }

      if (typeof parsed === 'string') {
        attempt = parsed;
        continue;
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        break;
      }
    }

    try {
      const decoded = decodeURIComponent(normalizedAttempt);

      if (decoded === attempt) {
        break;
      }

      attempt = decoded;
      continue;
    } catch {
      break;
    }
  }

  console.error('Failed to parse sessionDates:', value);
  return [];
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const supabase = createClient();

  const sessionType = searchParams.get('type') || 'personal';
  const slotId = searchParams.get('slotId');
  const selectedDate = searchParams.get('date');
  const selectedStartTime = searchParams.get('startTime');
  const selectedEndTime = searchParams.get('endTime');
  const paymentStatus = searchParams.get('paymentStatus');
  const paymentError = searchParams.get('paymentError');
  const bundle = searchParams.get('bundle') ? parseInt(searchParams.get('bundle')!) : null;
  const hasBundleContext = Boolean(bundle || searchParams.get('sessionDates'));
  const [sessionDates, setSessionDates] = useState<SessionDate[]>([]);
  const [sessionDatesLoaded, setSessionDatesLoaded] = useState(false);

  const isBundleBooking = sessionDatesLoaded ? sessionDates.length > 0 : false;
  const bundleSize = isBundleBooking ? sessionDates.length : 1;

  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [cachedSlotInfo, setCachedSlotInfo] = useState<SlotInfo | null>(null);
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
  const [processingMode, setProcessingMode] = useState<'card' | 'upi' | 'test' | null>(null);
  const [error, setError] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [appointmentNote, setAppointmentNote] = useState('');
  const [paymentDevice, setPaymentDevice] = useState<PaymentDeviceKind>('desktop');
  const [qrPaymentHtml, setQrPaymentHtml] = useState('');
  const [qrTxnId, setQrTxnId] = useState('');

  // Calculate price based on bundle size
  const priceKey = `${sessionType}_${bundleSize}` as keyof typeof prices;
  const sessionPrice = prices[priceKey] || 0;
  const totalPrice = sessionPrice;
  const supportsAndroidSmartIntent = paymentDevice === 'android';
  const supportsIosSpecificIntent = paymentDevice === 'ios';
  const showsDesktopQrFlow = paymentDevice === 'desktop';
  const showUpiButtons = supportsAndroidSmartIntent;
  const showIosUpiButtons = supportsIosSpecificIntent;
  const resolvedSingleSlotInfo =
    slotInfo ||
    cachedSlotInfo ||
    (slotId && selectedDate && selectedStartTime && selectedEndTime
      ? {
          id: slotId,
          date: selectedDate,
          start_time: selectedStartTime,
          end_time: selectedEndTime,
        }
      : null);

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

  // Load bundle session dates from sessionStorage first, then fall back to the URL.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hasBundleContext) {
      setSessionDates([]);
      setSessionDatesLoaded(true);
      return;
    }

    const storedSessionDates = window.sessionStorage.getItem(PAYMENT_SESSION_DATES_STORAGE_KEY);
    const parsedStoredSessionDates = parseSessionDates(storedSessionDates);

    if (parsedStoredSessionDates.length > 0) {
      setSessionDates(parsedStoredSessionDates);
      setSessionDatesLoaded(true);
      return;
    }

    setSessionDates(parseSessionDates(searchParams.get('sessionDates')));
    setSessionDatesLoaded(true);
  }, [hasBundleContext, searchParams]);

  // Load cached single-slot details so we can recover if the slot row is no longer readable.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasBundleContext || !slotId) return;

    const storedSlotInfo = window.sessionStorage.getItem(PAYMENT_SLOT_INFO_STORAGE_KEY);
    if (!storedSlotInfo) return;

    try {
      const parsed = JSON.parse(storedSlotInfo) as StoredSlotInfo;
      if (parsed?.slotId === slotId || parsed?.id === slotId) {
        const fallbackSlotInfo = {
          id: parsed.id || parsed.slotId || slotId,
          date: parsed.date,
          start_time: parsed.startTime,
          end_time: parsed.endTime,
        };
        setCachedSlotInfo(fallbackSlotInfo);
        if (!slotInfo) {
          setSlotInfo(fallbackSlotInfo);
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached single-slot payment info:', error);
    }
  }, [hasBundleContext, slotId, slotInfo]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedNote = window.sessionStorage.getItem('appointmentNote') || '';
    setAppointmentNote(storedNote);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setPaymentDevice(getPaymentDeviceKind(window.navigator.userAgent));
  }, []);

  useEffect(() => {
    if (paymentStatus === 'failed') {
      setError(paymentError || 'Payment failed. Please try again.');
    }
  }, [paymentStatus, paymentError]);

  // Fetch slot details (for single bookings only)
  useEffect(() => {
    if (!sessionDatesLoaded) {
      return;
    }

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
          if (resolvedSingleSlotInfo) {
            console.warn('Using fallback slot info after fetch failure:', slotId);
            setSlotInfo(resolvedSingleSlotInfo);
            setError('');
            return;
          }

          setError('Failed to load slot information: ' + JSON.stringify(fetchError));
        } else if (data) {
          console.log('Slot loaded:', data);
          setSlotInfo(data);
        } else {
          console.warn('No slot data and no error');
          if (resolvedSingleSlotInfo) {
            console.warn('Using fallback slot info after empty fetch result:', slotId);
            setSlotInfo(resolvedSingleSlotInfo);
            setError('');
            return;
          }

          setError('Slot not found');
        }
      } catch (err) {
        console.error('Error fetching slot:', err);
        if (resolvedSingleSlotInfo) {
          console.warn('Using fallback slot info after exception:', slotId);
          setSlotInfo(resolvedSingleSlotInfo);
          setError('');
          return;
        }

        setError('Error loading slot information');
      } finally {
        setLoading(false);
      }
    };

    fetchSlotInfo();
  }, [slotId, isBundleBooking, sessionDatesLoaded, supabase]);

  const getBookingPayload = (userId: string) => {
    const payload: Record<string, unknown> = {
      userId,
      sessionType,
      notes:
        appointmentNote ||
        (typeof window !== 'undefined' ? window.sessionStorage.getItem('appointmentNote') || undefined : undefined),
    };

    if (isBundleBooking) {
      payload.bundle = bundle;
      payload.sessionDates = sessionDates;
    } else {
      payload.slotId = slotId;
    }

    return payload;
  };

  const clearPendingBookingStorage = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.removeItem('appointmentNote');
    window.sessionStorage.removeItem('appointmentSessionType');
    window.sessionStorage.removeItem('appointmentBundleSize');
    window.sessionStorage.removeItem(PAYMENT_SLOT_INFO_STORAGE_KEY);
    window.sessionStorage.removeItem(PAYMENT_SESSION_DATES_STORAGE_KEY);
    window.sessionStorage.removeItem(PAYU_PENDING_TXN_STORAGE_KEY);
  };

  const getPayUOrderPayload = (userId: string, paymentMode: string, upiAppName?: UpiAppOption) => {
    const orderPayload: Record<string, unknown> = {
      amount: totalPrice,
      sessionType,
      userEmail: session?.user?.email,
      userId,
      userName: userProfile?.name || session?.user?.name || 'User',
      userPhone: userProfile?.phone_number || '',
      notes: getBookingPayload(userId).notes,
      paymentMode,
      upiAppName,
    };

    if (isBundleBooking) {
      orderPayload.bundle = bundle;
      orderPayload.sessionDates = sessionDates;
    } else {
      orderPayload.slotId = slotId;
      orderPayload.date = resolvedSingleSlotInfo?.date;
      orderPayload.startTime = resolvedSingleSlotInfo?.start_time;
      orderPayload.endTime = resolvedSingleSlotInfo?.end_time;
    }

    if (typeof window !== 'undefined') {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.delete('paymentStatus');
      returnUrl.searchParams.delete('paymentError');
      orderPayload.returnUrl = returnUrl.toString();
    }

    return orderPayload;
  };

  const createPayUOrder = async (paymentMode: string, upiAppName?: UpiAppOption) => {
    const userResponse = await fetch('/api/user/get-id');
    if (!userResponse.ok) {
      throw new Error('User not found');
    }

    const userData = await userResponse.json();
    const { userId } = userData;

    if (!userId) {
      throw new Error('User not found');
    }

    const paymentResponse = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getPayUOrderPayload(userId, paymentMode, upiAppName)),
    });

    const paymentText = await paymentResponse.text();
    const responseText = paymentText.trim();

    if (!responseText) {
      throw new Error('Empty response from payment server');
    }

    let paymentData: PayUPaymentPayload;
    try {
      paymentData = JSON.parse(responseText);
    } catch {
      throw new Error('Invalid PayU response from server');
    }

    if (!paymentResponse.ok) {
      throw new Error(paymentData?.error || responseText || 'Failed to create PayU payment');
    }

    if (typeof window !== 'undefined' && paymentData.txnid) {
      window.sessionStorage.setItem(PAYU_PENDING_TXN_STORAGE_KEY, paymentData.txnid);
    }

    return paymentData;
  };

  const validatePaymentReadiness = () => {
    if (loading) {
      setError('Still loading booking details. Please wait...');
      return false;
    }

    if (!session?.user?.email) {
      setError('Not authenticated');
      return false;
    }

    if (!isBundleBooking && !slotId) {
      setError('No booking information provided');
      return false;
    }

    if (isBundleBooking && !slotInfo) {
      console.warn('Slot info not loaded for bundle booking, but continuing...');
    } else if (!isBundleBooking) {
      if (!resolvedSingleSlotInfo) {
        setError('Slot information not loaded');
        return false;
      }

      if (!slotInfo) {
        setSlotInfo(resolvedSingleSlotInfo);
      }
    }

    return true;
  };

  const handleCardPayment = async () => {
    if (!validatePaymentReadiness()) {
      return;
    }

    setProcessing(true);
    setProcessingMode('card');
    setError('');
    setQrPaymentHtml('');
    setQrTxnId('');

    try {
      const paymentData = await createPayUOrder('cards');

      if (paymentData.flow !== 'hosted_checkout' || !paymentData.paymentUrl || !paymentData.fields) {
        throw new Error('Invalid PayU hosted checkout payload');
      }

      clearPendingBookingStorage();

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentData.paymentUrl;
      form.style.display = 'none';

      Object.entries(paymentData.fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value ?? '');
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Card payment error:', errorMsg, err);
      setError(errorMsg);
      setProcessing(false);
      setProcessingMode(null);
    }
  };

  const handleDesktopQrPayment = async () => {
    if (!validatePaymentReadiness()) {
      return;
    }

    setProcessing(true);
    setProcessingMode('upi');
    setError('');

    try {
      const paymentData = await createPayUOrder('upi_qr', 'qr');

      if (paymentData.flow !== 'upi_qr' || !paymentData.acsTemplate) {
        throw new Error('Invalid PayU QR payload');
      }

      setQrPaymentHtml(window.atob(paymentData.acsTemplate));
      setQrTxnId(paymentData.txnid || '');
      setProcessing(false);
      setProcessingMode(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Desktop QR payment error:', errorMsg, err);
      setError(errorMsg);
      setProcessing(false);
      setProcessingMode(null);
    }
  };

  const handleAndroidUpiIntent = async (upiApp: UpiAppOption) => {
    if (!validatePaymentReadiness()) {
      return;
    }

    setProcessing(true);
    setProcessingMode('upi');
    setError('');
    setQrPaymentHtml('');
    setQrTxnId('');

    try {
      const paymentData = await createPayUOrder('upi_intent', upiApp);

      if (paymentData.flow !== 'upi_intent' || !paymentData.deepLink) {
        throw new Error('Invalid PayU Smart Intent payload');
      }

      window.location.href = buildAndroidIntentTarget(paymentData.deepLink, upiApp);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Android UPI intent error:', errorMsg, err);
      setError(errorMsg);
      setProcessing(false);
      setProcessingMode(null);
    }
  };

  const handleIosUpiIntent = async (upiApp: Exclude<UpiAppOption, 'any' | 'qr'>) => {
    if (!validatePaymentReadiness()) {
      return;
    }

    setProcessing(true);
    setProcessingMode('upi');
    setError('');
    setQrPaymentHtml('');
    setQrTxnId('');

    try {
      const paymentData = await createPayUOrder('upi_intent', upiApp);
      const intentUriData = paymentData.intentUriData || paymentData.deepLink?.replace(/^upi:\/\/pay\?/, '') || '';

      if (paymentData.flow !== 'upi_intent' || !intentUriData) {
        throw new Error('Invalid PayU iPhone UPI payload');
      }

      window.location.href = buildIosIntentTarget(intentUriData, upiApp);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('iOS UPI intent error:', errorMsg, err);
      setError(errorMsg);
      setProcessing(false);
      setProcessingMode(null);
    }
  };

  const handleTestModeBooking = async () => {
    if (loading) {
      setError('Still loading booking details. Please wait...');
      return;
    }

    if (!session?.user?.email) {
      setError('Not authenticated');
      return;
    }

    if (!isBundleBooking && !slotId) {
      setError('No booking information provided');
      return;
    }

    if (!isBundleBooking && !resolvedSingleSlotInfo) {
      setError('Slot information not loaded');
      return;
    }

    setProcessing(true);
    setProcessingMode('test');
    setError('');

    try {
      const userResponse = await fetch('/api/user/get-id');
      if (!userResponse.ok) {
        throw new Error('User not found');
      }

      const userData = await userResponse.json();
      const { userId } = userData;

      if (!userId) {
        throw new Error('User not found');
      }

      const bookingResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getBookingPayload(userId)),
      });

      const bookingData = (await bookingResponse.json()) as BookingCreateResponse;

      if (!bookingResponse.ok || !bookingData.booking?.id) {
        throw new Error(bookingData.error || 'Failed to create test booking');
      }

      clearPendingBookingStorage();
      router.push(`/appointment/success?bookingId=${bookingData.booking.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      console.error('Test booking error:', errorMsg, err);
      setError(errorMsg);
      setProcessing(false);
      setProcessingMode(null);
    }
  };

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

              {!isBundleBooking && !slotInfo && resolvedSingleSlotInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Date</span>
                      <span className="font-semibold text-gray-900">
                        {format(new Date(resolvedSingleSlotInfo.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Time</span>
                      <span className="font-semibold text-gray-900">
                        {resolvedSingleSlotInfo.start_time} - {resolvedSingleSlotInfo.end_time}
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
                      <span className="text-gray-600">Bundle Price</span>
                      <span className="font-semibold text-gray-900">₹{totalPrice}</span>
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
                      <span className="text-2xl font-bold text-purple-600">₹{totalPrice}</span>
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
                  <strong>UPI mode:</strong>{' '}
                  {showsDesktopQrFlow
                    ? 'Desktop uses PayU dynamic QR only.'
                    : supportsAndroidSmartIntent
                    ? 'Android mobile web uses PayU Smart Intent.'
                    : supportsIosSpecificIntent
                    ? 'iPhone web uses app-specific UPI deeplinks with limited availability.'
                    : 'UPI app intents are enabled on Android mobile web, while desktop uses dynamic QR.'}
                </p>
                <p className="mt-2 text-xs text-blue-700">
                  Card payments continue through PayU hosted checkout. For local testing, you can still use Test Mode below.
                </p>
              </motion.div>

              {/* PayU Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 md:p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-purple-300 rounded-2xl mb-8"
              >
                <div className="mx-auto max-w-3xl">
                  <div className="grid gap-6">
                    <div className="border border-purple-100 bg-white px-6 py-6 shadow-sm">
                      <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Pay by Card</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">₹{totalPrice}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Debit and credit card payments continue on PayU hosted checkout.
                      </p>
                      <button
                        onClick={handleCardPayment}
                        disabled={processing || !agreementChecked}
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                      >
                        {processingMode === 'card' ? 'Redirecting to PayU...' : 'Pay by Card'}
                      </button>
                    </div>

                    <div className="border border-slate-200 bg-white px-6 py-6 shadow-sm">
                      <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Pay by UPI</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">₹{totalPrice}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {showsDesktopQrFlow
                          ? 'Generate a dynamic QR and scan it from any UPI app.'
                          : supportsAndroidSmartIntent
                          ? 'Open the payment directly in your preferred UPI app using PayU Smart Intent.'
                          : supportsIosSpecificIntent
                          ? 'Open the payment in a supported iPhone UPI app using the app-specific deeplink PayU documents for iOS.'
                          : 'UPI intent buttons are available on Android mobile web. On desktop, this flow uses a dynamic QR.'}
                      </p>

                      {showsDesktopQrFlow && (
                        <div className="mt-4 space-y-4">
                          <button
                            onClick={handleDesktopQrPayment}
                            disabled={processing || !agreementChecked}
                            className="w-full rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition-colors hover:border-slate-400 disabled:opacity-50"
                          >
                            {processingMode === 'upi' ? 'Generating QR...' : 'Generate Dynamic UPI QR'}
                          </button>

                          {qrPaymentHtml && (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                              <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
                                Scan this dynamic QR using any UPI app. Do not close this page until the payment returns.
                                {qrTxnId ? ` Txn ID: ${qrTxnId}` : ''}
                              </div>
                              <iframe
                                title="PayU Dynamic UPI QR"
                                srcDoc={qrPaymentHtml}
                                className="h-[520px] w-full bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {showUpiButtons && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {(['any', 'phonepe', 'gpay', 'paytm', 'bhim'] as UpiAppOption[]).map((upiApp) => (
                            <button
                              key={upiApp}
                              onClick={() => handleAndroidUpiIntent(upiApp)}
                              disabled={processing || !agreementChecked}
                              className="rounded-xl border border-slate-300 px-4 py-3 text-left font-semibold text-slate-900 transition-colors hover:border-slate-400 disabled:opacity-50"
                            >
                              {processingMode === 'upi' ? 'Opening UPI app...' : UPI_APP_LABELS[upiApp]}
                            </button>
                          ))}
                        </div>
                      )}

                      {showIosUpiButtons && (
                        <div className="mt-4 space-y-4">
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            PayU marks iPhone app deeplinks as limited availability. The selected UPI app must be installed on the iPhone.
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {(['phonepe', 'gpay', 'paytm', 'bhim'] as Array<Exclude<UpiAppOption, 'any' | 'qr'>>).map((upiApp) => (
                              <button
                                key={upiApp}
                                onClick={() => handleIosUpiIntent(upiApp)}
                                disabled={processing || !agreementChecked}
                                className="rounded-xl border border-slate-300 px-4 py-3 text-left font-semibold text-slate-900 transition-colors hover:border-slate-400 disabled:opacity-50"
                              >
                                {processingMode === 'upi' ? 'Opening UPI app...' : UPI_APP_LABELS[upiApp]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!showsDesktopQrFlow && !showUpiButtons && !showIosUpiButtons && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          Use this page on Android mobile web for PayU Smart Intent, or switch to desktop to pay with dynamic QR.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={() => router.back()}
                    disabled={processing}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-gray-400 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleTestModeBooking}
                    disabled={processing || !agreementChecked}
                    className="flex-1 px-6 py-3 border-2 border-dashed border-purple-300 text-purple-700 rounded-xl font-semibold hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    {processingMode === 'test' ? 'Creating Test Booking...' : 'Test Mode: Skip Payment'}
                  </button>
                </div>
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
