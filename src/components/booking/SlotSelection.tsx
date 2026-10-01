'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getServiceById } from '@/lib/services';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sparkles,
} from 'lucide-react';

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

interface ExistingBooking {
  slot: {
    date: string;
    start_time: string;
  };
}

interface RescheduledBooking {
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  meeting_link?: string | null;
  number_of_sessions?: number | null;
  meeting_links?: string[] | null;
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
  const scheduleBundleId = searchParams.get('scheduleBundle');
  const recoveryTxnId = searchParams.get('recoverPayment');
  const scheduleBundleSessionIndex = searchParams.get('sessionIndex') ? parseInt(searchParams.get('sessionIndex')!, 10) : undefined;
  const isBundleFollowUp = Boolean(scheduleBundleId && Number.isInteger(scheduleBundleSessionIndex));

  // Override with URL params if provided
  const typeParam = searchParams.get('type') || sessionType;
  const selectedService = getServiceById(typeParam) || getServiceById('personal')!;
  const bundleParam = searchParams.get('bundle') ? parseInt(searchParams.get('bundle')!) : bundleSize;
  const bundleSchedule = searchParams.get('schedule') === 'progressive' ? 'progressive' : 'all';
  const sessionsToChooseNow = bundleParam > 1 && bundleSchedule === 'progressive' ? 1 : bundleParam;

