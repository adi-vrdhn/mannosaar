'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Mail, Phone, CreditCard, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface SessionCardProps {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  sessionType: 'personal' | 'couple';
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  meetingLink?: string;
  paymentStatus: string;
}

const SessionCard = ({
  id,
  userName,
  userEmail,
  userPhone,
  sessionType,
  slotDate,
  slotStartTime,
  slotEndTime,
  meetingLink,
  paymentStatus,
}: SessionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Main Info - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1">
          {/* Top Row: Name and Session Type */}
          <div className="flex items-center gap-3 mb-2">
            <p className="font-semibold text-gray-900">{userName}</p>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                sessionType === 'personal'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-pink-100 text-pink-800'
              }`}
            >
              {sessionType === 'personal' ? 'Personal' : 'Couple'}
            </span>
          </div>

          {/* Date and Time */}
          <p className="text-sm text-gray-600 mb-2">
            📅 {format(new Date(slotDate), 'MMM dd, yyyy')} • ⏰ {slotStartTime} - {slotEndTime}
          </p>

          {/* Meeting Link */}
          {meetingLink && (
            <p className="text-sm text-purple-600 font-medium truncate">
              🔗{' '}
              <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Meeting Link
              </a>
            </p>
          )}
        </div>

        {/* Chevron Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="ml-4 flex-shrink-0"
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </button>

      {/* Dropdown Details */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden border-t border-gray-200"
      >
        <div className="p-4 bg-gray-50 space-y-3">
          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">EMAIL</p>
              <a href={`mailto:${userEmail}`} className="text-sm text-purple-600 hover:underline">
                {userEmail}
              </a>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">PHONE</p>
              <a href={`tel:${userPhone}`} className="text-sm text-purple-600 hover:underline">
                {userPhone || 'Not provided'}
              </a>
            </div>
          </div>

          {/* Booking ID */}
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">BOOKING ID</p>
              <p className="text-sm text-gray-900 font-mono">{id.slice(0, 8).toUpperCase()}...</p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-3">
            <CreditCard size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">PAYMENT STATUS</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getPaymentStatusColor(
                  paymentStatus
                )}`}
              >
                {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionCard;
