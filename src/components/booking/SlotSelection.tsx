'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import TherapistHeader from './TherapistHeader';

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_blocked: boolean;
}

interface SessionSelection {
  date: string;
  slotId: string;
  startTime: string;
  endTime: string;
}

interface SlotSelectionProps {
  sessionType?: string;
  bundleSize?: number;
}

const SlotSelection = ({ sessionType = 'personal', bundleSize = 1 }: SlotSelectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Reschedule mode detection
  const rescheduleId = searchParams.get('reschedule');
  const rescheduleSessionIndex = searchParams.get('sessionIndex') ? parseInt(searchParams.get('sessionIndex')!) : undefined;
  const isReschedule = !!rescheduleId;

  // Override with URL params if provided
  const typeParam = searchParams.get('type') || sessionType;
  const bundleParam = searchParams.get('bundle') ? parseInt(searchParams.get('bundle')!) : bundleSize;

  const [selectedSessions, setSelectedSessions] = useState<SessionSelection[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [oldBooking, setOldBooking] = useState<any>(null);
  const [confirmReschedule, setConfirmReschedule] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [updatedBooking, setUpdatedBooking] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  // Load old booking if reschedule mode
  useEffect(() => {
    if (!isReschedule || !rescheduleId) return;

    const fetchOldBooking = async () => {
      try {
        console.log('📋 Fetching old booking:', rescheduleId);
        const response = await fetch(`/api/bookings/${rescheduleId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Error fetching booking:', response.status, errorData);
          return;
        }
        
        const booking = await response.json();
        setOldBooking(booking);
        console.log('✅ Old booking loaded:', booking);
      } catch (error) {
        console.error('❌ Error fetching old booking:', error);
      }
    };

    fetchOldBooking();
  }, [isReschedule, rescheduleId]);

  // Fetch available dates for the entire month
  useEffect(() => {
    const fetchMonthAvailability = async () => {
      try {
        const monthParam = format(startOfMonth(displayMonth), 'yyyy-MM-dd');

        const response = await fetch(
          `/api/appointment/available-slots?month=${monthParam}`
        );

        if (!response.ok) {
          console.error('Error fetching month slots:', await response.json());
          return;
        }

        const data = await response.json();
        setAvailableDates(new Set(data.availableDates || []));
      } catch (error) {
        console.error('Error fetching month availability:', error);
      }
    };

    fetchMonthAvailability();
  }, [displayMonth]);

  // Fetch slots for selected date
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setSelectedSlot(null);
      try {
        const response = await fetch(
          `/api/appointment/available-slots?date=${selectedDate}`
        );

        if (!response.ok) {
          console.error('Error fetching slots:', await response.json());
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSlots(data.slots || []);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  const handleSelectSlot = (slotId: string, slot: Slot) => {
    setSelectedSlot(slotId);
  };

  const handleConfirmSession = () => {
    if (!selectedSlot) return;
    
    const slot = slots.find(s => s.id === selectedSlot);
    if (!slot) return;

    if (isReschedule) {
      // For reschedule, just confirm and show modal
      setConfirmReschedule(true);
    } else {
      // For normal booking, add to sessions
      const newSelection: SessionSelection = {
        date: selectedDate,
        slotId: selectedSlot,
        startTime: slot.start_time,
        endTime: slot.end_time,
      };

      const newSessions = [...selectedSessions, newSelection];
      setSelectedSessions(newSessions);

      // If all sessions selected, proceed to confirmation
      if (newSessions.length === bundleParam) {
        proceedToConfirmation(newSessions);
      } else {
        // Move to next session selection
        setCurrentSessionIndex(newSessions.length);
        setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'));
        setSelectedSlot(null);
      }
    }
  };

  const proceedToConfirmation = (sessions: SessionSelection[]) => {
    // Pass data via router.push with state instead of URL params
    router.push(`/appointment/confirm?type=${typeParam}&bundle=${bundleParam}`, {
      scroll: false,
    });
    
    // Store sessions in sessionStorage for retrieval on confirm page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingSessionDates', JSON.stringify(sessions));
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSlot || !rescheduleId) return;

    setRescheduling(true);
    try {
      const slot = slots.find(s => s.id === selectedSlot);
      if (!slot) throw new Error('Slot not found');

      const response = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: rescheduleId,
          newSlotId: selectedSlot,
          newDate: selectedDate,
          newStartTime: slot.start_time,
          newEndTime: slot.end_time,
          sessionIndex: rescheduleSessionIndex,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Reschedule error:', data);
        alert(data.error || 'Failed to reschedule');
        return;
      }

      console.log('✅ Session rescheduled:', data);
      setUpdatedBooking(data.booking);
      setConfirmReschedule(false);
      setRescheduleSuccess(true);
    } catch (error) {
      console.error('Reschedule error:', error);
      alert('Failed to reschedule session');
    } finally {
      setRescheduling(false);
    }
  };

  const handleBack = () => {
    if (currentSessionIndex > 0) {
      const newSessions = selectedSessions.slice(0, -1);
      setSelectedSessions(newSessions);
      setCurrentSessionIndex(newSessions.length);
      setSelectedDate(newSessions[newSessions.length - 1]?.date || format(new Date(), 'yyyy-MM-dd'));
      setSelectedSlot(null);
    } else {
      router.back();
    }
  };

  // Generate calendar dates
  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const prevMonthDays = Array(firstDayOfWeek)
    .fill(null)
    .map((_, i) => addDays(monthStart, -(firstDayOfWeek - i)));

  const allCalendarDays = [...prevMonthDays, ...calendarDays];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Therapist Header */}
        <TherapistHeader languages={['Hindi', 'English']} />

        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-5xl font-bold text-gray-900">
              {isReschedule
                ? 'Reschedule Your Session'
                : bundleParam === 1 
                ? 'Select Date & Time'
                : `Select Session ${currentSessionIndex + 1} of ${bundleParam}`}
            </h1>
            {bundleParam > 1 && !isReschedule && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-purple-600">{currentSessionIndex + 1} / {bundleParam}</p>
              </div>
            )}
          </div>
          <p className="text-gray-600">
            Session Type: <span className="font-semibold capitalize text-purple-600">{typeParam} Therapy</span>
            {bundleParam > 1 && ` • Bundle: ${bundleParam} Sessions`}
          </p>
        </motion.div>

        {/* Show previously selected sessions if bundle */}
        {bundleParam > 1 && selectedSessions.length > 0 && !isReschedule && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-xl"
          >
            <p className="font-semibold text-gray-900 mb-3">Previously Selected Sessions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedSessions.map((session, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-purple-100">
                  <p className="text-sm text-gray-600">Session {idx + 1}</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(session.date), 'MMM dd, yyyy')} • {session.startTime}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Month Navigation */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setDisplayMonth(addDays(displayMonth, -30))}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  ←
                </button>
                <h3 className="font-bold text-lg">{format(displayMonth, 'MMMM yyyy')}</h3>
                <button
                  onClick={() => setDisplayMonth(addDays(displayMonth, 30))}
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  →
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {allCalendarDays.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
                  const isSelected = dateStr === selectedDate;
                  const isPast = day < new Date() && day.getDate() !== new Date().getDate();
                  const isAvailable = availableDates.has(dateStr);
                  const isAlreadyBooked = selectedSessions.some(s => s.date === dateStr);

                  return (
                    <motion.button
                      key={idx}
                      variants={itemVariants}
                      onClick={() => !isPast && isCurrentMonth && !isAlreadyBooked && setSelectedDate(dateStr)}
                      disabled={isPast || !isCurrentMonth || isAlreadyBooked}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : isAlreadyBooked
                            ? 'bg-green-200 text-green-900 cursor-not-allowed'
                            : isAvailable && isCurrentMonth
                              ? 'bg-green-100 text-green-900 hover:bg-green-200'
                              : isCurrentMonth
                                ? 'bg-gray-100 text-gray-900 hover:bg-purple-100'
                                : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title={isAlreadyBooked ? 'Already selected for this bundle' : ''}
                    >
                      {day.getDate()}
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded border border-green-300"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded border border-purple-600"></div>
                  <span>Selected</span>
                </div>
                {bundleParam > 1 && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 rounded border border-green-300"></div>
                    <span>Already booked</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Slots */}
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Available Slots for {format(new Date(selectedDate), 'MMM dd, yyyy')}
              </h3>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading slots...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No available slots for this date</p>
                  <p className="text-sm text-gray-400">Please select another date</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {slots.map((slot) => (
                      <motion.button
                        key={slot.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleSelectSlot(slot.id, slot)}
                        className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                          selectedSlot === slot.id
                            ? 'border-purple-600 bg-purple-50 text-purple-600'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-lg">{slot.start_time}</div>
                        <div className="text-xs text-gray-500">- {slot.end_time}</div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={handleBack}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-gray-400 transition-colors"
                    >
                      {currentSessionIndex > 0 ? 'Back' : 'Go Back'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={handleConfirmSession}
                      disabled={!selectedSlot}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedSlot
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isReschedule
                        ? 'Review Reschedule'
                        : currentSessionIndex < bundleParam - 1 
                        ? `Continue (${currentSessionIndex + 1}/${bundleParam})`
                        : 'Confirm & Continue'}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reschedule Confirmation Modal */}
        <AnimatePresence>
          {confirmReschedule && oldBooking && selectedSlot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmReschedule(false)}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Reschedule</h2>

                <div className="space-y-4 mb-6">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-gray-600 mb-1">Current Session</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(oldBooking.slot.date), 'MMM dd, yyyy')} • {oldBooking.slot.start_time.substring(0, 5)}
                    </p>
                  </div>

                  <div className="text-center text-gray-600">↓</div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">New Session</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(selectedDate), 'MMM dd, yyyy')} • {slots.find(s => s.id === selectedSlot)?.start_time.substring(0, 5)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  No charges will be applied. The old slot will be freed up.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmReschedule(false)}
                    disabled={rescheduling}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={rescheduling}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {rescheduling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Confirming...
                      </>
                    ) : (
                      'Confirm Reschedule'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reschedule Success Modal */}
        <AnimatePresence>
          {rescheduleSuccess && updatedBooking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setRescheduleSuccess(false);
                router.push('/profile');
              }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              >
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Session Rescheduled!</h2>
                <p className="text-center text-gray-600 mb-6">Your therapy session has been successfully rescheduled.</p>

                {/* New Session Details */}
                <div className="space-y-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">New Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(updatedBooking.slot_date), 'MMM dd, yyyy')} • {updatedBooking.slot_start_time.substring(0, 5)} - {updatedBooking.slot_end_time.substring(0, 5)}
                    </p>
                  </div>

                  {/* Meeting Link */}
                  {updatedBooking.meeting_link && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Meeting Link</p>
                      <a
                        href={updatedBooking.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium break-all"
                      >
                        {updatedBooking.meeting_link}
                      </a>
                    </div>
                  )}

                  {/* For bundle bookings */}
                  {updatedBooking.number_of_sessions && updatedBooking.number_of_sessions > 1 && updatedBooking.meeting_links && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Meeting Link (Session {rescheduleSessionIndex ? rescheduleSessionIndex + 1 : 1})</p>
                      <a
                        href={updatedBooking.meeting_links[rescheduleSessionIndex || 0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium break-all"
                      >
                        {updatedBooking.meeting_links[rescheduleSessionIndex || 0]}
                      </a>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setRescheduleSuccess(false);
                    router.push('/profile');
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Back to Profile
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlotSelection;