  const [selectedSessions, setSelectedSessions] = useState<SessionSelection[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [oldBooking, setOldBooking] = useState<ExistingBooking | null>(null);
  const [confirmReschedule, setConfirmReschedule] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [schedulingNext, setSchedulingNext] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [updatedBooking, setUpdatedBooking] = useState<RescheduledBooking | null>(null);

  const formatTime = (time: string) => time.slice(0, 5);
  const todayString = format(new Date(), 'yyyy-MM-dd');

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

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  const handleConfirmSession = async () => {
    if (!selectedSlot) return;
    
    const slot = slots.find(s => s.id === selectedSlot);
    if (!slot) return;

    if (recoveryTxnId) {
      if (!session?.user?.id) {
        alert('Please sign in again to recover this payment.');
        return;
      }

      setSchedulingNext(true);
      try {
        const recoveredSession: SessionSelection = {
          date: selectedDate,
          slotId: selectedSlot,
          startTime: slot.start_time,
          endTime: slot.end_time,
        };
        const response = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            sessionType: typeParam,
            bundle: bundleParam,
            sessionDates: bundleParam > 1 ? [recoveredSession] : undefined,
            slotId: bundleParam === 1 ? selectedSlot : undefined,
            recoveryTxnId,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.booking?.id) {
          throw new Error(data.error || 'Unable to recover the paid booking.');
        }
        router.push(`/appointment/success?bookingId=${data.booking.id}`);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to recover the paid booking.');
      } finally {
        setSchedulingNext(false);
      }
    } else if (isBundleFollowUp && scheduleBundleId && Number.isInteger(scheduleBundleSessionIndex)) {
      setSchedulingNext(true);
      try {
        const response = await fetch('/api/bookings/schedule-bundle-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: scheduleBundleId,
            sessionIndex: scheduleBundleSessionIndex,
            slotId: selectedSlot,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to schedule this session.');
        router.push('/profile');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to schedule this session.');
      } finally {
        setSchedulingNext(false);
      }
    } else if (isReschedule) {
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
      if (newSessions.length === sessionsToChooseNow) {
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
    // Store selected appointment data for the next step.
    if (typeof window !== 'undefined') {
      if (bundleParam === 1) {
        sessionStorage.setItem('pendingConfirmationSlotInfo', JSON.stringify(sessions[0]));
        sessionStorage.removeItem('pendingSessionDates');
      } else {
        sessionStorage.setItem('pendingSessionDates', JSON.stringify(sessions));
        sessionStorage.removeItem('pendingConfirmationSlotInfo');
      }
    }

    const params = new URLSearchParams({
      type: typeParam,
      bundle: String(bundleParam),
      schedule: bundleSchedule,
    });

    if (bundleParam === 1) {
      const [singleSession] = sessions;
      params.set('slotId', singleSession.slotId);
    } else {
      // Keep a URL fallback as well as sessionStorage. This prevents a refresh,
      // remount, or interrupted navigation from losing the selected bundle slot.
      params.set('sessionDates', JSON.stringify(sessions));
    }

    router.push(`/appointment/confirm?${params.toString()}`, {
      scroll: false,
    });
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

      const responseText = await response.text();
      let data: { error?: string; message?: string; booking?: RescheduledBooking } = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: responseText || `Reschedule failed with status ${response.status}` };
      }

      if (!response.ok) {
        const message = data.error || `Unable to reschedule this session (${response.status}).`;
        console.warn('Reschedule request was rejected:', response.status, message);
        alert(message);
        return;
      }

      if (!data.booking) throw new Error('The server did not return the updated booking.');
      setUpdatedBooking(data.booking);
      setRescheduleMessage(data.message || 'Your session has been rescheduled and a new meeting link was created.');
      setConfirmReschedule(false);
      setRescheduleSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reschedule session';
      console.warn('Reschedule request failed:', message);
      alert(message);
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

  const goToProfile = () => {
    window.location.assign('/profile');
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
  const selectedSlotDetails = slots.find(slot => slot.id === selectedSlot);
  const confirmationLabel = isBundleFollowUp
    ? schedulingNext ? 'Scheduling…' : 'Confirm next session'
    : recoveryTxnId
    ? schedulingNext ? 'Recovering paid booking…' : 'Confirm paid booking'
    : isReschedule
    ? 'Review Reschedule'
    : currentSessionIndex < sessionsToChooseNow - 1
      ? `Continue (${currentSessionIndex + 1}/${sessionsToChooseNow})`
      : 'Confirm & Continue';

  if (!session) {
    return null;
  }

  return (
    <main className={`appointment-pinterest relative z-10 min-h-screen overflow-x-clip px-4 py-8 sm:px-6 sm:py-12 lg:px-8 ${selectedSlot ? '!pb-48 sm:!pb-44' : ''}`}>
      <div className="relative mx-auto max-w-6xl">
        <div className="appointment-orb appointment-orb-left" aria-hidden="true" />
        <div className="appointment-orb appointment-orb-right" aria-hidden="true" />

        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-9"
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <button type="button" onClick={handleBack} className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#4c4052] transition hover:text-[#5b267a]">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {currentSessionIndex > 0 ? 'Previous session' : 'Booking details'}
            </button>
            {!isReschedule && !isBundleFollowUp && (
              <div className="flex items-center gap-2" aria-label="Booking progress: step 3 of 3">
                <span className="h-1.5 w-4 rounded-full bg-white/65" />
                <span className="h-1.5 w-4 rounded-full bg-white/65" />
                <span className="h-1.5 w-9 rounded-full bg-[#5b267a]" />
                <span className="ml-1 text-xs font-bold uppercase tracking-[0.18em] text-[#4c4052]">3 of 3</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">
                <Sparkles className="h-3.5 w-3.5" />
                {isReschedule ? 'Reschedule' : isBundleFollowUp ? 'Bundle session' : 'Step 3'}
              </p>
              <h1 className="font-playfair text-[clamp(2.5rem,6vw,4.85rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[#34213f]">
                {isReschedule
                  ? 'Choose a new time'
                  : isBundleFollowUp
                  ? `Choose session ${(scheduleBundleSessionIndex || 0) + 1}`
                  : bundleParam === 1
                  ? 'Pick a date and time'
                  : bundleSchedule === 'progressive'
                  ? 'Pick your first session'
                  : `Pick session ${currentSessionIndex + 1} of ${bundleParam}`}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#4c4052]">
                Session type: <span className="font-bold capitalize text-[#5b267a]">{typeParam} Therapy</span>
                {bundleParam > 1 && ` • Bundle: ${bundleParam} Sessions${bundleSchedule === 'progressive' ? ' • One at a time' : ''}`}
              </p>
            </div>

            {bundleParam > 1 && !isReschedule && (
              <div className="inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/35 px-5 py-4 shadow-[0_12px_30px_rgba(60,31,79,0.07)] backdrop-blur lg:w-auto lg:self-start">
                <span className="text-sm font-semibold text-[#4c4052]">Bundle progress</span>
                <span className="text-lg font-bold text-[#5b267a]">
                  {bundleSchedule === 'progressive' ? `1 now · ${bundleParam} paid` : `${currentSessionIndex + 1} / ${bundleParam}`}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Show previously selected sessions if bundle */}
        {bundleParam > 1 && selectedSessions.length > 0 && !isReschedule && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mb-6 rounded-3xl border border-white/65 bg-white/40 p-5 shadow-[0_14px_36px_rgba(60,31,79,0.08)] backdrop-blur"
          >
            <p className="mb-3 font-semibold text-[#34213f]">Previously selected sessions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedSessions.map((session, idx) => (
                <div key={idx} className="rounded-2xl border border-white/60 bg-white/35 p-4">
                  <p className="text-sm text-[#65586c]">Session {idx + 1}</p>
                  <p className="font-semibold text-[#34213f]">
                    {format(new Date(session.date), 'MMM dd, yyyy')} • {session.startTime}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="relative z-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.5fr)] lg:gap-8">
          {/* Calendar */}
          <div>
            <div className="appointment-slot-card p-4 sm:p-5 lg:p-6">
              {/* Month Navigation */}
              <div className="mb-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}
                  aria-label="Previous month"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#80698f]/25 bg-white/35 text-[#4c4052] transition hover:border-[#5b267a]/50 hover:bg-white/60 hover:text-[#5b267a]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="font-playfair text-xl font-medium text-[#34213f]">{format(displayMonth, 'MMMM yyyy')}</h2>
                <button
                  type="button"
                  onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
                  aria-label="Next month"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#80698f]/25 bg-white/35 text-[#4c4052] transition hover:border-[#5b267a]/50 hover:bg-white/60 hover:text-[#5b267a]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="mb-3 grid grid-cols-7 gap-1 sm:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#6f6275] sm:text-xs">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-5">
                {allCalendarDays.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
                  const isSelected = dateStr === selectedDate;
                  const isPast = dateStr < todayString;
                  const isAvailable = availableDates.has(dateStr);
                  const isAlreadyBooked = selectedSessions.some(s => s.date === dateStr);

                  return (
                    <button
                      key={idx}
                      onClick={() => !isPast && isCurrentMonth && !isAlreadyBooked && setSelectedDate(dateStr)}
                      disabled={isPast || !isCurrentMonth || isAlreadyBooked}
                      className={`relative flex aspect-square items-center justify-center rounded-full border text-xs font-semibold transition-all sm:text-sm ${
                        isSelected
                          ? 'border-[#5b267a] bg-[#5b267a] text-white shadow-[0_6px_16px_rgba(91,38,122,0.24)]'
                          : isAlreadyBooked
                            ? 'cursor-not-allowed border-[#5b267a]/45 bg-[#80698f] text-white'
                            : isAvailable && isCurrentMonth
                              ? 'border-[#5b267a]/30 bg-white/55 text-[#34213f] hover:border-[#5b267a] hover:bg-[#eadff1]'
                              : isCurrentMonth
                                ? 'border-transparent bg-white/15 text-[#75677b] hover:bg-white/30'
                                : 'cursor-not-allowed border-transparent text-[#6f6275]/35'
                      }`}
                      title={isAlreadyBooked ? 'Already selected for this bundle' : ''}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="grid gap-2.5 border-t border-dashed border-[#80698f]/25 pt-4 text-xs font-medium text-[#5d5064] sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border border-[#5b267a]/40 bg-white/60"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#5b267a]"></div>
                  <span>Selected</span>
                </div>
                {bundleParam > 1 && (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#80698f]"></div>
                    <span>Already booked</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Slots */}
          <div>
            <div className="appointment-slot-card min-h-[31rem] p-5 sm:p-6 lg:p-8">
              <div className="mb-6 flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eadff1] text-[#5b267a]"><CalendarDays className="h-5 w-5" /></span>
                <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">
                  Available slots
                </p>
                <h2 className="font-playfair text-2xl font-medium text-[#34213f] sm:text-3xl">{format(new Date(selectedDate), 'EEEE, MMMM d')}</h2>
                <p className="mt-1 text-sm text-[#65586c]">Choose one time that works for you.</p>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-medium text-[#65586c]">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#5b267a]/25 border-t-[#5b267a]" /> Looking for open times…
                </div>
              ) : slots.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-[#80698f]/30 bg-white/20 px-6 py-10 text-center">
                  <Clock3 className="h-8 w-8 text-[#5b267a]/55" />
                  <p className="mt-4 font-semibold text-[#34213f]">No open times on this date</p>
                  <p className="mt-1 text-sm text-[#65586c]">Try another highlighted day on the calendar.</p>
                </div>
              ) : (
                <>
                  <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {slots.map((slot) => (
                      <motion.button
                        key={slot.id}
                        whileHover={{ y: -2 }}
                        onClick={() => handleSelectSlot(slot.id)}
                        aria-pressed={selectedSlot === slot.id}
                        className={`group w-full min-h-[108px] rounded-2xl border px-4 py-4 text-left transition-all ${
                          selectedSlot === slot.id
                            ? 'border-[#5b267a] bg-[#5b267a] text-white shadow-[0_10px_24px_rgba(91,38,122,0.2)]'
                            : 'border-[#80698f]/25 bg-white/30 text-[#34213f] hover:border-[#5b267a]/55 hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex items-center gap-2 text-lg font-bold"><Clock3 className={`h-4 w-4 ${selectedSlot === slot.id ? 'text-white/75' : 'text-[#5b267a]'}`} />{formatTime(slot.start_time)}</span>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selectedSlot === slot.id ? 'border-white bg-white text-[#5b267a]' : 'border-[#80698f]/35 text-transparent'}`}><Check className="h-3 w-3" strokeWidth={3} /></span>
                        </div>
                        <div className={`mt-4 flex items-center justify-between text-xs font-medium ${selectedSlot === slot.id ? 'text-white/75' : 'text-[#65586c]'}`}>
                          <span>Until {formatTime(slot.end_time)}</span>
                          <span>{selectedService.durationMinutes} mins</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                </>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedSlotDetails && !confirmReschedule && !rescheduleSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed inset-x-3 bottom-4 z-[100] sm:inset-x-6 sm:bottom-6"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-[1.4rem] border border-white/75 bg-[#f4eef8]/95 p-3 shadow-[0_18px_60px_rgba(63,25,83,0.24)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex min-w-0 items-center gap-3 px-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eadff1] text-[#5b267a]"><Clock3 className="h-4 w-4" /></span>
                  <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5b267a]">Selected time</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#34213f] sm:text-base">
                    {format(new Date(selectedDate), 'MMM dd, yyyy')} · {formatTime(selectedSlotDetails.start_time)}–{formatTime(selectedSlotDetails.end_time)}
                  </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmSession}
                  disabled={schedulingNext}
                  className="group flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#5b267a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#472061] focus:outline-none focus:ring-2 focus:ring-[#5b267a] focus:ring-offset-2 disabled:opacity-60 sm:text-base"
                >
                  {confirmationLabel}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="bg-white p-6 sm:p-8 shadow-2xl max-w-md w-full border border-gray-200"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Reschedule</h2>

                <div className="space-y-4 mb-6">
                  <div className="bg-red-50 p-4 border border-red-200">
                    <p className="text-sm text-gray-600 mb-1">Current Session</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(oldBooking.slot.date), 'MMM dd, yyyy')} • {oldBooking.slot.start_time.substring(0, 5)}
                    </p>
                  </div>

                  <div className="text-center text-gray-600">↓</div>

                  <div className="bg-green-50 p-4 border border-green-200">
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
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={rescheduling}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {rescheduling ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-b-transparent"></div>
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
                goToProfile();
              }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-6 sm:p-8 shadow-2xl max-w-md w-full border border-gray-200"
              >
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 bg-green-100 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Session Rescheduled!</h2>
                <p className="text-center text-gray-600 mb-6">{rescheduleMessage || 'Your therapy session has been successfully rescheduled.'}</p>

                {/* New Session Details */}
                <div className="space-y-4 mb-6 p-4 bg-purple-50 border border-purple-200">
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
                    goToProfile();
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition-all"
                >
                  Back to Profile
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default SlotSelection;
