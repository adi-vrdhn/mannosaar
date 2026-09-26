'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { generateDefaultSlots } from '@/utils/slotGenerator';
import AdminSectionNav from './AdminSectionNav';
import { Ban, CalendarDays, CalendarPlus, Clock3, Trash2 } from 'lucide-react';

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_blocked: boolean;
  blocked_reason?: string;
}

interface SlotWithBooking extends Slot {
  booking?: {
    id: string;
    user: { name: string; email: string };
  };
}

interface ConfirmedBookingRecord {
  slot_id: string;
  id: string;
  user_name?: string | null;
  user_email?: string | null;
  user:
    | { name: string | null; email: string | null }
    | Array<{ name: string | null; email: string | null }>
    | null;
}

interface BlockedRange {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

type BlockMode = 'range' | 'specific';
type SlotPanel = 'open' | 'block' | 'manage';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const defaultTimeLabels = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

const displayDate = (value: string) => format(new Date(`${value}T00:00:00`), 'EEEE, MMMM d, yyyy');
const displayTime = (value: string) => format(new Date(`2000-01-01T${value}`), 'h:mm a');

const SlotManagement = () => {
  const [slots, setSlots] = useState<SlotWithBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activePanel, setActivePanel] = useState<SlotPanel>('manage');
  const [blockMode, setBlockMode] = useState<BlockMode>('range');
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [blockFormData, setBlockFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    reason: '',
  });
  const [defaultFormData, setDefaultFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 6), 'yyyy-MM-dd'),
  });
  const [selectedDays, setSelectedDays] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [selectedHours, setSelectedHours] = useState<boolean[]>([
    true, true, true, true, true, true, true, true, true, true, true, true // 9AM to 8PM
  ]);
  const [formData, setFormData] = useState({
    date: selectedDate,
    startTime: '09:00',
    endTime: '09:45',
  });

  const supabase = createClient();
  
  // State for all blocked slots (across all dates)
  const [allBlockedSlots, setAllBlockedSlots] = useState<Slot[]>([]);
  const [selectedSlotIdsToBlock, setSelectedSlotIdsToBlock] = useState<Set<string>>(new Set());

  const fetchSlotManagementData = async (date: string) => {
    setLoading(true);
    try {
      const { data: allSlots, error: slotError } = await supabase
        .from('therapy_slots')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });

      if (slotError || !allSlots) {
        setSlots([]);
      } else {
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            slot_id,
            id,
            user:users(name, email)
          `)
          .eq('status', 'confirmed');

        if (bookingError) {
          console.warn('Booking details are temporarily unavailable in slot management.');
        }

        const bookingsBySlotId = ((bookings || []) as ConfirmedBookingRecord[]).reduce<
          Record<string, SlotWithBooking['booking']>
        >((acc, booking) => {
          const bookingUser = Array.isArray(booking.user)
            ? booking.user[0]
            : booking.user;

          const userName = bookingUser?.name || booking.user_name || 'Client';
          const userEmail = bookingUser?.email || booking.user_email || '';

          if (!booking.slot_id) {
            return acc;
          }

          acc[booking.slot_id] = {
            id: booking.id,
            user: {
              name: userName,
              email: userEmail,
            },
          };
          return acc;
        }, {});

        const slotsWithBooking: SlotWithBooking[] = allSlots.map((slot: Slot) => ({
          ...slot,
          booking: bookingsBySlotId[slot.id],
        }));

        setSlots(slotsWithBooking);
      }

      const { data: ranges } = await supabase
        .from('block_schedules')
        .select('*')
        .order('start_date', { ascending: true });

      setBlockedRanges(ranges || []);

      const { data: blockedSlots, error: blockedError } = await supabase
        .from('therapy_slots')
        .select('*')
        .eq('is_blocked', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (!blockedError) {
        setAllBlockedSlots(blockedSlots || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots for selected date with booking info
  useEffect(() => {
    fetchSlotManagementData(selectedDate);
  }, [selectedDate, supabase]);

  useEffect(() => {
    setSelectedSlotIdsToBlock(new Set());
  }, [selectedDate]);

  const handleGenerateDefault = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one day and hour is selected
    if (!selectedDays.some(d => d)) {
      alert('Please select at least one day');
      return;
    }
    if (!selectedHours.some(h => h)) {
      alert('Please select at least one hour');
      return;
    }
    
    setLoading(true);

    try {
      const allDefaultSlots = generateDefaultSlots();
      const filteredSlots = allDefaultSlots.filter((_, idx) => selectedHours[idx]);
      
      const start = new Date(defaultFormData.startDate);
      const end = new Date(defaultFormData.endDate);

      const slotsToInsert = [];
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const selectedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon(0)-Sun(6)

        // Only create slots for selected days
        if (!selectedDays[selectedDayIndex]) {
          continue;
        }

        const dateStr = date.toISOString().split('T')[0];

        for (const slot of filteredSlots) {
          slotsToInsert.push({
            date: dateStr,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: true,
            is_blocked: false,
          });
        }
      }

      if (slotsToInsert.length === 0) {
        alert('No slots to create with the selected days and hours');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/slots/create-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: slotsToInsert }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error creating slots: ' + errorData.error);
        setLoading(false);
        return;
      }

      const result = await response.json();

      setActivePanel('manage');
      setSelectedDate(defaultFormData.startDate);
      setDefaultFormData({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 6), 'yyyy-MM-dd'),
      });

      alert(result.message || `Successfully saved ${slotsToInsert.length} slots!`);

      await fetchSlotManagementData(selectedDate);
    } catch (error) {
      console.error('Generate default slots error:', error);
      alert('Error creating slots');
    }

    setLoading(false);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/slots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error creating slot: ' + errorData.error);
        setLoading(false);
        return;
      }

      const result = await response.json();

      setFormData({
        date: selectedDate,
        startTime: '09:00',
        endTime: '09:45',
      });
      setActivePanel('manage');
      setSelectedDate(formData.date);

      await fetchSlotManagementData(selectedDate);

      alert(result.message || 'Slot saved successfully.');
    } catch (error) {
      console.error('Create slot error:', error);
      alert('Error creating slot');
    }

    setLoading(false);
  };

  const handleToggleBlock = async (slotId: string, isBlocked: boolean) => {
    try {
      const response = await fetch('/api/admin/slots/toggle-block', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, isBlocked }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error updating slot: ' + errorData.error);
        return;
      }

      await fetchSlotManagementData(selectedDate);
    } catch (error) {
      console.error('Toggle block error:', error);
      alert('Error updating slot');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const response = await fetch('/api/admin/slots/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error deleting slot: ' + errorData.error);
        return;
      }

      await fetchSlotManagementData(selectedDate);
    } catch (error) {
      console.error('Delete slot error:', error);
      alert('Error deleting slot');
    }
  };

  const handleBlockDateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/block-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: blockFormData.startDate,
          endDate: blockFormData.endDate,
          reason: blockFormData.reason || 'Therapy blocked',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error blocking dates: ' + errorData.error);
        setLoading(false);
        return;
      }

      setActivePanel('manage');
      setBlockFormData({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        reason: '',
      });
      await fetchSlotManagementData(selectedDate);
      alert('Date range blocked successfully!');
    } catch (error) {
      console.error('Block date range error:', error);
      alert('Error blocking date range');
    }

    setLoading(false);
  };

  const handleUnblockDateRange = async (blockId: string) => {
    try {
      const response = await fetch(`/api/admin/block-dates/${blockId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error unblocking dates: ' + errorData.error);
        return;
      }

      await fetchSlotManagementData(selectedDate);
      alert('Date range unblocked successfully!');
    } catch (error) {
      console.error('Unblock date range error:', error);
      alert('Error unblocking date range');
    }
  };

  const handleDeleteAllSlots = async () => {
    if (!confirm('Are you sure you want to delete all unbooked slots? Booked slots will be preserved.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/slots/delete-all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error deleting slots: ' + errorData.error);
        setLoading(false);
        return;
      }

      const result = await response.json();
      alert(`✅ Successfully deleted ${result.deletedCount} unbooked slots!\n⚠️ ${result.bookedCount} booked slots were preserved.`);

      await fetchSlotManagementData(selectedDate);
    } catch (error) {
      console.error('Delete all slots error:', error);
      alert('Error deleting slots');
    }

    setLoading(false);
  };

  const availableSlotsToBlock = slots.filter((slot) => !slot.is_blocked && !slot.booking);

  const handleToggleSelectedSlot = (slotId: string) => {
    setSelectedSlotIdsToBlock((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (nextSelection.has(slotId)) {
        nextSelection.delete(slotId);
      } else {
        nextSelection.add(slotId);
      }

      return nextSelection;
    });
  };

  const handleToggleAllSelectedSlots = () => {
    if (selectedSlotIdsToBlock.size === availableSlotsToBlock.length) {
      setSelectedSlotIdsToBlock(new Set());
      return;
    }

    setSelectedSlotIdsToBlock(
      new Set(availableSlotsToBlock.map((slot) => slot.id))
    );
  };

  const handleBlockSelectedSlots = async () => {
    if (selectedSlotIdsToBlock.size === 0) {
      alert('Please select at least one slot to block.');
      return;
    }

    setLoading(true);

    try {
      const slotsToBlock = availableSlotsToBlock
        .filter((slot) => selectedSlotIdsToBlock.has(slot.id))
        .map((slot) => ({
          date: slot.date,
          time: `${slot.start_time} - ${slot.end_time}`,
        }));

      const response = await fetch('/api/admin/slots/block-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: slotsToBlock,
          reason: blockFormData.reason || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error blocking slots: ' + errorData.error);
        setLoading(false);
        return;
      }

      setSelectedSlotIdsToBlock(new Set());
      setBlockFormData((current) => ({
        ...current,
        reason: '',
      }));
      await fetchSlotManagementData(selectedDate);
      alert('Selected slots blocked successfully!');
    } catch (error) {
      console.error('Block selected slots error:', error);
      alert('Error blocking selected slots');
    }

    setLoading(false);
  };

  const openSlotCount = slots.filter(slot => !slot.is_blocked && slot.is_available && !slot.booking).length;
  const bookedSlotCount = slots.filter(slot => Boolean(slot.booking)).length;
  const blockedSlotCount = slots.filter(slot => slot.is_blocked).length;

  const panelOptions: Array<{ key: SlotPanel; label: string; helper: string; icon: typeof CalendarPlus }> = [
    { key: 'open', label: 'Open slots', helper: 'Add availability', icon: CalendarPlus },
    { key: 'block', label: 'Block time', helper: 'Days or hours', icon: Ban },
    { key: 'manage', label: 'Manage day', helper: 'Review existing slots', icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-12 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AdminSectionNav className="mb-8" />

        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b267a]">Availability</p>
          <h1 className="mt-2 font-playfair text-3xl font-semibold text-[#34213f] sm:text-4xl">Manage slots</h1>
          <p className="mt-2 text-sm text-slate-500">Open the hours you work and block the time you do not.</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {panelOptions.map(({ key, label, helper, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActivePanel(key)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                activePanel === key
                  ? 'border-[#5b267a] bg-[#5b267a] text-white'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-[#b99acb]'
              }`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${activePanel === key ? 'bg-white/15' : 'bg-[#f3eef6] text-[#5b267a]'}`}>
                <Icon size={19} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className={`mt-0.5 block text-xs ${activePanel === key ? 'text-white/70' : 'text-slate-500'}`}>{helper}</span>
              </span>
            </button>
          ))}
        </div>

        {activePanel === 'open' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <form onSubmit={handleGenerateDefault} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-950">Open regular hours</h2>
                <p className="mt-1 text-sm text-slate-500">Each session is 40 minutes with a 20-minute break.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  From
                  <input type="date" value={defaultFormData.startDate} onChange={event => setDefaultFormData(current => ({ ...current, startDate: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#5b267a] focus:outline-none" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Until
                  <input type="date" value={defaultFormData.endDate} onChange={event => setDefaultFormData(current => ({ ...current, endDate: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#5b267a] focus:outline-none" />
                </label>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Working days</p>
                  <button type="button" onClick={() => setSelectedDays(selectedDays.every(Boolean) ? Array(7).fill(false) : Array(7).fill(true))} className="text-xs font-semibold text-[#5b267a]">
                    {selectedDays.every(Boolean) ? 'Clear' : 'Select all'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {dayLabels.map((day, index) => (
                    <button key={day} type="button" onClick={() => setSelectedDays(current => current.map((value, dayIndex) => dayIndex === index ? !value : value))} className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${selectedDays[index] ? 'border-[#5b267a] bg-[#f3eef6] text-[#5b267a]' : 'border-slate-200 text-slate-500'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Hours</p>
                  <button type="button" onClick={() => setSelectedHours(selectedHours.every(Boolean) ? Array(12).fill(false) : Array(12).fill(true))} className="text-xs font-semibold text-[#5b267a]">
                    {selectedHours.every(Boolean) ? 'Clear' : 'Select all'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {defaultTimeLabels.map((time, index) => (
                    <button key={time} type="button" onClick={() => setSelectedHours(current => current.map((value, hourIndex) => hourIndex === index ? !value : value))} className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${selectedHours[index] ? 'border-[#5b267a] bg-[#f3eef6] text-[#5b267a]' : 'border-slate-200 text-slate-500'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !selectedDays.some(Boolean) || !selectedHours.some(Boolean)} className="mt-6 w-full rounded-lg bg-[#5b267a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4a1f64] disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? 'Opening slots…' : `Open ${selectedHours.filter(Boolean).length} selected hours`}
              </button>
            </form>

            <form onSubmit={handleCreateSlot} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-950">Add one custom slot</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">Date<input type="date" value={formData.date} onChange={event => setFormData(current => ({ ...current, date: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                <label className="text-sm font-medium text-slate-700">Starts<input type="time" value={formData.startTime} onChange={event => setFormData(current => ({ ...current, startTime: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                <label className="text-sm font-medium text-slate-700">Ends<input type="time" value={formData.endTime} onChange={event => setFormData(current => ({ ...current, endTime: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              </div>
              <button type="submit" disabled={loading} className="mt-5 rounded-lg border border-[#5b267a] px-5 py-2.5 text-sm font-semibold text-[#5b267a] hover:bg-[#f7f1fa] disabled:opacity-40">Add custom slot</button>
            </form>
          </motion.div>
        )}

        {activePanel === 'block' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-xl font-semibold text-slate-950">Block time</h2><p className="mt-1 text-sm text-slate-500">Choose whole days or exact hours.</p></div>
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button type="button" onClick={() => setBlockMode('range')} className={`rounded-md px-4 py-2 text-sm font-medium ${blockMode === 'range' ? 'bg-white text-[#5b267a] shadow-sm' : 'text-slate-600'}`}>Whole days</button>
                  <button type="button" onClick={() => setBlockMode('specific')} className={`rounded-md px-4 py-2 text-sm font-medium ${blockMode === 'specific' ? 'bg-white text-[#5b267a] shadow-sm' : 'text-slate-600'}`}>Hours on a day</button>
                </div>
              </div>

              {blockMode === 'range' ? (
                <form onSubmit={handleBlockDateRange}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700">From<input type="date" value={blockFormData.startDate} onChange={event => setBlockFormData(current => ({ ...current, startDate: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                    <label className="text-sm font-medium text-slate-700">Until<input type="date" value={blockFormData.endDate} onChange={event => setBlockFormData(current => ({ ...current, endDate: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                    <label className="text-sm font-medium text-slate-700">Reason <span className="font-normal text-slate-400">(optional)</span><input type="text" value={blockFormData.reason} onChange={event => setBlockFormData(current => ({ ...current, reason: event.target.value }))} placeholder="Leave, holiday…" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                  </div>
                  <button type="submit" disabled={loading} className="mt-5 rounded-lg bg-[#5b267a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Block these days</button>
                </form>
              ) : (
                <div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Date<input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                    <label className="text-sm font-medium text-slate-700">Reason <span className="font-normal text-slate-400">(optional)</span><input type="text" value={blockFormData.reason} onChange={event => setBlockFormData(current => ({ ...current, reason: event.target.value }))} placeholder="Meeting, personal time…" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                  </div>
                  <div className="mt-5 flex items-center justify-between"><p className="text-sm font-medium text-slate-700">Select hours</p>{availableSlotsToBlock.length > 0 && <button type="button" onClick={handleToggleAllSelectedSlots} className="text-xs font-semibold text-[#5b267a]">{selectedSlotIdsToBlock.size === availableSlotsToBlock.length ? 'Clear' : 'Select all'}</button>}</div>
                  {availableSlotsToBlock.length === 0 ? (
                    <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No open hours to block on this date.</div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {availableSlotsToBlock.map(slot => {
                        const selected = selectedSlotIdsToBlock.has(slot.id);
                        return <button key={slot.id} type="button" onClick={() => handleToggleSelectedSlot(slot.id)} className={`rounded-lg border px-3 py-3 text-sm font-medium ${selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'}`}>{displayTime(slot.start_time)} – {displayTime(slot.end_time)}</button>;
                      })}
                    </div>
                  )}
                  <button type="button" onClick={handleBlockSelectedSlots} disabled={loading || selectedSlotIdsToBlock.size === 0} className="mt-5 rounded-lg bg-[#5b267a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Block selected hours</button>
                </div>
              )}
            </section>

            {(blockedRanges.length > 0 || allBlockedSlots.length > 0) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-slate-950">Currently blocked</h2>
                <div className="mt-4 divide-y divide-slate-100">
                  {blockedRanges.map(block => (
                    <div key={block.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="text-sm font-medium text-slate-900">{format(new Date(`${block.start_date}T00:00:00`), 'MMM d')} – {format(new Date(`${block.end_date}T00:00:00`), 'MMM d, yyyy')}</p><p className="mt-0.5 text-xs text-slate-500">{block.reason || 'Full day block'}</p></div>
                      <button type="button" onClick={() => handleUnblockDateRange(block.id)} className="text-sm font-semibold text-[#5b267a]">Unblock days</button>
                    </div>
                  ))}
                  {allBlockedSlots.map(slot => (
                    <div key={slot.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="text-sm font-medium text-slate-900">{format(new Date(`${slot.date}T00:00:00`), 'MMM d, yyyy')} · {displayTime(slot.start_time)} – {displayTime(slot.end_time)}</p><p className="mt-0.5 text-xs text-slate-500">{slot.blocked_reason || 'Blocked hour'}</p></div>
                      <button type="button" onClick={() => handleToggleBlock(slot.id, true)} className="text-sm font-semibold text-[#5b267a]">Unblock hour</button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {activePanel === 'manage' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="text-xl font-semibold text-slate-950">{displayDate(selectedDate)}</h2><p className="mt-1 text-sm text-slate-500">{openSlotCount} open · {bookedSlotCount} booked · {blockedSlotCount} blocked</p></div>
              <label className="text-sm font-medium text-slate-700">Choose date<input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" /></label>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading slots…</div>
            ) : slots.length === 0 ? (
              <div className="py-12 text-center"><p className="font-medium text-slate-800">No slots on this day</p><button type="button" onClick={() => { setFormData(current => ({ ...current, date: selectedDate })); setDefaultFormData(current => ({ ...current, startDate: selectedDate, endDate: selectedDate })); setActivePanel('open'); }} className="mt-3 text-sm font-semibold text-[#5b267a]">Open slots for this date</button></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {slots.map(slot => {
                  const status = slot.booking ? 'Booked' : slot.is_blocked ? 'Blocked' : slot.is_available ? 'Open' : 'Unavailable';
                  return (
                    <div key={slot.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3eef6] text-[#5b267a]"><Clock3 size={18} /></span>
                        <div><p className="font-semibold text-slate-900">{displayTime(slot.start_time)} – {displayTime(slot.end_time)}</p><p className="mt-0.5 text-xs text-slate-500">{slot.booking ? `${slot.booking.user.name}${slot.booking.user.email ? ` · ${slot.booking.user.email}` : ''}` : '40-minute session'}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${slot.booking ? 'bg-blue-50 text-blue-700' : slot.is_blocked ? 'bg-red-50 text-red-700' : slot.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{status}</span>
                        {!slot.booking && <button type="button" onClick={() => handleToggleBlock(slot.id, slot.is_blocked)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{slot.is_blocked ? 'Unblock' : 'Block'}</button>}
                        {!slot.booking && <button type="button" onClick={() => handleDeleteSlot(slot.id)} aria-label={`Delete ${displayTime(slot.start_time)} slot`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 border-t border-slate-100 pt-5">
              <button type="button" onClick={handleDeleteAllSlots} disabled={loading} className="text-xs font-medium text-slate-400 hover:text-red-600 disabled:opacity-40">Delete all unbooked slots…</button>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default SlotManagement;
