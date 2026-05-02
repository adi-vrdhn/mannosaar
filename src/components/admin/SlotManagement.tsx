'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { generateDefaultSlots } from '@/utils/slotGenerator';

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

interface BlockedRange {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

const SlotManagement = () => {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGenerateDefaultForm, setShowGenerateDefaultForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
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
  const [selectedDays, setSelectedDays] = useState<boolean[]>([false, false, false, false, false, true, true]); // Mon-Sun, default Sat-Sun
  const [selectedHours, setSelectedHours] = useState<boolean[]>([
    true, true, true, true, true, true, true, true, true, true, true, true // 9AM to 8PM
  ]);
  const [previewSlots, setPreviewSlots] = useState<Array<{ start_time: string; end_time: string }>>([]);
  const [formData, setFormData] = useState({
    date: selectedDate,
    startTime: '09:00',
    endTime: '09:45',
  });

  const supabase = createClient();
  
  // State for all blocked slots (across all dates)
  const [allBlockedSlots, setAllBlockedSlots] = useState<Slot[]>([]);

  // Fetch slots for selected date with booking info
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        // Get all slots for the date
        const { data: allSlots, error: slotError } = await supabase
          .from('therapy_slots')
          .select('*')
          .eq('date', selectedDate)
          .order('start_time', { ascending: true });

        if (slotError || !allSlots) {
          setLoading(false);
          return;
        }

        // Get all bookings with user info
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            slot_id,
            id,
            user:users(name, email),
            slot:therapy_slots(date, start_time, end_time)
          `)
          .eq('status', 'confirmed');

        if (bookingError) {
          console.error('Error fetching bookings:', bookingError);
        }

        // Map bookings to slots
        const bookingsBySlotId = (bookings || []).reduce((acc: any, booking: any) => {
          acc[booking.slot_id] = {
            id: booking.id,
            user: booking.user,
          };
          return acc;
        }, {});

        // Add booking info to slots
        const slotsWithBooking = allSlots.map((slot: any) => ({
          ...slot,
          booking: bookingsBySlotId[slot.id],
        }));

        setSlots(slotsWithBooking);

        // Fetch blocked date ranges
        const { data: ranges } = await supabase
          .from('block_schedules')
          .select('*')
          .order('start_date', { ascending: true });

        setBlockedRanges(ranges || []);

        // Fetch ALL blocked slots (across all dates)
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

    fetchSlots();
  }, [selectedDate, supabase]);

  const handleGenerateDefaultPreview = (startDate: string, endDate: string) => {
    // Sample preview of default slots for one day
    const allDefaultSlots = generateDefaultSlots();
    const filteredSlots = allDefaultSlots.filter((_, idx) => selectedHours[idx]);
    setPreviewSlots(filteredSlots);
  };

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

      setShowGenerateDefaultForm(false);
      setPreviewSlots([]);
      setDefaultFormData({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 6), 'yyyy-MM-dd'),
      });

      alert(result.message || `Successfully saved ${slotsToInsert.length} slots!`);

      // Refetch slots
      const { data } = await supabase
        .from('therapy_slots')
        .select('*')
        .eq('date', selectedDate)
        .order('start_time', { ascending: true });

      if (data) setSlots(data);
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
      setShowCreateForm(false);

      // Refetch slots
      const { data } = await supabase
        .from('therapy_slots')
        .select('*')
        .eq('date', selectedDate)
        .order('start_time', { ascending: true });

      if (data) setSlots(data);

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

      setSlots(slots.map((s) => (s.id === slotId ? { ...s, is_blocked: !isBlocked } : s)));
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

      setSlots(slots.filter((s) => s.id !== slotId));
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

      setShowBlockForm(false);
      setBlockFormData({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        reason: '',
      });

      // Refetch blocked ranges
      const { data: ranges } = await supabase
        .from('block_schedules')
        .select('*')
        .order('start_date', { ascending: true });

      setBlockedRanges(ranges || []);
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

      setBlockedRanges(blockedRanges.filter((b) => b.id !== blockId));
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

      // Refetch slots
      const { data } = await supabase
        .from('therapy_slots')
        .select('*')
        .eq('date', selectedDate)
        .order('start_time', { ascending: true });

      if (data) setSlots(data);
    } catch (error) {
      console.error('Delete all slots error:', error);
      alert('Error deleting slots');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Go Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Manage Therapy Slots</h1>
          <p className="text-gray-600">Create and manage available therapy session slots</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex gap-4 flex-wrap">
          <input
            type="date"
            aria-label="Date Selector"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Single Slot'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              setShowGenerateDefaultForm(!showGenerateDefaultForm);
              if (!showGenerateDefaultForm) {
                handleGenerateDefaultPreview(
                  defaultFormData.startDate,
                  defaultFormData.endDate
                );
              } else {
                setPreviewSlots([]);
              }
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {showGenerateDefaultForm ? 'Cancel' : 'Generate Default Slots'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowBlockForm(!showBlockForm)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {showBlockForm ? 'Cancel' : 'Block Date Range'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleDeleteAllSlots}
            disabled={loading}
            className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50"
          >
            Delete All Slots
          </motion.button>
        </motion.div>

        {/* Generate Default Slots Form */}
        {showGenerateDefaultForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleGenerateDefault}
            className="mb-8 bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Default Slots</h2>
            <p className="text-gray-600 mb-4">
              Create slots with 40-minute duration and 20 minutes break between sessions.
            </p>

            {/* Date Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  aria-label="Generate Start Date"
                  type="date"
                  value={defaultFormData.startDate}
                  onChange={(e) => {
                    setDefaultFormData({ ...defaultFormData, startDate: e.target.value });
                    handleGenerateDefaultPreview(e.target.value, defaultFormData.endDate);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  aria-label="Generate End Date"
                  type="date"
                  value={defaultFormData.endDate}
                  onChange={(e) => {
                    setDefaultFormData({ ...defaultFormData, endDate: e.target.value });
                    handleGenerateDefaultPreview(defaultFormData.startDate, e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Day Selection */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Select Days of Week</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDays([true, true, true, true, true, true, true]);
                      handleGenerateDefaultPreview(defaultFormData.startDate, defaultFormData.endDate);
                    }}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDays([false, false, false, false, false, false, false]);
                      handleGenerateDefaultPreview(defaultFormData.startDate, defaultFormData.endDate);
                    }}
                    className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDays[idx]}
                      onChange={(e) => {
                        const newDays = [...selectedDays];
                        newDays[idx] = e.target.checked;
                        setSelectedDays(newDays);
                        handleGenerateDefaultPreview(defaultFormData.startDate, defaultFormData.endDate);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hour Selection */}
            <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Select Time Slots (9 AM to 8 PM)</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHours([true, true, true, true, true, true, true, true, true, true, true, true]);
                      handleGenerateDefaultPreview(defaultFormData.startDate, defaultFormData.endDate);
                    }}
                    className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHours([false, false, false, false, false, false, false, false, false, false, false, false]);
                      handleGenerateDefaultPreview(defaultFormData.startDate, defaultFormData.endDate);
                    }}
                    className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {['09:00-09:40', '10:00-10:40', '11:00-11:40', '12:00-12:40', '13:00-13:40', '14:00-14:40', '15:00-15:40', '16:00-16:40', '17:00-17:40', '18:00-18:40', '19:00-19:40', '20:00-20:40'].map((time, idx) => (
                  <label key={time} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedHours[idx]}
                      onChange={(e) => {
                        const newHours = [...selectedHours];
                        newHours[idx] = e.target.checked;
                        setSelectedHours(newHours);
                        handleGenerateDefaultPreview(defaultFormData.startDate, defaultFormData.endDate);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm font-medium text-gray-700">{time}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview Slots */}
            {previewSlots.length > 0 && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-3">Slot Preview (for each selected day):</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {previewSlots.map((slot, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-purple-200 text-sm">
                      {slot.start_time} - {slot.end_time}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Generate Slots
            </motion.button>
          </motion.form>
        )}

        {/* Block Date Range Form */}
        {showBlockForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleBlockDateRange}
            className="mb-8 bg-white rounded-xl shadow-lg p-6 border-2 border-red-200"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Block Date Range</h2>
            <p className="text-gray-600 mb-4">
              Block a range of dates. Users cannot book sessions during this period, but existing bookings will remain.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  aria-label="Block Start Date"
                  type="date"
                  value={blockFormData.startDate}
                  onChange={(e) => setBlockFormData({ ...blockFormData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  aria-label="Block End Date"
                  type="date"
                  value={blockFormData.endDate}
                  onChange={(e) => setBlockFormData({ ...blockFormData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (Optional)</label>
                <input
                  aria-label="Block Reason"
                  type="text"
                  placeholder="e.g., Personal leave, Vacation"
                  value={blockFormData.reason}
                  onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
            >
              Block Date Range
            </motion.button>
          </motion.form>
        )}

        {/* Blocked Date Ranges Section */}
        {blockedRanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 bg-red-50 rounded-xl shadow-lg border border-red-200 p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Blocked Date Ranges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blockedRanges.map((block) => (
                <motion.div
                  key={block.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white rounded-lg border border-red-300"
                >
                  <p className="font-semibold text-gray-900 mb-2">
                    {format(new Date(block.start_date), 'MMM dd')} - {format(new Date(block.end_date), 'MMM dd, yyyy')}
                  </p>
                  {block.reason && <p className="text-sm text-gray-600 mb-3">{block.reason}</p>}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleUnblockDateRange(block.id)}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600 transition-colors"
                  >
                    Unblock Range
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Remove Blocked Slots Section */}
        {allBlockedSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 bg-orange-50 rounded-xl shadow-lg border border-orange-300 p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Blocked Individual Slots</h2>
            <p className="text-gray-600 mb-6">These are individual slots you blocked. Click Unblock to make them available.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBlockedSlots.map((slot) => (
                <motion.div
                  key={slot.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white rounded-lg border-2 border-orange-300"
                >
                  <div className="mb-3">
                    <p className="font-semibold text-gray-900">
                      {slot.start_time} - {slot.end_time}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      {format(new Date(slot.date), 'MMM dd, yyyy')}
                    </p>
                    <span className="inline-block px-2 py-1 bg-orange-200 text-orange-800 text-xs font-semibold rounded">
                      Blocked
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      handleToggleBlock(slot.id, true);
                      setAllBlockedSlots(allBlockedSlots.filter(s => s.id !== slot.id));
                    }}
                    className="w-full px-3 py-2 bg-yellow-500 text-white rounded text-sm font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    Unblock
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Create Single Slot Form */}
        {showCreateForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateSlot}
            className="mb-8 bg-white rounded-xl shadow-lg p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  aria-label="Slot Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                <input
                  aria-label="Slot Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                <input
                  aria-label="Slot End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Create Slot
            </motion.button>
          </motion.form>
        )}

        {/* Slots List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Slots for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
            </h2>

            {loading ? (
              <div className="text-center py-12">Loading slots...</div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No slots created for this date</div>
            ) : (
              <>
                {/* Blocked Slots Section */}
                {slots.some(s => s.is_blocked) && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">Blocked</span>
                      {slots.filter(s => s.is_blocked).length} Slot(s)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slots
                        .filter(s => s.is_blocked)
                        .map((slot: any) => (
                          <motion.div
                            key={slot.id}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg border-2 border-red-300 bg-red-50"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {slot.start_time} - {slot.end_time}
                                </p>
                                <p className="text-sm text-gray-600">40 minutes</p>
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                                Blocked
                              </span>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={() => handleToggleBlock(slot.id, slot.is_blocked)}
                                className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded text-sm font-semibold hover:bg-yellow-600 transition-colors"
                              >
                                Unblock
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors bg-gray-500 text-white hover:bg-gray-600"
                              >
                                Delete
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Available & Booked Slots Section */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Active</span>
                    {slots.filter(s => !s.is_blocked).length} Slot(s)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots
                      .filter(s => !s.is_blocked)
                      .map((slot: any) => (
                        <motion.div
                          key={slot.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-lg border-2 ${
                            slot.booking
                              ? 'border-blue-300 bg-blue-50'
                              : slot.is_available
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {slot.start_time} - {slot.end_time}
                              </p>
                              <p className="text-sm text-gray-600">40 minutes</p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                slot.booking
                                  ? 'bg-blue-200 text-blue-800'
                                  : slot.is_available
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {slot.booking ? 'Booked' : slot.is_available ? 'Available' : 'Booked'}
                            </span>
                          </div>

                          {/* Show booking info if slot is booked */}
                          {slot.booking && (
                            <div className="mb-3 p-3 bg-white rounded border border-blue-200">
                              <p className="text-sm font-semibold text-gray-900">{slot.booking.user.name}</p>
                              <p className="text-xs text-gray-600">{slot.booking.user.email}</p>
                            </div>
                          )}

                          <div className="flex gap-2 mt-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleToggleBlock(slot.id, slot.is_blocked)}
                              disabled={slot.booking}
                              className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                                slot.booking
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : slot.is_blocked
                                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              {slot.is_blocked ? 'Unblock' : 'Block'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={slot.booking}
                              className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                                slot.booking
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-500 text-white hover:bg-gray-600'
                              }`}
                            >
                              Delete
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SlotManagement;
