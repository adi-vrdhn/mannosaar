'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  // Fetch available dates for the entire month
  useEffect(() => {
    const fetchMonthAvailability = async () => {
      try {
        const monthStart = startOfMonth(displayMonth);
        const monthEnd = endOfMonth(displayMonth);
        
        const { data: monthSlots, error } = await supabase
          .from('therapy_slots')
          .select('date, id')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd'))
          .eq('is_available', true)
          .eq('is_blocked', false);

        if (error) {
          console.error('Error fetching month slots:', error);
          return;
        }

        const { data: bookings } = await supabase
          .from('bookings')
          .select('slot_id')
          .eq('status', 'confirmed');

        const bookedSlotIds = new Set(bookings?.map(b => b.slot_id) || []);

        const { data: blockedRanges } = await supabase
          .from('block_schedules')
          .select('start_date, end_date')
          .lte('start_date', format(monthEnd, 'yyyy-MM-dd'))
          .gte('end_date', format(monthStart, 'yyyy-MM-dd'));

        const blockedDates = new Set<string>();
        blockedRanges?.forEach(range => {
          let current = new Date(range.start_date);
          while (current <= new Date(range.end_date)) {
            blockedDates.add(format(current, 'yyyy-MM-dd'));
            current = addDays(current, 1);
          }
        });

        const available = new Set<string>();
        const today = format(new Date(), 'yyyy-MM-dd');
        
        monthSlots?.forEach((slot: any) => {
          if (!bookedSlotIds.has(slot.id) && !blockedDates.has(slot.date) && slot.date >= today) {
            available.add(slot.date);
          }
        });

        setAvailableDates(available);
      } catch (error) {
        console.error('Error fetching month availability:', error);
      }
    };

    fetchMonthAvailability();
  }, [displayMonth, supabase]);

  // Fetch slots for selected date
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setSelectedSlot(null);
      try {
        const { data: allSlots, error } = await supabase
          .from('therapy_slots')
          .select('*')
          .eq('date', selectedDate)
          .eq('is_available', true)
          .eq('is_blocked', false)
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching slots:', error);
          setLoading(false);
          return;
        }

        const { data: bookings } = await supabase
          .from('bookings')
          .select('slot_id')
          .eq('status', 'confirmed');

        const bookedSlotIds = bookings?.map(b => b.slot_id) || [];

        const { data: blockedRanges } = await supabase
          .from('block_schedules')
          .select('start_date, end_date')
          .lte('start_date', selectedDate)
          .gte('end_date', selectedDate);

        const isDateBlocked = blockedRanges && blockedRanges.length > 0;

        let availableSlots = (allSlots || []).filter(
          slot => !bookedSlotIds.includes(slot.id) && !isDateBlocked
        );

        const today = format(new Date(), 'yyyy-MM-dd');
        if (selectedDate === today) {
          const currentTime = format(new Date(), 'HH:mm');
          availableSlots = availableSlots.filter(slot => slot.start_time > currentTime);
        }

        setSlots(availableSlots);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, supabase]);

  const handleSelectSlot = (slotId: string, slot: Slot) => {
    setSelectedSlot(slotId);
  };

  const handleConfirmSession = () => {
    if (!selectedSlot) return;
    
    const slot = slots.find(s => s.id === selectedSlot);
    if (!slot) return;

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
  };

  const proceedToConfirmation = (sessions: SessionSelection[]) => {
    const params = new URLSearchParams({
      type: typeParam,
      bundle: bundleParam.toString(),
      sessionDates: JSON.stringify(sessions),
    });
    router.push(`/appointment/confirm?${params.toString()}`);
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
              {bundleParam === 1 
                ? 'Select Date & Time'
                : `Select Session ${currentSessionIndex + 1} of ${bundleParam}`}
            </h1>
            {bundleParam > 1 && (
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
        {bundleParam > 1 && selectedSessions.length > 0 && (
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
                      {currentSessionIndex < bundleParam - 1 
                        ? `Continue (${currentSessionIndex + 1}/${bundleParam})`
                        : 'Confirm & Continue'}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SlotSelection;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  // Fetch available dates for the entire month
  useEffect(() => {
    const fetchMonthAvailability = async () => {
      try {
        const monthStart = startOfMonth(displayMonth);
        const monthEnd = endOfMonth(displayMonth);
        
        // Get all slots for this month
        const { data: monthSlots, error } = await supabase
          .from('therapy_slots')
          .select('date, id')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd'))
          .eq('is_available', true)
          .eq('is_blocked', false);

        if (error) {
          console.error('Error fetching month slots:', error);
          return;
        }

        // Get booked slot IDs
        const { data: bookings } = await supabase
          .from('bookings')
          .select('slot_id')
          .eq('status', 'confirmed');

        const bookedSlotIds = new Set(bookings?.map(b => b.slot_id) || []);

        // Get blocked date ranges
        const { data: blockedRanges } = await supabase
          .from('block_schedules')
          .select('start_date, end_date')
          .lte('start_date', format(monthEnd, 'yyyy-MM-dd'))
          .gte('end_date', format(monthStart, 'yyyy-MM-dd'));

        const blockedDates = new Set<string>();
        blockedRanges?.forEach(range => {
          let current = new Date(range.start_date);
          while (current <= new Date(range.end_date)) {
            blockedDates.add(format(current, 'yyyy-MM-dd'));
            current = addDays(current, 1);
          }
        });

        // Get available dates (excluding booked, blocked, and past dates)
        const available = new Set<string>();
        const today = format(new Date(), 'yyyy-MM-dd');
        
        monthSlots?.forEach((slot: any) => {
          if (!bookedSlotIds.has(slot.id) && !blockedDates.has(slot.date) && slot.date >= today) {
            available.add(slot.date);
          }
        });

        setAvailableDates(available);
      } catch (error) {
        console.error('Error fetching month availability:', error);
      }
    };

    fetchMonthAvailability();
  }, [displayMonth, supabase]);

  // Fetch slots for selected date (excluding booked and blocked slots)
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        // Get all slots for this date
        const { data: allSlots, error } = await supabase
          .from('therapy_slots')
          .select('*')
          .eq('date', selectedDate)
          .eq('is_available', true)
          .eq('is_blocked', false)
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching slots:', error);
          setLoading(false);
          return;
        }

        // Get booked slot IDs
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select('slot_id')
          .eq('status', 'confirmed');

        if (bookingError) {
          console.error('Error fetching bookings:', bookingError);
        }

        const bookedSlotIds = bookings?.map(b => b.slot_id) || [];

        // Get blocked date ranges
        const { data: blockedRanges, error: blockError } = await supabase
          .from('block_schedules')
          .select('start_date, end_date')
          .lte('start_date', selectedDate)
          .gte('end_date', selectedDate);

        if (blockError) {
          console.error('Error fetching blocked ranges:', blockError);
        }

        // Check if current date is in any blocked range
        const isDateBlocked = blockedRanges && blockedRanges.length > 0;

        // Filter out booked slots and blocked dates
        let availableSlots = (allSlots || []).filter(
          slot => !bookedSlotIds.includes(slot.id) && !isDateBlocked
        );

        // If selected date is today, filter out past times
        const today = format(new Date(), 'yyyy-MM-dd');
        if (selectedDate === today) {
          const currentTime = format(new Date(), 'HH:mm');
          availableSlots = availableSlots.filter(slot => slot.start_time > currentTime);
        }

        setSlots(availableSlots);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, supabase]);

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  const handleNext = () => {
    if (selectedSlot) {
      // Store selection in URL and navigate to confirmation
      router.push(
        `/appointment/confirm?type=${sessionType}&slotId=${selectedSlot}&date=${selectedDate}`
      );
    }
  };

  // Generate calendar dates
  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add previous month's days to fill the grid
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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Select Date & Time</h1>
          <p className="text-gray-600">
            Session Type: <span className="font-semibold capitalize text-purple-600">{sessionType} Therapy</span>
          </p>
        </motion.div>

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

                  return (
                    <motion.button
                      key={idx}
                      variants={itemVariants}
                      onClick={() => !isPast && isCurrentMonth && setSelectedDate(dateStr)}
                      disabled={isPast || !isCurrentMonth}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : isAvailable && isCurrentMonth
                            ? 'bg-green-100 text-green-900 hover:bg-green-200'
                            : isCurrentMonth
                              ? 'bg-gray-100 text-gray-900 hover:bg-purple-100'
                              : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {day.getDate()}
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded border border-green-300"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded border border-purple-600"></div>
                  <span>Selected</span>
                </div>
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
                        onClick={() => handleSelectSlot(slot.id)}
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
                      onClick={() => router.back()}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:border-gray-400 transition-colors"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={handleNext}
                      disabled={!selectedSlot}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedSlot
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Continue
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SlotSelection;
