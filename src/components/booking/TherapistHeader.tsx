'use client';

import { motion } from 'framer-motion';

interface TherapistHeaderProps {
  languages?: string[];
}

export default function TherapistHeader({
  languages = ['Hindi', 'English'],
}: TherapistHeaderProps) {
  const languagesText = languages.join(' and ');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session Time Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2, boxShadow: '0 16px 32px rgba(168, 85, 247, 0.12)' }}
          className="rounded-2xl border border-purple-100 bg-white px-5 py-4 md:px-6 md:py-5 shadow-sm transition-all"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 mb-2">
            Session Time
          </p>
          <div className="flex items-end gap-2">
            <p className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">40</p>
            <p className="pb-1 text-sm md:text-base font-medium text-gray-600">mins</p>
          </div>
        </motion.div>

        {/* Languages Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2, boxShadow: '0 16px 32px rgba(168, 85, 247, 0.12)' }}
          className="rounded-2xl border border-purple-100 bg-purple-50 px-5 py-4 md:px-6 md:py-5 shadow-sm transition-all"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 mb-2">
            Languages
          </p>
          <p className="text-lg md:text-xl font-semibold text-gray-900">{languagesText}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
