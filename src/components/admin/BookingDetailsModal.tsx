'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { format } from 'date-fns';
import { Copy, X, Edit2, Save, XCircle } from 'lucide-react';

interface BookingDetailsModalProps {
  bookingId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

interface BookingDetails {
  id: string;
  user: {
    name: string;
    email: string;
    phone_number?: string;
  };
  slot: {
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
  };
  session_type: string;
  status: string;
  notes?: string | null;
  sessions_taken_before?: number | null;
  meeting_link?: string;
  meeting_links?: string[]; // for bundle bookings
  meeting_password?: string;
  created_at: string;
  cancelled_at?: string;
  number_of_sessions?: number; // for bundle bookings
  session_dates?: Array<{
    date: string;
    start_time: string;
    end_time: string;
    slotId: string;
  }>; // for bundle bookings
}

export default function BookingDetailsModal({
  bookingId,
  onClose,
  onRefresh,
}: BookingDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Manual date/time inputs
  const [newDate, setNewDate] = useState<string>('');
  const [newStartTime, setNewStartTime] = useState<string>('');
  const [newEndTime, setNewEndTime] = useState<string>('');
  const [postponeReason, setPostponeReason] = useState('');
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch booking details when modal opens
  if (bookingId && !loading && !booking && !error) {
    setLoading(true);
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  const handleClose = () => {
    setBooking(null);
    setError(null);
    setIsEditing(false);
    setNewDate('');
    setNewStartTime('');
    setNewEndTime('');
    setPostponeReason('');
    onClose();
  };

  const handleEditClick = () => {
    setIsEditing(true);
    if (booking) {
      setNewDate(booking.slot.date);
      setNewStartTime(booking.slot.start_time.substring(0, 5));
      // Calculate end time as 40 mins after start time
      const startDate = new Date(`2000-01-01 ${booking.slot.start_time}`);
      const endDate = new Date(startDate.getTime() + 40 * 60000);
      const hours = String(endDate.getHours()).padStart(2, '0');
      const mins = String(endDate.getMinutes()).padStart(2, '0');
      setNewEndTime(`${hours}:${mins}`);
    }
    setPostponeReason('');
    setUpdateMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewDate('');
    setNewStartTime('');
    setNewEndTime('');
    setPostponeReason('');
    setUpdateMessage(null);
  };

  const handleStartTimeChange = (e: string) => {
    setNewStartTime(e);
    // Auto-calculate end time as 40 mins after start time
    if (e) {
      const startDate = new Date(`2000-01-01 ${e}:00`);
      const endDate = new Date(startDate.getTime() + 40 * 60000);
      const hours = String(endDate.getHours()).padStart(2, '0');
      const mins = String(endDate.getMinutes()).padStart(2, '0');
      setNewEndTime(`${hours}:${mins}`);
    }
  };

  const handleUpdateBooking = async () => {
    if (!newDate || !newStartTime || !newEndTime) {
      setUpdateMessage({ type: 'error', text: 'Please enter date and time' });
      return;
    }

    // Format times to HH:MM:SS
    const startTimeFormatted = `${newStartTime}:00`;
    const endTimeFormatted = `${newEndTime}:00`;

    setUpdatingBooking(true);
    try {
      const response = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          newDate,
          newStartTime: startTimeFormatted,
          newEndTime: endTimeFormatted,
          reason: postponeReason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setUpdateMessage({ type: 'error', text: data.error || 'Failed to update booking' });
        return;
      }

      setUpdateMessage({
        type: 'success',
        text: 'Booking updated successfully! Email notification sent to client.',
      });

      // Refresh booking details
      setTimeout(() => {
        fetch(`/api/bookings/${bookingId}`)
          .then((res) => res.json())
          .then((data) => setBooking(data))
          .catch((err) => console.error('Error refreshing booking:', err));

        setIsEditing(false);
        setNewDate('');
        setNewStartTime('');
        setNewEndTime('');
        setPostponeReason('');

        if (onRefresh) {
          onRefresh();
        }

        setTimeout(() => setUpdateMessage(null), 3000);
      }, 1500);
    } catch (err) {
      setUpdateMessage({
        type: 'error',
        text: 'Error updating booking. Please try again.',
      });
    } finally {
      setUpdatingBooking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AnimatePresence>
      {bookingId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{isEditing ? 'Reschedule Booking' : 'Booking Details'}</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-purple-600 rounded-lg transition-colors"
                aria-label="Close booking details"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  Error loading booking: {error}
                </div>
              )}

              {booking && !isEditing && (
                <div className="space-y-6">
                  {/* Client Information */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                      Client Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Name</p>
                        <p className="text-lg font-semibold text-gray-900">{booking.user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="text-lg font-semibold text-gray-900 break-all">{booking.user.email}</p>
                      </div>
                      {booking.user.phone_number && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Phone</p>
                          <p className="text-lg font-semibold text-gray-900">{booking.user.phone_number}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Session Information */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                      Session Information
                    </h3>
                    {booking.number_of_sessions && booking.number_of_sessions > 1 ? (
                      // Bundle booking
                      <div className="space-y-3">
                        <div className="flex gap-2 mb-4">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                            Bundle: {booking.number_of_sessions} Sessions
                          </span>
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                            {booking.session_type}
                          </span>
                        </div>
                        {booking.session_dates && booking.session_dates.map((session, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                                Session {idx + 1} of {booking.number_of_sessions}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-600">Date</p>
                                <p className="font-semibold text-gray-900">{format(new Date(session.date), 'MMM dd, yyyy')}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Time</p>
                                <p className="font-semibold text-gray-900">{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Single booking
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Session Type</p>
                          <p className="text-lg font-semibold text-gray-900 capitalize">
                            {booking.session_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {format(new Date(booking.slot.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Time</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {booking.slot.start_time.substring(0, 5)} - {booking.slot.end_time.substring(0, 5)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Duration</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {booking.slot.duration_minutes} minutes
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Sessions Taken Before</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {booking.sessions_taken_before ?? 0}
                      </p>
                    </div>
                  </section>

                  {/* Client Note */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                      Client Note
                    </h3>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-sm text-gray-600 mb-2">Problem described before booking</p>
                      <p className="text-gray-900 whitespace-pre-wrap break-words">
                        {booking.notes || 'No note added'}
                      </p>
                    </div>
                  </section>

                  {/* Status Information */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                      Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Booking Status</p>
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Booked On</p>
                        <p className="text-sm text-gray-900">
                          {format(new Date(booking.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {booking.cancelled_at && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Cancelled On</p>
                          <p className="text-sm text-gray-900">
                            {format(new Date(booking.cancelled_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Meeting Information */}
                  {(booking.meeting_link || booking.meeting_links) && (
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-200">
                        Meeting Information
                      </h3>
                      <div className="space-y-3">
                        {booking.meeting_links && booking.meeting_links.length > 1 ? (
                          // Bundle bookings with multiple links
                          booking.meeting_links.map((link, idx) => (
                            <div key={idx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <p className="text-sm text-gray-600 mb-2">
                                Google Meet Link - Session {idx + 1}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-semibold break-all text-sm"
                                >
                                  {link}
                                </a>
                                <button
                                  onClick={() => copyToClipboard(link)}
                                  className="p-2 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                                  title="Copy link"
                                >
                                  <Copy size={18} className="text-blue-600" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Single booking
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-2">Google Meet Link</p>
                            <div className="flex items-center justify-between gap-2">
                              <a
                                href={booking.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold break-all"
                              >
                                {booking.meeting_link}
                              </a>
                              <button
                                onClick={() => copyToClipboard(booking.meeting_link!)}
                                className="p-2 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                                title="Copy link"
                              >
                                <Copy size={18} className="text-blue-600" />
                              </button>
                            </div>
                          </div>
                        )}

                        {booking.meeting_password && (
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-gray-600 mb-2">Meeting Password</p>
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-lg font-mono font-semibold text-gray-900">
                                {booking.meeting_password}
                              </code>
                              <button
                                onClick={() => copyToClipboard(booking.meeting_password!)}
                                className="p-2 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                                title="Copy password"
                              >
                                <Copy size={18} className="text-blue-600" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {copied && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                      ✓ Copied to clipboard
                    </div>
                  )}

                  {/* Edit Button */}
                  {booking.status === 'confirmed' && (
                    <>
                      {booking.number_of_sessions && booking.number_of_sessions > 1 ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800 font-medium">
                            📌 Bundle Booking - Rescheduling individual sessions is not supported yet.
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            To reschedule bundle bookings, please contact the client directly and create a new booking.
                          </p>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleEditClick}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <Edit2 size={20} />
                          Reschedule Booking
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              )}

              {isEditing && booking && (
                <div className="space-y-6">
                  {/* Current Session Info */}
                  <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Session</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(booking.slot.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Time</p>
                        <p className="font-semibold text-gray-900">
                          {booking.slot.start_time.substring(0, 5)} - {booking.slot.end_time.substring(0, 5)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Info Message */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium">ℹ️ Select from existing 40-minute slots</p>
                    <p className="text-xs text-blue-700 mt-1">If no slot is available for your desired date/time, please create new slots in Manage Slots first.</p>
                  </div>

                  {/* New Date Input */}
                  <section>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      New Date
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </section>

                  {/* New Start Time Input */}
                  <section>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Start Time (40-minute slots)
                    </label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </section>

                  {/* New End Time Display (Read-only) */}
                  <section>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      End Time (Auto-calculated)
                    </label>
                    <input
                      type="time"
                      value={newEndTime}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-600 mt-1">Automatically set to 40 minutes after start time</p>
                  </section>

                  {/* Postponement Reason */}
                  <section>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Reason for Rescheduling (Optional)
                    </label>
                    <textarea
                      value={postponeReason}
                      onChange={(e) => setPostponeReason(e.target.value)}
                      placeholder="e.g., Personal emergency, Schedule conflict..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      rows={3}
                    />
                  </section>

                  {/* Messages */}
                  {updateMessage && (
                    <div
                      className={`p-4 rounded-lg ${
                        updateMessage.type === 'success'
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}
                    >
                      {updateMessage.text}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdateBooking}
                      disabled={updatingBooking || !newDate || !newStartTime || !newEndTime}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      {updatingBooking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Update Booking
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelEdit}
                      disabled={updatingBooking}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <XCircle size={20} />
                      Cancel
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
