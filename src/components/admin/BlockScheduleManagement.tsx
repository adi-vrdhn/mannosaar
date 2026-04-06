'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { generateDefaultSlots, getAvailableSlotsForDateRange } from '@/utils/slotGenerator';

interface BlockSchedule {
  id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  block_type: 'full_day' | 'time_range';
  reason?: string;
  created_at: string;
}

const BlockScheduleManagement = () => {
  const router = useRouter();
  const [blockSchedules, setBlockSchedules] = useState<BlockSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSlotSelector, setShowSlotSelector] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [availableSlots, setAvailableSlots] = useState<Array<{ date: string; time: string }>>([]);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    blockType: 'full_day' as 'full_day' | 'time_range',
    startTime: '09:00',
    endTime: '17:00',
    reason: '',
  });

  const supabase = createClient();

  // Fetch block schedules
  useEffect(() => {
    const fetchBlockSchedules = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/slots/block-schedules/get');
        if (response.ok) {
          const result = await response.json();
          setBlockSchedules(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching block schedules:', error);
      }
      setLoading(false);
    };

    fetchBlockSchedules();
  }, []);

  const handleShowSlotSelector = (startDate: string, endDate: string) => {
    setShowSlotSelector(true);
    const slots = getAvailableSlotsForDateRange(startDate, endDate);
    setAvailableSlots(slots);
    setSelectedSlots(new Set());
  };

  const handleToggleSlot = (slotId: string) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId);
    } else {
      newSelected.add(slotId);
    }
    setSelectedSlots(newSelected);
  };

  const handleSelectAllSlots = () => {
    if (selectedSlots.size === availableSlots.length) {
      setSelectedSlots(new Set());
    } else {
      setSelectedSlots(new Set(availableSlots.map((_, idx) => idx.toString())));
    }
  };

  const handleCreateBlockSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      // If slots are selected, block them specifically
      if (showSlotSelector && selectedSlots.size > 0) {
        const slotsToBlock = availableSlots.filter((_, idx) =>
          selectedSlots.has(idx.toString())
        );

        const response = await fetch('/api/admin/slots/block-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slots: slotsToBlock,
            reason: formData.reason || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert('Error blocking slots: ' + errorData.error);
          setLoading(false);
          return;
        }

        setShowCreateForm(false);
        setShowSlotSelector(false);
        setSelectedSlots(new Set());
        setAvailableSlots([]);
        setFormData({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          blockType: 'full_day',
          startTime: '09:00',
          endTime: '17:00',
          reason: '',
        });

        alert(`Successfully blocked ${slotsToBlock.length} slot(s). These slots will no longer be visible to customers.`);
      } else {
        // Block entire time range using block_schedules
        const blockData: any = {
          start_date: formData.startDate,
          end_date: formData.endDate,
          block_type: formData.blockType,
          reason: formData.reason || null,
        };

        if (formData.blockType === 'time_range') {
          blockData.start_time = formData.startTime;
          blockData.end_time = formData.endTime;
        }

        const response = await fetch('/api/admin/slots/block-schedules/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blockData),
        });

        if (response.ok) {
          // Refetch using API
          const fetchResponse = await fetch('/api/admin/slots/block-schedules/get');
          if (fetchResponse.ok) {
            const result = await fetchResponse.json();
            setBlockSchedules(result.data || []);
          }

          setShowCreateForm(false);
          setShowSlotSelector(false);
          setSelectedSlots(new Set());
          setAvailableSlots([]);
          setFormData({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            blockType: 'full_day',
            startTime: '09:00',
            endTime: '17:00',
            reason: '',
          });

          alert(`Successfully blocked from ${formData.startDate} to ${formData.endDate}. All slots for this period are now blocked and will not be visible to customers.`);
        } else {
          const errorData = await response.json();
          alert('Error creating block: ' + errorData.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error blocking slots');
    }

    setLoading(false);
  };

  const handleDeleteBlockSchedule = async (blockId: string) => {
    try {
      const response = await fetch('/api/admin/slots/block-schedules/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId }),
      });

      if (response.ok) {
        // Refetch updated list
        const fetchResponse = await fetch('/api/admin/slots/block-schedules/get');
        if (fetchResponse.ok) {
          const result = await fetchResponse.json();
          setBlockSchedules(result.data || []);
        } else {
          setBlockSchedules(blockSchedules.filter((b) => b.id !== blockId));
        }
      } else {
        const errorData = await response.json();
        alert('Error deleting block: ' + errorData.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting block schedule');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Block Schedule</h1>
          <p className="text-gray-600">Block entire days or specific time slots to prevent bookings</p>
        </motion.div>

        {/* Create Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mb-8 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Block Period'}
        </motion.button>

        {/* Create Form */}
        {showCreateForm && !showSlotSelector && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={(e) => handleCreateBlockSchedule(e)}
            className="mb-8 bg-white rounded-xl shadow-lg p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Block Type</label>
                <select
                  aria-label="Block Type"
                  value={formData.blockType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      blockType: e.target.value as 'full_day' | 'time_range',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="full_day">Full Day</option>
                  <option value="time_range">Time Range</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  aria-label="Block Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  aria-label="Block End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {formData.blockType === 'time_range' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                    <input
                      aria-label="Block Start Time"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                    <input
                      aria-label="Block End Time"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  type="button"
                  onClick={() => handleShowSlotSelector(formData.startDate, formData.endDate)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-4"
                >
                  Select Specific Slots
                </motion.button>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (optional)</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Conference, Vacation, Maintenance"
                rows={3}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Block Period
            </motion.button>
          </motion.form>
        )}

        {/* Slot Selector */}
        {showSlotSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Select Slots from {formData.startDate} to {formData.endDate}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleSelectAllSlots}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedSlots.size === availableSlots.length ? 'Deselect All' : 'Select All'}
              </motion.button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                Selected: <span className="font-semibold">{selectedSlots.size}</span> of{' '}
                <span className="font-semibold">{availableSlots.length}</span> slots
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
              {availableSlots.map((slot, idx) => (
                <motion.button
                  key={idx}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleToggleSlot(idx.toString())}
                  className={`p-3 rounded-lg border-2 transition-colors text-sm font-semibold ${
                    selectedSlots.has(idx.toString())
                      ? 'border-purple-600 bg-purple-100 text-purple-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                  }`}
                >
                  <div className="text-xs text-gray-600">{slot.date}</div>
                  <div>{slot.time}</div>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                type="button"
                onClick={() => {
                  setShowSlotSelector(false);
                  setSelectedSlots(new Set());
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                type="button"
                onClick={() => handleCreateBlockSchedule()}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Block Selected Slots
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Block Schedules List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Block Schedules</h2>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : blockSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No block schedules created</div>
          ) : (
            <div className="space-y-4">
              {blockSchedules.map((block) => (
                <motion.div
                  key={block.id}
                  variants={itemVariants}
                  className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {block.start_date} to {block.end_date}
                    </p>
                    {block.block_type === 'time_range' && (
                      <p className="text-sm text-gray-600">
                        Time: {block.start_time} - {block.end_time}
                      </p>
                    )}
                    {block.reason && <p className="text-sm text-gray-600">Reason: {block.reason}</p>}
                    <p className="text-xs text-gray-500">
                      Type: {block.block_type === 'full_day' ? 'Full Day' : 'Time Range'}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleDeleteBlockSchedule(block.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BlockScheduleManagement;
